---
sidebar_position: 13
title: Voice & Multimodal
description: Add voice control, vision, image analysis, audio handling, and multimodal capabilities to your OpenClaw agent
keywords: [openclaw, voice, multimodal, speech, vision, image analysis]
---

# Voice & Multimodal

OpenClaw can see images, hear voice messages, speak back in natural voice, analyze screenshots, generate images, and stream real-time audio — all through its standard channel and skill architecture. This guide covers every multimodal capability and how to wire it up.

:::tip Start here
The fastest path to multimodal: enable **Whisper** for voice-to-text on Telegram, configure a **vision-capable model**, and install an **image generation skill** from ClawHub. You'll have a voice-controlled, vision-enabled, image-generating agent in under 30 minutes.
:::

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Channel Layer                    │
│  Telegram · WhatsApp · Discord · Signal · Slack  │
│         (receives voice, images, files)           │
└──────────────┬──────────────────┬────────────────┘
               │                  │
        ┌──────▼──────┐   ┌──────▼──────┐
        │  STT Engine │   │  Attachment  │
        │  (Whisper)  │   │  Parser      │
        └──────┬──────┘   └──────┬──────┘
               │                  │
        ┌──────▼──────────────────▼──────┐
        │          Brain (LLM)            │
        │  Claude · GPT-4o · Gemini      │
        │  (text + vision + reasoning)    │
        └──────┬──────────────────┬──────┘
               │                  │
        ┌──────▼──────┐   ┌──────▼──────┐
        │  TTS Engine │   │  Skills      │
        │  (Edge/11L) │   │  (DALL-E,    │
        │             │   │   SD, etc.)  │
        └──────┬──────┘   └──────┬──────┘
               │                  │
        ┌──────▼──────────────────▼──────┐
        │         Channel Reply           │
        │  (voice + images + text)        │
        └────────────────────────────────┘
```

Every multimodal feature flows through the same message pipeline — channels handle media I/O, the brain processes it, and skills/TTS engines generate media output. No special architecture changes needed.

---

## Media Attachments

All 50+ channel adapters support a standard attachment interface:

```typescript
interface ChannelMessage {
  text: string;
  sender: string;
  channel: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'audio' | 'video' | 'link';
    url: string;
    name?: string;
    mimeType?: string;
  }>;
}
```

When a user sends a photo, voice note, or file through any channel, it arrives as an attachment with type metadata. The brain receives both the text and attachment URLs in its context.

### Supported Media by Channel

| Channel | Images | Voice/Audio | Video | Files |
|---------|--------|-------------|-------|-------|
| Telegram | Yes | Yes (OGG) | Yes | Yes |
| WhatsApp | Yes | Yes (OGG) | Yes | Yes |
| Discord | Yes | Yes | Yes | Yes |
| Slack | Yes | Yes | Yes | Yes |
| Signal | Yes | Yes | Yes | Yes |
| iMessage | Yes | Yes | Yes | Yes |
| Matrix | Yes | Yes | Yes | Yes |
| Teams | Yes | No | No | Yes |

### Channel Permissions

Control media sending per channel:

```json5 title="~/.openclaw/openclaw.json"
{
  "channels": {
    "telegram": {
      "permissions": {
        "send_media": true,
        "send_voice": true,
        "receive_media": true
      }
    }
  }
}
```

---

## Voice Control

### Speech-to-Text (STT)

OpenAI Whisper transcribes incoming voice messages into text for the brain to process.

#### Install Whisper

```bash
# Install via pip
pip install openai-whisper

# Or with conda
conda install -c conda-forge openai-whisper
```

#### Create a Voice Transcription Skill

```yaml title="skills/voice-transcribe/skill.yaml"
name: voice-transcribe
description: Transcribe voice messages using Whisper
trigger: attachment:audio
tools:
  - shell
```

```markdown title="skills/voice-transcribe/SKILL.md"
## Voice Transcription

When a voice message arrives:
1. Download the audio attachment to /tmp/voice_msg.ogg
2. Run: whisper --model base --output_format txt /tmp/voice_msg.ogg
3. Read the transcription from /tmp/voice_msg.txt
4. Process the transcribed text as a normal user message
5. Clean up temporary files
```

#### Whisper Model Selection

| Model | Size | Speed | Accuracy | Best For |
|-------|------|-------|----------|----------|
| `tiny` | 39 MB | Fastest | Good | Quick responses, low-resource VPS |
| `base` | 74 MB | Fast | Better | **Recommended default** |
| `small` | 244 MB | Medium | Good | Better accuracy when needed |
| `medium` | 769 MB | Slow | Very good | Non-English or accented speech |
| `large-v3` | 1.5 GB | Slowest | Best | Maximum accuracy, GPU recommended |

```bash
# Test transcription quality
whisper --model base --language en voice_message.ogg

# Force English for faster processing
whisper --model base --language en --task transcribe voice_message.ogg
```

### Text-to-Speech (TTS)

Two options: free Edge TTS or premium ElevenLabs.

#### Edge TTS (Free)

Microsoft's Edge TTS engine — high quality, zero cost, no API key:

```bash
# Install
pip install edge-tts

# Generate speech
edge-tts --text "Hello, I'm your OpenClaw agent" \
  --voice en-US-AriaNeural \
  --write-media reply.mp3
```

**Popular voices:**
| Voice | Style |
|-------|-------|
| `en-US-AriaNeural` | Friendly, natural |
| `en-US-GuyNeural` | Casual male |
| `en-GB-SoniaNeural` | British female |
| `en-US-JennyNeural` | Professional female |

```bash
# List all available voices
edge-tts --list-voices | grep en-
```

#### ElevenLabs (Premium)

Custom voice cloning, highest quality:

```bash title="Environment"
export ELEVENLABS_API_KEY=your_key_here
```

```yaml title="skills/voice-reply/skill.yaml"
name: voice-reply
description: Reply with voice using ElevenLabs
trigger: "speak|say|voice"
tools:
  - shell
  - http
```

````markdown title="skills/voice-reply/SKILL.md"
## Voice Reply

When asked to speak or reply with voice:
1. Generate the text response normally
2. Call ElevenLabs API:
   ```
   curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID" \
     -H "xi-api-key: $ELEVENLABS_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"text": "YOUR_RESPONSE", "model_id": "eleven_turbo_v2_5"}' \
     --output /tmp/reply.mp3
   ```
3. Send the audio file as a reply attachment
4. Clean up temporary files
````

### Full Voice Pipeline

Combine STT + brain + TTS for a complete voice-controlled agent:

```yaml title="skills/voice-agent/skill.yaml"
name: voice-agent
description: Full voice-in, voice-out pipeline
trigger: attachment:audio
tools:
  - shell
  - http
```

```markdown title="skills/voice-agent/SKILL.md"
## Voice Agent

Complete voice pipeline:
1. **Transcribe** the incoming voice message with Whisper:
   `whisper --model base --language en --output_format txt /tmp/incoming.ogg`
2. **Process** the transcription as a text message — reason, plan, act
3. **Synthesize** the response as speech:
   `edge-tts --text "YOUR_RESPONSE" --voice en-US-AriaNeural --write-media /tmp/reply.mp3`
4. **Send** the audio file back through the channel
5. Also include the text response for accessibility
```

### Voice Cost Comparison

| Engine | Cost | Quality | Latency |
|--------|------|---------|---------|
| Whisper (local) | Free | Excellent | 2-5s (CPU), under 1s (GPU) |
| Edge TTS | Free | Very good | 1-3s |
| ElevenLabs | ~$0.30/1K chars | Excellent | 1-2s |
| Google Cloud TTS | ~$0.016/1K chars | Very good | 1-2s |

For most setups, **Whisper + Edge TTS** gives production-quality voice at zero cost.

---

## Vision & Image Analysis

### Vision-Capable Models

These models can analyze images, screenshots, documents, and visual content directly:

| Model | Vision Support | Best For |
|-------|---------------|----------|
| Claude Sonnet 4.6 | Yes | Detailed image analysis, document understanding |
| Claude Opus 4.8 | Yes | Complex visual reasoning |
| GPT-4o | Yes | General multimodal, fast |
| Gemini 2.5 Pro | Yes | Large images, long documents |
| Gemini 2.5 Flash | Yes | Fast visual analysis, low cost |
| LLaVA (local) | Yes | Free, on-device vision |

#### Configure a Vision Model

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6"
  }
}
```

When a user sends an image through any channel, the brain automatically receives it if the model supports vision. No additional configuration needed — the channel adapter passes image attachments to the LLM.

### Image Analysis Skill

For explicit image analysis commands:

```yaml title="skills/analyze-image/skill.yaml"
name: analyze-image
description: Analyze images sent by the user
trigger: "analyze|describe|what is this|what do you see"
tools:
  - shell
```

```markdown title="skills/analyze-image/SKILL.md"
## Image Analysis

When the user sends an image and asks for analysis:
1. The image is already in your context via the channel attachment
2. Describe what you see in detail
3. Answer any specific questions about the image
4. If asked to extract text, perform OCR on the image content
5. If asked about a screenshot, identify the application and UI elements
```

### Browser Screenshots

The built-in browser Hand captures screenshots for visual analysis:

```json5 title="~/.openclaw/openclaw.json"
{
  "hands": {
    "browser": {
      "enabled": true,
      "headless": true,
      "timeout": 60000,
      "allowed_domains": ["*"]
    }
  }
}
```

Use cases:
- **Web monitoring:** Screenshot a page, analyze for changes
- **Visual QA:** Capture a UI, check layout and content
- **Data extraction:** Screenshot a dashboard, read values from charts

### MCP Vision Servers

```json5 title="Puppeteer MCP for screenshots"
{
  "mcp": {
    "servers": {
      "puppeteer": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
      }
    }
  }
}
```

The Puppeteer MCP server provides `puppeteer_screenshot` and `puppeteer_navigate` tools for programmatic screenshot capture.

---

## Image Generation

### ClawHub Skills

60+ image and video generation skills available:

```bash
# Browse image generation skills
openclaw clawhub search "image generation"
openclaw clawhub search "DALL-E"
openclaw clawhub search "stable diffusion"

# Install one
openclaw clawhub install dalle-generator
```

### DALL-E Skill

```yaml title="skills/dalle/skill.yaml"
name: dalle
description: Generate images with DALL-E
trigger: "generate|draw|create image|make a picture"
tools:
  - http
```

````markdown title="skills/dalle/SKILL.md"
## Image Generation

When the user asks to generate an image:
1. Craft a detailed prompt from their request
2. Call the OpenAI Images API:
   ```
   curl -X POST "https://api.openai.com/v1/images/generations" \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "dall-e-3", "prompt": "DETAILED_PROMPT", "size": "1024x1024", "quality": "standard"}'
   ```
3. Download the generated image
4. Send it as a channel attachment
````

### Stable Diffusion (Local)

Run image generation locally with no API costs:

```bash
# Install via Ollama (if supported) or standalone
# Using ComfyUI for local Stable Diffusion
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI && pip install -r requirements.txt
python main.py --listen 0.0.0.0 --port 8188
```

Connect via MCP or HTTP skill for zero-cost image generation on GPU hardware.

---

## Real-Time Audio Streaming

### Gemini Live API

For real-time bidirectional audio (used by VisionClaw smart glasses):

```typescript
const ws = new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent');

ws.onopen = () => {
  // Send setup message
  ws.send(JSON.stringify({
    setup: {
      model: 'models/gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' }
          }
        }
      }
    }
  }));
};

// Stream audio chunks
function sendAudioChunk(base64Audio: string) {
  ws.send(JSON.stringify({
    realtimeInput: {
      mediaChunks: [{
        mimeType: 'audio/pcm;rate=16000',
        data: base64Audio
      }]
    }
  }));
}
```

This enables sub-second voice interaction — the user speaks, the model responds in audio, with no STT/TTS pipeline latency.

### When to Use Real-Time vs Pipeline

| Approach | Latency | Cost | Quality | Best For |
|----------|---------|------|---------|----------|
| **Whisper + Edge TTS** | 3-8s | Free | Very good | Messaging apps, async |
| **Gemini Live** | under 1s | API cost | Good | Real-time voice, wearables |
| **ElevenLabs Streaming** | 1-2s | Premium | Excellent | Premium voice quality |

---

## Wearable & Mobile Multimodal

### VisionClaw (Smart Glasses)

The VisionClaw project (681 stars) connects Meta Ray-Ban smart glasses to OpenClaw:

- **Video capture** at ~1 FPS from glasses camera
- **Bidirectional audio** via Gemini Live API WebSocket
- **56+ connected skills** from the OpenClaw ecosystem
- **Fallback mode** using iPhone camera for testing

```
Smart Glasses → iOS App → Gemini Live API → OpenClaw Gateway
     ↑                                            │
     └────────────── Audio Response ◄──────────────┘
```

**Requirements:** iOS 17.0+, Xcode 15.0+, Meta Ray-Ban smart glasses (or iPhone camera fallback)

See the [Ecosystem](/reference/ecosystem) page for setup details and repository links.

### ClawPhone (Android)

Run a multimodal agent on a $25 Android smartphone:

- **Camera access** via Termux:API
- **Screen overlay** daemon for always-on interaction
- **Hardware control** (sensors, GPS, flashlight)
- **Remote control** via Discord channel

### macOS Companion

Official menu bar app with:
- **Voice control** — speak commands directly
- **Gateway health** monitoring
- **Debug tools** for development
- Available as Universal Binary on macOS 15+

---

## Multimodal Skill Patterns

### Pattern 1: Describe and Act

Receive an image, analyze it, take action:

```yaml title="skills/receipt-scanner/skill.yaml"
name: receipt-scanner
description: Scan receipts and log expenses
trigger: attachment:image
tools:
  - shell
  - filesystem
```

```markdown title="skills/receipt-scanner/SKILL.md"
## Receipt Scanner

When an image attachment arrives:
1. Analyze the image — identify if it's a receipt
2. Extract: merchant name, date, total amount, line items
3. Append to ~/expenses.csv: date, merchant, amount, category
4. Reply with a summary: "Logged $42.50 at Whole Foods (Groceries)"
```

### Pattern 2: Visual Monitoring

Periodically capture and analyze visual state:

```yaml title="skills/site-monitor/skill.yaml"
name: site-monitor
description: Monitor website appearance for changes
trigger: "monitor site|check site"
tools:
  - browser
  - shell
```

```markdown title="skills/site-monitor/SKILL.md"
## Site Monitor

When asked to monitor a site:
1. Navigate to the URL using the browser
2. Take a screenshot
3. Compare against the previous screenshot (stored in ~/.openclaw/screenshots/)
4. If significant visual changes detected, alert the user
5. Save the current screenshot for next comparison
```

### Pattern 3: Multimodal Chain

Combine vision input with media output:

```markdown title="Example: Photo → Description → Voice"
User sends a photo of a sunset via Telegram

1. Vision model analyzes: "A vibrant sunset over the ocean with 
   orange and purple hues reflecting on calm water"
2. Agent crafts a poetic description
3. Edge TTS converts description to speech
4. Reply includes both text and voice note
```

### Pattern 4: Document Processing

Extract and act on document content:

```yaml title="skills/doc-processor/skill.yaml"
name: doc-processor
description: Process documents and PDFs
trigger: attachment:file
tools:
  - shell
  - filesystem
```

```markdown title="skills/doc-processor/SKILL.md"
## Document Processor

When a document is attached:
1. Identify file type (PDF, DOCX, image of text)
2. For PDFs: extract text, summarize key points
3. For images of documents: use vision to OCR and extract content
4. Answer questions about the document
5. Offer to create action items, summaries, or translations
```

---

## Configuration Reference

### Full Multimodal Config

```json5 title="~/.openclaw/openclaw.json"
{
  "brain": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6"
  },

  "hands": {
    "browser": {
      "enabled": true,
      "headless": true
    }
  },

  "channels": {
    "telegram": {
      "permissions": {
        "send_media": true,
        "send_voice": true,
        "receive_media": true
      }
    }
  },

  "mcp": {
    "servers": {
      "puppeteer": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
      }
    }
  }
}
```

### Environment Variables

```bash title="~/.openclaw/.env"
# Voice
ELEVENLABS_API_KEY=your_key      # Optional: premium TTS
OPENAI_API_KEY=your_key           # For Whisper API (if not running locally)

# Image Generation
OPENAI_API_KEY=your_key           # DALL-E
STABILITY_API_KEY=your_key        # Stable Diffusion API

# Real-Time Audio
GOOGLE_API_KEY=your_key           # Gemini Live API
```

---

## Performance Tips

### Voice Latency

- Use Whisper `tiny` or `base` for fastest transcription
- Run Whisper on GPU for sub-second transcription
- Use Edge TTS (no network round-trip to paid API)
- Pre-download Whisper models to avoid cold-start delay

### Vision Cost

- Gemini 2.5 Flash is the cheapest vision model
- Resize large images before sending to the LLM (saves tokens)
- Claude charges per image tile — smaller images cost less
- Cache common visual analysis patterns in skills

### Storage

- Voice messages are temporary — clean up `/tmp` files after processing
- Screenshots accumulate — set a retention policy
- Generated images can be large — compress before sending

```bash
# Clean up old voice/image temp files (add to cron)
find /tmp -name "voice_*.ogg" -mtime +1 -delete
find /tmp -name "reply_*.mp3" -mtime +1 -delete
find ~/.openclaw/screenshots -mtime +7 -delete
```

### Resource Usage

| Feature | RAM Impact | CPU Impact | GPU Impact |
|---------|-----------|-----------|-----------|
| Whisper tiny | +200 MB | High during transcription | Preferred |
| Whisper base | +500 MB | High during transcription | Preferred |
| Whisper large | +3 GB | Very high | Required |
| Edge TTS | Minimal | Low | None |
| ElevenLabs | Minimal | None (API) | None |
| Local Stable Diffusion | +4 GB | Medium | Required (4+ GB VRAM) |
| Browser screenshots | +200 MB | Low | None |

---

## Troubleshooting

### Voice messages not transcribed

```bash
# Check Whisper is installed
whisper --help

# Test with a sample file
whisper --model base test.ogg

# Check ffmpeg (required by Whisper)
ffmpeg -version
```

If `ffmpeg` is missing: `sudo apt install ffmpeg`

### Images not analyzed

1. Confirm your model supports vision (Claude Sonnet/Opus, GPT-4o, Gemini)
2. Check channel permissions include `receive_media: true`
3. Verify the image URL is accessible to the brain
4. Check logs: `openclaw logs --filter "attachment" --follow`

### TTS audio not playing

```bash
# Test Edge TTS directly
edge-tts --text "test" --voice en-US-AriaNeural --write-media /tmp/test.mp3

# Verify the file was created
ls -la /tmp/test.mp3

# Check the channel can send audio
openclaw config get channels.telegram.permissions.send_voice
```

### High latency on voice pipeline

- Switch Whisper to `tiny` model
- Ensure GPU is being used: `nvidia-smi` (should show whisper process)
- Run Whisper with `--language en` to skip language detection
- Consider Gemini Live for real-time voice instead of STT+TTS pipeline

---

## See Also

- [Channels](/guides/channels) — Channel setup and media permissions
- [Custom Channels](/guides/custom-channels) — Building channels with attachment support
- [MCP Servers](/guides/mcp-servers) — Puppeteer and media-handling servers
- [Skill Development](/guides/skill-development) — Building custom skills
- [Advanced Recipes](/guides/recipes/advanced-recipes) — Voice-controlled agent recipe
- [Model Selection](/guides/model-selection) — Choosing vision-capable models
- [Ecosystem](/reference/ecosystem) — VisionClaw, ClawPhone, and companion apps
- [Local Models](/guides/local-models) — Running Whisper and LLaVA locally
- [Performance Tuning](/guides/performance-tuning) — Optimizing multimodal costs
