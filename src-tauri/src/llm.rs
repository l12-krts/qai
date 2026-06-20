use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

const NIM_BASE_URL: &str = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL: &str = "meta/llama3-70b-instruct";

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

fn api_key() -> Result<String, String> {
    std::env::var("NIM_API_KEY").map_err(|_| "NIM_API_KEY not set".to_string())
}

/// Non-streaming chat completion — returns the full reply at once.
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

/// Streaming chat completion — emits "llm-token" events as chunks arrive,
/// then "llm-done" with the full assembled text when finished.
#[tauri::command]
pub async fn llm_chat_stream(
    app: AppHandle,
    stream_id: String,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    let key = api_key()?;
    let client = reqwest::Client::new();

    let body = ChatRequest {
        model: DEFAULT_MODEL,
        messages: &messages,
        temperature: 0.5,
        stream: true,
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

    let mut byte_stream = resp.bytes_stream();
    let mut full = String::new();
    let mut buffer = String::new();

    while let Some(chunk) = byte_stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
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
                            &format!("llm-token-{stream_id}"),
                            delta.to_string(),
                        );
                    }
                }
            }
        }
    }

    let _ = app.emit(&format!("llm-done-{stream_id}"), full);
    Ok(())
}