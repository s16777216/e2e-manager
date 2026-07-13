## 目前

```json
{
  "id": "default",
  "headless": true,
  "viewportWidth": 1280,
  "viewportHeight": 800,
  "slowMo": 0,
  "defaultTimeout": 10000,
  "aiConfig": {
    "provider": "gemini",
    "executorProvider": "openai",
    "apiKey": "",
    "baseUrl": "",
    "openaiApiKey": "",
    "geminiModel": "",
    "openaiModel": "",
    "summarizerGeminiModel": "",
    "summarizerOpenaiModel": "",
    "sendFailureScreenshot": true
  }
}
```

## 未來

> 將 Model 單獨拉出來，System 設定檔只做簡單的設定，不包含 model 的設定，這樣可以更靈活的切換不同的 LLM

### SystemSetting

```json
{
  "id": "default",
  "headless": true,
  "viewportWidth": 1280,
  "viewportHeight": 800,
  "slowMo": 0,
  "defaultTimeout": 10000,
  "aiConfig": {
    "executorModelId": "",
    "reportModelId": ""
  }
}
```

### ModelSetting

```json
{
  "id": "",
  "name": "LLM 1",
  "description": "",
  "provider": "",
  "apiKey": "",
  "baseUrl": "",
  "model": ""
}
```
