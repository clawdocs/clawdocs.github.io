---
last_update:
  date: 2026-10-18
verified_with: 2026.10.4
title: Video Generation with Remotion
description: Comprehensive guide to programmatic video creation with OpenClaw and Remotion — skills, MCP servers, templates, rendering pipelines, and production recipes
keywords: [openclaw, remotion, video generation, programmatic video, tiktok, youtube shorts, ai video, mcp video, remotion agent skills]
---

# Video Generation with Remotion

OpenClaw has two ways to make video: the built-in `video_generate` tool, which asks a video model for a clip, and **Remotion**, which renders React components into video that you fully control. This guide covers both, with the skills, MCP servers, rendering APIs and recipes that connect Remotion to OpenClaw. Checked against OpenClaw **v2026.10.4** on 2026-10-18; third-party star and download counts are as of that date.

---

## Quick vs Full: Choosing Your Approach

OpenClaw has **two paths** for video generation — pick the one that fits your need:

| | **`video_generate` tool** | **Remotion** |
|---|---|---|
| **Setup** | A provider API key — built-in tool, one call | Node.js project, React, FFmpeg |
| **Best for** | Quick clips, one-off demos, simple prompts | Branded content, templates, recurring series |
| **Control** | Prompt-only — you describe, AI generates | Full creative control — React components, animations, layouts |
| **Customization** | Limited to what the AI model produces | Unlimited — any React code, custom fonts, charts, 3D |
| **Reproducibility** | Each generation is unique | Deterministic — same props = same video |
| **Cost** | Per-generation API cost | Free local rendering + optional API costs for assets |
| **Example** | `"Make a 5-second hello world clip"` | Templated TikTok series, data dashboards, branded intros |

**Start with `video_generate`** if you just want a quick clip from a prompt. **Use Remotion** when you need templates, branding, recurring content, or pixel-perfect control.

---

## The Built-in `video_generate` Tool

`video_generate` appears as soon as one video provider is available: set an API key (for example `GEMINI_API_KEY` for Google Veo) or configure a default model. 18 provider backends are supported as of v2026.10.4, including Google (Veo), Runway, MiniMax (Hailuo), Alibaba and Qwen (Wan), BytePlus (Seedance), PixVerse, Kie AI, OpenRouter, Together, Z.AI, Vydra and ComfyUI.

```json5 title="~/.openclaw/openclaw.json"
{
  agents: {
    defaults: {
      mediaModels: {
        video: { primary: "google/veo-3.1-fast-generate-preview" },
      },
    },
  },
}
```

Then ask in any chat: *"Generate a 5-second cinematic video of a lobster surfing at sunset."*

- Generation is **asynchronous**: the tool returns a task id, the provider works for 30 seconds to several minutes, and OpenClaw wakes the session and posts the video when it is done. A repeated request while a job is running returns its status instead of starting another.
- It supports text-to-video, image-to-video and (on some providers) video-to-video. `action: "list"` shows which modes each configured provider supports.
- It is billed per clip by the provider. Check the provider's pricing before putting it in a loop.

Reference: [Video generation](https://docs.openclaw.ai/tools/video-generation). The same pattern gives you `image_generate` for thumbnails and `music_generate` for soundtracks; see [Voice & Multimodal](/guides/voice-multimodal#image-generation).

---

## Why Remotion?

[Remotion](https://remotion.dev) is a React-based framework for creating videos programmatically. Instead of dragging timelines in a video editor, you write React components that render frame-by-frame into MP4, WebM, or GIF files.

**Why it fits OpenClaw perfectly:**

- **Code-driven** — OpenClaw can generate and modify React components
- **JSON-configurable** — compositions accept data props, so OpenClaw can drive content via JSON
- **CLI-renderable** — `npx remotion render` works headlessly on any server
- **AI-first** — Remotion ships official Agent Skills, MCP server, and AI-optimized docs

### Core concepts

| Concept | What it is |
|---------|-----------|
| **Composition** | A React component + video metadata (id, fps, width, height, durationInFrames) |
| **Sequence** | Time-offsets within a composition — like scenes in a movie |
| **useCurrentFrame()** | Hook that gives you the current frame number for animations |
| **registerRoot()** | Entry point that registers all compositions in `src/Root.tsx` |
| **renderMedia()** | Server-side API that renders compositions to video files |

```tsx title="src/HelloWorld.tsx"
import { useCurrentFrame, interpolate } from "remotion";

export const HelloWorld: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <div style={{ opacity, fontSize: 80, textAlign: "center" }}>
      {text}
    </div>
  );
};
```

```tsx title="src/Root.tsx"
import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HelloWorld"
    component={HelloWorld}
    durationInFrames={90}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ text: "Made with OpenClaw" }}
  />
);
```

---

## Quick Start

### 1. Install Remotion

```bash
# Create a new Remotion project (pick a template interactively)
npx create-video@latest my-video

# Or choose a template with its flag
npx create-video@latest --prompt-to-video my-prompt-video
```

### 2. Install Remotion Agent Skills

Agent Skills teach OpenClaw how to write correct Remotion code. The [remotion-dev/skills](https://github.com/remotion-dev/skills) repo ships 12 skills (best practices, captions, create, docs, interactivity, maps, markup, multimedia, render, SaaS, studio, upgrade).

```bash
# In your Remotion project directory
npx skills add remotion-dev/skills
```

This adds Remotion-specific instructions to your project so OpenClaw understands compositions, animations, and the rendering pipeline.

### 3. Render your first video

```bash
# Preview in the Remotion Studio
npx remotion studio

# Render to MP4
npx remotion render HelloWorld out/video.mp4
```

---

## ClawHub Video Skills

All of these are **third-party**. Read a skill's files before installing it, and see [Skill Verification](/security/skill-verification).

### Remotion Video Toolkit

A general Remotion toolkit skill by `shreefentsar`: animations, timing, rendering, captions, 3D (React Three Fiber), charts, text effects and transitions. About 23,000 downloads and 730 installs on ClawHub.

```bash
openclaw skills install @shreefentsar/remotion-video-toolkit
```

### Pexo

Video-agent skills from Pexo that turn a description into a finished video, routing each shot to a hosted video model (Seedance, Kling and others) through one Pexo API key. Install it from ClawHub, where the publisher is verified and the moderation verdict is clean. It calls Pexo's hosted service; check its pricing first.

```bash
openclaw skills install @pexo/pexo-video-agent
```

### BibiGPT

Wraps the BibiGPT CLI to summarize videos, audio and podcasts from a URL (YouTube, Bilibili and others), useful for research and repurposing. It uses the BibiGPT service. As of 2026-10-18 it has no ClawHub moderation verdict yet (unreviewed), so read its files before installing.

```bash
openclaw skills install @jimmylv/bibigpt-skill
```

### ClawVid

[neur0map/clawvid](https://github.com/neur0map/clawvid) is a short-form pipeline (prompt → script → assets → Remotion → captioned video). It is **not on ClawHub**, has about 20 stars, and has not been updated since February 2026; treat it as example code to read rather than a skill to install.

Search for others with `openclaw skills search video`.

---

## MCP Servers for Video

MCP servers extend OpenClaw's capabilities without installing skills. Add them to your `openclaw.json`:

### @remotion/mcp (Official)

Indexes Remotion documentation into a vector database. OpenClaw can query it for API details, examples, and best practices while writing compositions.

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "remotion": {
        "command": "npx",
        "args": ["@remotion/mcp"]
      }
    }
  }
}
```

:::info
The official MCP server is for **documentation lookup only** — it doesn't expose rendering or composition tools. Use it alongside Agent Skills for best results.
:::

### remotion-media-mcp

Community MCP server with 10 tools for AI-powered media generation. Saves files to `public/` for Remotion's `staticFile()` function.

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "remotion-media": {
        "command": "npx",
        "args": ["remotion-media-mcp"]
      }
    }
  }
}
```

**Tools available:**

| Tool | Description |
|------|-------------|
| `generate_image` | AI image generation (for backgrounds, scenes) |
| `generate_video_from_text` | Text-to-video clips |
| `generate_video_from_image` | Image-to-video animation |
| `generate_music` | Background music generation |
| `generate_sound_effect` | Sound effects |
| `generate_speech` | Text-to-speech voiceover |
| `generate_subtitles` | Auto-generate subtitle tracks |
| `list_assets` | List generated media in public/ |
| `backup_asset` | Back up generated files |
| `get_asset` | Retrieve asset metadata |

### remotion-mcp-app

Interactive MCP app with a live video player and editing layer — useful for real-time preview while OpenClaw generates compositions.

**GitHub:** [mcp-use/remotion-mcp-app](https://github.com/mcp-use/remotion-mcp-app)

### ffmpeg-mcp

FFmpeg operations via natural language. Useful for post-processing — trimming, concatenating, adding audio tracks, format conversion.

[video-creator/ffmpeg-mcp](https://github.com/video-creator/ffmpeg-mcp) is a Python server (about 150 stars) with tools to find, inspect, clip, concatenate, overlay, scale and extract frames from videos. It is not on npm: clone it, run `uv sync`, and point OpenClaw at the checkout:

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "ffmpeg": {
        "command": "uv",
        "args": ["--directory", "/home/you/src/ffmpeg-mcp", "run", "ffmpeg-mcp"]
      }
    }
  }
}
```

(The npm package named `ffmpeg-mcp` is an unrelated project.)

### kinocut (formerly mcp-video)

Guardrailed video-editing MCP with planning and quality checks, aimed at safer autonomous operation. Renamed from `mcp-video`; about 210 stars and active.

**GitHub:** [KyaniteLabs/kinocut](https://github.com/KyaniteLabs/kinocut)

For AI-generated footage, prefer the built-in `video_generate` tool over single-provider MCP servers.

---

## Remotion AI Integration

Remotion has invested heavily in AI-agent compatibility.

### Agent Skills

The most important integration. Install in your Remotion project:

```bash
npx skills add remotion-dev/skills
```

This adds 12 skills that teach your AI agent, among other things:
- How to structure compositions and sequences
- Animation best practices with `interpolate()` and `spring()`
- Captions, maps, multimedia and interactive compositions
- How to use `staticFile()` for assets
- Rendering configuration and version upgrades

**GitHub:** [remotion-dev/skills](https://github.com/remotion-dev/skills) (about 5,300 stars)

### AI-Optimized Docs

Remotion's documentation supports AI-friendly access:

- Append `.md` to any docs URL for markdown: `remotion.dev/docs/the-fundamentals.md`
- Set `Accept: text/markdown` header for content negotiation
- Full system prompt available at [remotion.dev/docs/ai/system-prompt](https://www.remotion.dev/docs/ai/system-prompt)

### LLM System Prompt

Remotion maintains an official system prompt for LLMs generating Remotion code. Point OpenClaw to it in your SOUL.md:

```markdown title="SOUL.md"
When generating Remotion code, follow the patterns at:
https://www.remotion.dev/docs/ai/system-prompt

Use Agent Skills conventions for compositions, animations, and rendering.
```

---

## Prompt-to-Video Pipeline

The most common pattern: turn a text prompt into a finished video.

### Using the official template

Remotion's `template-prompt-to-video` handles the full pipeline:

```bash
# Create project from template
npx create-video@latest --prompt-to-video my-prompt-video
cd my-prompt-video

# API keys (or put them in .env; the CLI prompts if they are missing)
export OPENAI_API_KEY=sk-...
export ELEVENLABS_API_KEY=...

# Generate a story timeline (prompts for a title and topic; needs Bun)
npm run gen

# Render
npx remotion render
```

**What happens under the hood:** the template's CLI uses OpenAI to write the story and make the scene images, and ElevenLabs for the voiceover with timestamps. It assembles a JSON timeline, and Remotion renders it with synced visuals and audio.

### Custom pipeline with OpenClaw

For more control, build your own pipeline:

Run these from your Remotion project directory. `openclaw agent exec` runs one headless agent turn with that directory as its workspace.

```bash title="Step 1: Generate script"
openclaw agent exec --cwd . "Write a 60-second video script about OpenClaw's memory system.
Save it as public/script.json in the form { scenes: [{ duration: number, narration: string, visual: string }] }"
```

```bash title="Step 2: Generate assets"
# With remotion-media-mcp configured, OpenClaw can:
# - generate_speech for narration
# - generate_image for scene backgrounds
# - generate_music for background track
```

```bash title="Step 3: Create composition"
# OpenClaw writes a Remotion composition using the Agent Skills
openclaw agent exec --cwd . "Create a Remotion composition MyVideo in src/ from public/script.json.
Use Sequence for each scene, AbsoluteFill for layouts, and spring() for transitions."
```

:::warning Headless runs can run commands
Unless your config says otherwise, `agent exec` runs with the sandbox off and the full exec policy, scoped to `--cwd`. Run it in a project directory you are happy for the agent to change, run it under a dedicated agent or config with narrower tools, and see [Security Hardening](/security/hardening).
:::

```bash title="Step 4: Render"
npx remotion render MyVideo out/video.mp4 --codec h264
```

---

## Programmatic Rendering

### renderMedia() (Recommended)

The server-side API for rendering — combines frame rendering and video stitching:

```typescript title="render.ts"
import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";

const bundled = await bundle({ entryPoint: "./src/index.ts" });

const composition = await selectComposition({
  serveUrl: bundled,
  id: "MyVideo",
  inputProps: {
    title: "Generated by OpenClaw",
    scenes: [ /* ... from AI-generated JSON */ ],
  },
});

await renderMedia({
  serveUrl: bundled,
  composition,
  codec: "h264",
  outputLocation: "out/video.mp4",
  concurrency: "50%",  // Use half of CPU threads
});
```

### CLI rendering

Simpler for one-off renders:

```bash
# Basic render
npx remotion render MyVideo out/video.mp4

# With custom props from a JSON file
npx remotion render MyVideo out/video.mp4 --props=./scene-data.json

# Specific codec and quality
npx remotion render MyVideo out/video.mp4 --codec=h264 --crf=18
```

### Remotion Lambda (Serverless)

For high-volume rendering without managing infrastructure:

```typescript
import { renderMediaOnLambda } from "@remotion/lambda/client";

const result = await renderMediaOnLambda({
  region: "us-east-1",
  functionName: "remotion-render-...",
  serveUrl: "https://your-bundle.s3.amazonaws.com",
  composition: "MyVideo",
  codec: "h264",
  inputProps: { /* AI-generated content */ },
});
```

### Rendering still images

For thumbnails, social cards, or frame exports:

```typescript
import { renderStill } from "@remotion/renderer";

await renderStill({
  serveUrl: bundled,
  composition,
  output: "thumbnail.png",
  frame: 0,  // First frame as thumbnail
});
```

---

## Complementary Tools

### Whisper (Captions)

Remotion includes `@remotion/openai-whisper` for generating word-level captions from audio:

```bash
npm install @remotion/openai-whisper
```

```typescript
import { openAiWhisperApiToCaptions } from "@remotion/openai-whisper";

// Generate captions from audio file
const captions = await openAiWhisperApiToCaptions({
  transcription: whisperResponse,
});
```

### ElevenLabs (Text-to-Speech)

`@remotion/elevenlabs` for high-quality voiceover generation:

```bash
npm install @remotion/elevenlabs
```

Generate speech with word-level timestamps, then sync with Remotion sequences for perfect lip-sync or caption timing.

### Image Generation

Use OpenClaw's LLM to call image generation APIs:
- **`image_generate`** — OpenClaw's built-in tool (OpenAI `gpt-image-2`, Google, fal, ComfyUI and others)
- **ComfyUI** — local Stable Diffusion or Flux workflows, via the ComfyUI provider
- **remotion-media-mcp** — its `generate_image` tool writes straight into `public/`

### FFmpeg (Post-processing)

Remotion uses FFmpeg internally, but for post-processing:
- Concatenate multiple rendered clips
- Add watermarks or overlays
- Convert formats (MP4 → GIF, WebM)
- Extract audio tracks

The FFmpeg MCP server above lets OpenClaw run these operations by name, or the agent can call `ffmpeg` directly through exec.

---

## Production Recipes

### Faceless TikTok / YouTube Shorts

The most popular use case. Let the agent write the script and generate assets (with `video_generate`, `image_generate`, TTS or remotion-media-mcp) into `public/props.json` and `public/`, then render deterministically with Remotion. The rendering half is a good fit for a [Lobster](#lobster-workflow-for-video-pipelines) workflow, shown below.

### Audiogram (Podcast Clips)

Turn podcast audio into shareable video clips with waveform visualization:

```bash
# Use the audiogram template
npx create-video@latest --audiogram my-audiogram
```

The audiogram template renders:
- Waveform visualization synced to audio
- Episode title, guest name, timestamps
- Auto-generated captions via Whisper

### Data Visualization Videos

Animate charts and graphs for social media:

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import { Bar } from "@visx/shape";

export const DataViz: React.FC<{ data: number[] }> = ({ data }) => {
  const frame = useCurrentFrame();

  return (
    <svg width={1080} height={1920}>
      {data.map((value, i) => {
        const height = interpolate(
          frame,
          [i * 10, i * 10 + 20],
          [0, value],
          { extrapolateRight: "clamp" }
        );
        return <Bar key={i} x={i * 120} y={1920 - height} width={100} height={height} />;
      })}
    </svg>
  );
};
```

### Code Walkthrough Videos

Use the code-hike template for animated code explanations:

```bash
npx create-video@latest --code-hike my-code-video
```

OpenClaw can generate the code snippets and step-by-step annotations, then Remotion renders them with syntax highlighting and smooth transitions.

### Automated Daily Digest

Recurring work is an **automation job**, not a heartbeat setting (the old top-level `heartbeat.tasks` key no longer exists, and the Gateway rejects it):

```bash
openclaw cron add --name daily-video-digest --cron "0 18 * * *" --tz Europe/Berlin \
  --agent main --session isolated \
  --message "Create a 60-second video digest of today's top OpenClaw community updates with the Remotion project in ~/videos/digest. Render to out/digest-<date>.mp4 and tell me when it is ready. Do not publish it." \
  --announce --channel telegram --to 123456789
```

Check it with `openclaw cron list` and `openclaw cron runs`. See [Automation](/guides/automation).

---

## Lobster Workflow for Video Pipelines

For the deterministic half of a pipeline, a [Lobster](/guides/lobster-workflows) workflow runs each step in order and stops at an approval gate before anything is published. Lobster workflow files use `name`, `args`, and `steps` with `run` (or `command`), `stdin`, `approval` and `when`/`condition`:

```yaml title="render-short.lobster"
name: render-short
args:
  props:
    default: public/props.json
steps:
  - id: render
    run: npx remotion render TikTokVideo out/short.mp4 --props=${props}

  - id: thumbnail
    run: npx remotion still TikTokVideo out/thumb.png --frame=15 --props=${props}

  - id: review
    approval: Publish out/short.mp4 with out/thumb.png?

  - id: publish
    run: ./scripts/publish.sh out/short.mp4 out/thumb.png
    when: $review.approved
```

Run it from the Remotion project with the standalone CLI (`lobster run --file render-short.lobster`), or install the OpenClaw plugin (`openclaw plugins install @openclaw/lobster`, then allow the `lobster` tool) and ask the agent to run it. The approval step halts the run and returns a resume token, so nothing is posted until you approve.

OpenClaw has no built-in TikTok or YouTube publishing tool. `scripts/publish.sh` stands for whatever uploader you trust: a platform CLI, an MCP server or a skill. Keep the approval step in front of it. Reference: [Lobster](https://docs.openclaw.ai/tools/lobster) and the [Lobster README](https://github.com/openclaw/lobster).

---

## Alternatives and Comparisons

| Tool | Type | Best For | AI Integration |
|------|------|----------|----------------|
| **Remotion** | React framework | Custom compositions, full control | Agent Skills, MCP, system prompts |
| **`video_generate`** | Built-in OpenClaw tool | AI-generated footage from a prompt or image | Native tool, 18 provider backends |
| **FFmpeg** | CLI tool | Post-processing, conversion | Agent exec, FFmpeg MCP |
| **Hosted template APIs** | Template services | Simple template videos without code | REST APIs, n8n/Make |

Remotion is the best choice when you need **full programmatic control** and **React ecosystem compatibility**. Use `video_generate` for footage you cannot draw in code, and composite it in Remotion.

---

## Cost and Performance

Prices change too often to print here. What drives the cost:

- **Local rendering** with the Remotion CLI costs only your hardware time; a 60-second 1080x1920 video takes minutes on a laptop, depending on complexity.
- **Remotion Lambda** and other cloud renderers bill per render; see Remotion's own cost estimator in its Lambda docs.
- **AI assets** (script tokens, images, voiceover, `video_generate` clips) are billed by each provider. Generated video clips are by far the most expensive part.
- **Remotion licensing**: Remotion is free for individuals, non-profits and companies with up to 3 employees; larger companies need a company license. See [remotion.dev/license](https://www.remotion.dev/license).

### Optimization tips

1. **Cache AI-generated assets** — don't regenerate images/audio for unchanged scenes
2. **Use `concurrency`** — `renderMedia({ concurrency: "75%" })` uses more CPU threads
3. **Render at target resolution** — don't render 4K if publishing to TikTok (1080x1920)
4. **Use a smaller model** (for example `anthropic/claude-haiku-5-5` or a local model) for script drafts when quality isn't critical
5. **Batch renders** — schedule renders overnight with an automation job
6. **Lambda for parallelism** — render multiple videos simultaneously in the cloud

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Error: Composition not found` | Check the composition `id` matches in Root.tsx and your render command |
| `Error: FFmpeg not found` | Install FFmpeg: `brew install ffmpeg` or `apt install ffmpeg` |
| Blank frames | Ensure `useCurrentFrame()` is used and animations cover the frame range |
| Audio out of sync | Use word-level timestamps from Whisper/ElevenLabs, not fixed offsets |
| Lambda timeout | Increase `timeoutInMilliseconds` or reduce video complexity |
| Memory issues on render | Reduce `concurrency` or render shorter segments |
| Agent writes invalid Remotion code | Install Agent Skills: `npx skills add remotion-dev/skills` |

---

## Resources

- [Remotion Docs](https://remotion.dev/docs/) — Official documentation
- [Remotion AI Docs](https://remotion.dev/docs/ai/) — AI integration guide
- [Remotion Templates](https://remotion.dev/templates/) — about 20 starter templates
- [Remotion Agent Skills](https://github.com/remotion-dev/skills) — 12 skills, about 5,300 stars
- [ClawVid](https://github.com/neur0map/clawvid) — Short-form pipeline (example code, inactive)
- [OpenClaw video generation](https://docs.openclaw.ai/tools/video-generation) — the built-in `video_generate` tool
- [remotion-media-mcp](https://github.com/stephengpope/remotion-media-mcp) — Media generation MCP
- [OpenClaw + Composio + Remotion tutorial](https://medium.com/composiohq/i-built-a-faceless-ai-video-pipeline-using-openclaw-composio-remotion-clawvid-heres-05618dc79705) — Step-by-step pipeline guide

---

## See Also

- [Lobster Workflows](/guides/lobster-workflows) — Orchestrate multi-step video pipelines
- [MCP Servers](/guides/mcp-servers) — Connect video MCP servers
- [Voice & Multimodal](/guides/voice-multimodal) — Image, music and speech generation
- [Cost Management](/guides/cost-management) — Optimize API spend
- [Automation](/guides/automation) — Schedule automated video generation
