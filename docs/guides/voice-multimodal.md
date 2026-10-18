---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Voice & Multimodal
description: Voice notes, text-to-speech, Talk mode, Voice Wake, image understanding, image and music generation in OpenClaw — the built-in features, their config keys, and what to watch out for
keywords: [openclaw, voice, tts, speech to text, talk mode, multimodal, vision, image generation]
---

# Voice & Multimodal

Most multimodal features are now **built in**. You do not need a Whisper skill to transcribe voice notes, a TTS skill to speak, or a DALL-E skill to draw. You pick providers in config and the Gateway does the rest. This page summarises each feature with a tested config and links the upstream reference. Checked against OpenClaw **v2026.10.4** on 2026-10-18.

| You want | Built-in feature | Config key | Upstream |
|----------|------------------|-----------|----------|
| Understand voice notes | Audio transcription (media understanding) | `tools.media.audio` | [Audio and voice notes](https://docs.openclaw.ai/nodes/audio) |
| Understand images and video | Media understanding, or a vision-capable chat model | `tools.media.image`, `tools.media.video` | [Media understanding](https://docs.openclaw.ai/nodes/media-understanding) |
| Reply with voice | Text-to-speech | `tts` | [TTS](https://docs.openclaw.ai/tools/tts) |
| Continuous spoken conversation | Talk mode | `talk` | [Talk](https://docs.openclaw.ai/nodes/talk) |
| "Hey OpenClaw" hands-free | Voice Wake | Control UI → Settings → Talk | [Voice wake](https://docs.openclaw.ai/nodes/voicewake) |
| Voice in Discord voice channels | Discord voice | `channels.discord.voice` | [Discord voice](https://docs.openclaw.ai/channels/discord/voice-channels) |
| Phone calls | Voice Call plugin | `@openclaw/voice-call` | [Voice Call](https://docs.openclaw.ai/plugins/voice-call) |
| Make images | `image_generate` tool | `agents.defaults.mediaModels.image` | [Image generation](https://docs.openclaw.ai/tools/image-generation) |
| Make music | `music_generate` tool | `agents.defaults.mediaModels.music` | [Music generation](https://docs.openclaw.ai/tools/music-generation) |
| Make video | `video_generate` tool | `agents.defaults.mediaModels.video` | [Video Generation](/guides/video-generation) |
| Screenshots of web pages | Built-in browser tool | `browser` | [Browser](https://docs.openclaw.ai/tools/browser) |

---

## Media Attachments

Channels pass images, audio, video and documents to the Gateway as attachments. What a channel can carry varies: Telegram, WhatsApp, Matrix and Feishu support native voice notes; most others take audio as a file attachment. Size limits are per channel (`mediaMaxMb`) and per agent (`agents.defaults.mediaMaxMb`, default 20 MB).

There is no per-channel `permissions` block for media. Whether the agent can *send* media on a channel follows the channel's own action gates and tool policy (see [Channels](/guides/channels#what-the-agent-may-do-per-channel)). A `channels.<id>.permissions` key is rejected by the strict config schema, and the Gateway will not start.

---

## Voice Notes In: Transcription {#voice-control}

When someone sends a voice note, OpenClaw transcribes it **before** the agent sees the message, replaces the body with the transcript, and lets slash commands in speech work. It is on by default and auto-detects what you have, stopping at the first that works:

1. The active reply model, if its provider understands audio.
2. Any configured provider key that supports transcription, in this order: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. Local CLIs, if no provider key is available: `whisper-cli` (whisper.cpp), `sherpa-onnx-offline`, `parakeet-mlx` (Apple Silicon), then the Python `whisper` CLI.

See what it picked without transcribing anything:

```bash
openclaw capability audio providers
```

To pin a provider with a local fallback:

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-4o-transcribe", capabilities: ["audio"] },
        {
          type: "cli",
          command: "whisper",
          args: ["--model", "base", "{{AttachmentPath}}"],
          timeoutSeconds: 45,
          capabilities: ["audio"],
        },
      ],
      audio: { enabled: true, echoTranscript: true },   // echo the transcript back to chat
    },
  },
}
```

For fully local transcription, install whisper.cpp (`whisper-cli` on `PATH`) or the Python CLI (`pip install openai-whisper`, which also needs `ffmpeg`), and do not configure a cloud transcription key. Note that a cloud provider key, once configured, wins over local binaries. Set `tools.media.audio.enabled: false` to turn transcription off.

---

## Voice Out: Text-to-Speech {#voice-reply}

TTS turns replies into audio: native voice notes on Feishu, Matrix, Telegram and WhatsApp, an audio attachment everywhere else. It is **off** by default.

```json5 title="~/.openclaw/openclaw.json"
{
  tts: {
    auto: "inbound",           // speak only when the user sent a voice note
    provider: "microsoft",     // no API key needed
  },
}
```

`auto` is `off`, `always`, `inbound` (reply with voice to voice) or `tagged` (only when the reply contains `[[tts:...]]` directives). `inbound` is the least surprising choice for most people.

Providers (as of v2026.10.4): Azure Speech, DeepInfra, ElevenLabs, Fish Audio, Google Gemini, Gradium, Inworld, Local CLI, **Microsoft** (Edge neural voices via `node-edge-tts`, no key, best-effort with no SLA), MiniMax, OpenAI, OpenRouter, Volcengine, Vydra, xAI and Xiaomi MiMo. The old provider id `edge` is now `microsoft`; `openclaw doctor --fix` rewrites it. A paid provider with explicit voice settings:

```json5 title="~/.openclaw/openclaw.json"
{
  tts: {
    auto: "always",
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        apiKey: "${ELEVENLABS_API_KEY}",
        modelId: "eleven_multilingual_v2",
        speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
      },
    },
  },
}
```

From chat:

- `/tts status`: current state and the last attempt's fallback chain
- `/tts on` / `/tts off`, `/tts chat on|off|default` (this chat only)
- `/tts audio <text>`: a one-off voice reply
- `/tts latest`: speak the last reply
- `/tts provider <id>`

:::note ffmpeg
WhatsApp and Feishu voice notes need `ffmpeg` on the Gateway host when the provider's audio must be converted to Ogg/Opus. Without it, WhatsApp voice sends fail.
:::

Provider prices change often; check the provider's own pricing page rather than any number copied into a guide. Reference: [TTS quickstart](https://docs.openclaw.ai/tools/tts/quickstart), [TTS configuration](https://docs.openclaw.ai/tools/tts/configuration).

---

## Talk Mode and Voice Wake {#voice-agent}

**Talk mode** is a continuous spoken conversation: listen, send the transcript to the agent, speak the answer, repeat. It runs in the macOS, iOS, Android and Apple Watch apps and in the browser Control UI. It has three shapes:

- `stt-tts`: device speech recognition plus the TTS above
- `realtime`: a provider's realtime voice model (OpenAI realtime and GPT-Live, among others) with the agent consulted for real work
- `transcription`: captions or dictation with no spoken reply

```json5 title="~/.openclaw/openclaw.json"
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: { voiceId: "<elevenlabs-voice-id>", modelId: "eleven_v3" },
    },
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

The old top-level `talk.mode`, `talk.transport`, `talk.brain`, `talk.model` and `talk.voice` keys are retired; they live under `talk.realtime` and `talk.providers` now, and `openclaw doctor` refuses the old ones. Pick models and voices in **Control UI → Settings → Talk**.

**Voice Wake** is a single global list of wake words owned by the Gateway (defaults: `openclaw`, `claude`, `computer`). Edit it in **Control UI → Settings → Talk**; the apps toggle listening locally.

**Discord voice channels**: the Discord plugin can join a voice channel with `/vc join` and hold a spoken conversation, including with GPT-Live. Setup: [Discord voice](https://docs.openclaw.ai/channels/discord/voice-channels).

**Phone calls**: the Voice Call plugin (`openclaw plugins install @openclaw/voice-call`) handles telephony through Plivo, Telnyx or Twilio.

:::warning Voice is still the agent
A spoken request reaches the same agent, with the same tools, as a typed one. Anyone in earshot of a wake-word device, or anyone who can call your number, can ask it to act. Keep exec approvals on and read [Security Hardening](/security/hardening).
:::

---

## Vision & Image Analysis

Current frontier chat models accept images directly: for example `anthropic/claude-sonnet-5-5` and `anthropic/claude-opus-5-5`, and the current OpenAI and Gemini chat models. Check the provider page if you are unsure. If your main model is vision-capable, an image sent on any channel just works.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: { model: { primary: "anthropic/claude-sonnet-5-5" } },
  },
}
```

If your main model is text-only (many local models are), let media understanding describe images first with a cheaper vision model:

```json5 title="~/.openclaw/openclaw.json"
{
  tools: {
    media: {
      models: [{ provider: "google", model: "gemini-3-flash-preview", capabilities: ["image", "video"] }],
      image: { preferredModel: "google/gemini-3-flash-preview" },
      video: { enabled: true },
    },
  },
}
```

The image is then passed to the agent as an `[Image]` text block.

### Browser screenshots

The built-in browser tool can open pages and take screenshots for the agent to read; no Puppeteer MCP server is needed (`@modelcontextprotocol/server-puppeteer` is deprecated on npm).

```json5 title="~/.openclaw/openclaw.json"
{
  browser: { enabled: true, headless: true },
}
```

A browser gives the agent the web with your network position. Keep it on a separate profile and read the browser section of [Security Hardening](/security/hardening). Reference: [Browser](https://docs.openclaw.ai/tools/browser).

---

## Image Generation

The built-in `image_generate` tool appears once an image provider is available. It runs asynchronously and delivers the image back to the chat. Providers include OpenAI (default `openai/gpt-image-2`), Google, fal, ComfyUI, MiniMax, xAI, OpenRouter and others.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      mediaModels: {
        image: {
          primary: "openai/gpt-image-2",
          fallbacks: ["google/gemini-3.1-flash-image"],
        },
      },
    },
  },
}
```

### Local generation with ComfyUI

ComfyUI ([Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI)) is supported as an image (and music) provider that runs your saved workflows, locally or on Comfy Cloud. Run ComfyUI on `127.0.0.1` (its default); do not start it with `--listen 0.0.0.0`, which exposes an unauthenticated server that can run arbitrary workflows to your whole network. Setup: [ComfyUI provider](https://docs.openclaw.ai/providers/comfy).

### Skills

If you want a specific third-party service, search ClawHub first and read the skill before installing:

```bash
openclaw skills search image
```

Music works the same way with `music_generate` (ComfyUI, fal, Google Lyria, MiniMax, OpenRouter), and video with `video_generate`; see [Video Generation](/guides/video-generation).

---

## Wearable & Mobile Multimodal

### VisionClaw (Smart Glasses)

[VisionClaw](https://github.com/Intent-Lab/VisionClaw) (Intent-Lab, about 2,600 stars, active as of 2026-09) is a third-party iOS app that connects Meta Ray-Ban glasses to Gemini Live and an OpenClaw Gateway for voice-and-vision requests. It is not maintained by OpenClaw; review what it can reach before pairing it with your Gateway.

### Official apps

The macOS, iOS and Android apps are OpenClaw **nodes**: they bring Talk, Voice Wake, camera and screen capture, location and notifications to the agent, each behind node pairing and per-command policy. See [Nodes](https://docs.openclaw.ai/nodes).

---

## Multimodal Skill Patterns

Skills are folders with a `SKILL.md` (`name`, `description`, then instructions). They do not have `trigger:` or `tools:` fields: the agent reads the description and decides when the skill applies. A receipt scanner:

```markdown title="~/.openclaw/workspace/skills/receipt-scanner/SKILL.md"
---
name: receipt-scanner
description: Extract merchant, date, total and line items when the user sends a photo of a receipt.
---

# Receipt scanner

When the user sends an image of a receipt:

1. Read the merchant, date, currency, total and line items from the image.
2. Reply with a short summary and ask before saving anything.
3. If the user confirms, append one CSV row to `receipts.csv` in the workspace.

If the image is unreadable, say so and ask for a clearer photo. Do not guess totals.
```

The same shape works for "describe this screenshot and file an issue", "summarise this voice memo into my notes" and similar chains. Check that it loaded with `openclaw skills list`. Reference: [Creating skills](https://docs.openclaw.ai/tools/creating-skills) and [Skill Development](/guides/skill-development).

---

## Environment Variables

```bash
# ~/.openclaw/.env  (or better: SecretRefs, see Security Hardening)
OPENAI_API_KEY=sk-...          # transcription, TTS, image generation, realtime Talk
ELEVENLABS_API_KEY=...         # TTS and Talk voices
GEMINI_API_KEY=...             # Gemini TTS, image and video understanding
DEEPGRAM_API_KEY=...           # transcription
GROQ_API_KEY=...               # fast transcription
```

Keys in `.env` are readable by the agent. Prefer SecretRefs for anything valuable: [Secrets](https://docs.openclaw.ai/gateway/secrets).

---

## Troubleshooting

### Voice messages not transcribed

```bash
openclaw capability audio providers     # which provider or local CLI was selected
openclaw logs --follow                  # watch for the transcription line
which whisper-cli whisper ffmpeg        # local fallbacks on PATH?
```

Check that `tools.media.audio.enabled` is not `false`, and that the provider key is visible to the **Gateway service**, not just your shell.

### Images not understood

- Is the main model vision-capable? If not, add an `image` entry to `tools.media.models`.
- Is the file over the channel's `mediaMaxMb` or the agent's `mediaMaxMb`?

### TTS audio not arriving

- `/tts status` shows the provider, fallbacks and the last error.
- On WhatsApp and Feishu, install `ffmpeg` on the Gateway host.
- With `auto: "inbound"`, you only get audio after sending a voice note.

### High latency in voice conversations

- Use Talk `realtime` mode instead of a transcribe → reply → TTS round trip.
- Use a faster transcription provider (Groq, Deepgram) or local whisper.cpp with GPU.
- Keep the voice agent on a fast model and let it delegate long work.

---

## See Also

- [Video Generation](/guides/video-generation): `video_generate` and Remotion
- [Channels & Integrations](/guides/channels): which channels carry voice notes
- [Skill Development](/guides/skill-development): writing `SKILL.md` skills
- [Model Selection](/guides/model-selection): choosing models
- [Security Hardening](/security/hardening): approvals, sandboxing, browser
