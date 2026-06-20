import { Card, Button, Label, Slider, Switch, Input, Separator } from "@heroui/react";

export default function SettingsMenu({ settings }) {
  return(
    <div className="flex flex-col gap-2 py-22 px-[35vw]">
      <Label className="text-2xl">Settings</Label>
      <Separator className="max-w-90"/>
      <Label className="text-xl mt-1">API</Label>
      <Label>API Base URL</Label>
      <Input value={settings.apiUrl} className="max-w-[30vw]" onChange={(e) => settings.setApiUrl(e.target.value)} placeholder="https://your-api.com/v1/chat/completions"></Input>
      <Label>API Key</Label>
      <Input value={settings.apiKey} className="max-w-[30vw]" onChange={(e) => settings.setApiKey(e.target.value)} placeholder="api-key-xxxxxxxxxxxxxxxx"></Input>
      <Label className="text-xl mt-1">Misc</Label>
      <Label>Setting 1</Label>
      <Switch isSelected={settings.setting1} onChange={settings.setSetting1}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    </div>
  );
}