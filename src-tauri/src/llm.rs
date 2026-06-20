use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

const NIM_BASE_URL: &str = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL: &str = "meta/llama-3.3-70b-instruct";

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
struct ChatRequest<'a> {
    model: &'a str,
    messages: &'a [ChatMessage],
    temperature: f32,
    stream: bool,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ChoiceMessage,
}

#[derive(Deserialize)]
struct ChoiceMessage {
    content: String,
}

#[derive(Serialize, Clone)]
struct TokenPayload {
    #[serde(rename = "streamId")]
    stream_id: String,
    token: String,
}

#[derive(Serialize, Clone)]
struct DonePayload {
    #[serde(rename = "streamId")]
    stream_id: String,
}

#[derive(Serialize, Clone)]
struct ErrorPayload {
    #[serde(rename = "streamId")]
    stream_id: String,
    message: String,
}

fn api_key() -> Result<String, String> {
    std::env::var("NIM_API_KEY").map_err(|_| "NIM_API_KEY not set".to_string())
}

#[tauri::command]
pub async fn llm_chat(messages: Vec<ChatMessage>) -> Result<String, String> {
    let key = api_key()?;
    let client = reqwest::Client::new();

    let body = ChatRequest {
        model: DEFAULT_MODEL,
        messages: &messages,
        temperature: 0.5,
        stream: false,
    };

    let resp = client
        .post(NIM_BASE_URL)
        .bearer_auth(key)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("NIM API error {status}: {text}"));
    }

    let parsed: ChatResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(parsed
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .unwrap_or_default())
}

#[tauri::command]
pub async fn llm_chat_stream(
    app: AppHandle,
    stream_id: String,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    let key = match api_key() {
        Ok(k) => k,
        Err(e) => {
            let _ = app.emit(
                "llm-error",
                ErrorPayload {
                    stream_id: stream_id.clone(),
                    message: e.clone(),
                },
            );
            return Err(e);
        }
    };

    let client = reqwest::Client::new();

    let body = ChatRequest {
        model: DEFAULT_MODEL,
        messages: &messages,
        temperature: 0.5,
        stream: true,
    };

    let resp = match client
        .post(NIM_BASE_URL)
        .bearer_auth(key)
        .json(&body)
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let msg = e.to_string();
            let _ = app.emit(
                "llm-error",
                ErrorPayload {
                    stream_id: stream_id.clone(),
                    message: msg.clone(),
                },
            );
            return Err(msg);
        }
    };

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        let msg = format!("NIM API error {status}: {text}");
        let _ = app.emit(
            "llm-error",
            ErrorPayload {
                stream_id: stream_id.clone(),
                message: msg.clone(),
            },
        );
        return Err(msg);
    }

    let mut byte_stream = resp.bytes_stream();
    let mut full = String::new();
    let mut buffer = String::new();

    loop {
        let chunk = match byte_stream.next().await {
            Some(Ok(c)) => c,
            Some(Err(e)) => {
                let msg = e.to_string();
                let _ = app.emit(
                    "llm-error",
                    ErrorPayload {
                        stream_id: stream_id.clone(),
                        message: msg.clone(),
                    },
                );
                return Err(msg);
            }
            None => break,
        };

        buffer.push_str(&String::from_utf8_lossy(&chunk));

        // SSE frames are separated by double newlines
        while let Some(idx) = buffer.find("\n\n") {
            let frame = buffer[..idx].to_string();
            buffer.drain(..idx + 2);

            for line in frame.lines() {
                let Some(data) = line.strip_prefix("data: ") else {
                    continue;
                };
                if data == "[DONE]" {
                    continue;
                }

                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(delta) = json["choices"][0]["delta"]["content"].as_str() {
                        full.push_str(delta);
                        let _ = app.emit(
                            "llm-token",
                            TokenPayload {
                                stream_id: stream_id.clone(),
                                token: delta.to_string(),
                            },
                        );
                    }
                }
            }
        }
    }

    let _ = app.emit(
        "llm-done",
        DonePayload {
            stream_id: stream_id.clone(),
        },
    );

    Ok(())
}