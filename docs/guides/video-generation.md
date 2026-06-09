---
sidebar_position: 22
title: Video Generation with Remotion
description: Comprehensive guide to programmatic video creation with OpenClaw and Remotion — skills, MCP servers, templates, rendering pipelines, and production recipes
keywords: [openclaw, remotion, video generation, programmatic video, tiktok, youtube shorts, ai video, mcp video, remotion agent skills]
---

# Video Generation with Remotion

OpenClaw + Remotion is one of the most powerful combinations in the ecosystem. Remotion lets you create videos with React components, and OpenClaw can orchestrate the entire pipeline — from script generation to rendering to publishing. The Remotion Video Toolkit is the **most-installed video skill on ClawHub** with 126,000+ installs.

This guide covers the full landscape: skills, MCP servers, rendering APIs, production recipes, and cost optimization.

---

## Quick vs Full: Choosing Your Approach

OpenClaw has **two paths** for video generation — pick the one that fits your need:

| | **`video_generate` tool** | **Remotion** |
|---|---|---|
| **Setup** | None — built-in tool, one call | Node.js project, React, FFmpeg |
| **Best for** | Quick clips, one-off demos, simple prompts | Branded content, templates, recurring series |
| **Control** | Prompt-only — you describe, AI generates | Full creative control — React components, animations, layouts |
| **Customization** | Limited to what the AI model produces | Unlimited — any React code, custom fonts, charts, 3D |
| **Reproducibility** | Each generation is unique | Deterministic — same props = same video |
| **Cost** | Per-generation API cost | Free local rendering + optional API costs for assets |
| **Example** | `"Make a 5-second hello world clip"` | Templated TikTok series, data dashboards, branded intros |

**Start with `video_generate`** if you just want a quick video from a text prompt — no setup needed:

```
openclaw chat "Generate a 5-second video of a hello world animation"
```

**Use Remotion** when you need templates, branding, recurring content, or pixel-perfect control. The rest of this guide covers the Remotion path.

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
# Create a new Remotion project
npx create-video@latest my-video

# Or use the prompt-to-video template
npx create-video@latest --template prompt-to-video
```

### 2. Install Remotion Agent Skills

Agent Skills teach OpenClaw how to write correct Remotion code — 28 modular rule files covering 9 component patterns and 7 transition types.

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

### Remotion Video Toolkit

The flagship video skill — a complete toolkit for React-based video creation.

```bash
openclaw skills install remotion-video-toolkit
```

**Capabilities:** Animations, timing, rendering, captions, 3D (React Three Fiber), charts, text effects, transitions, and template scaffolding.

### ClawVid

Short-form video generator for YouTube Shorts, TikTok, and Instagram Reels.

```bash
openclaw skills install clawvid
```

**GitHub:** [neur0map/clawvid](https://github.com/neur0map/clawvid)

**Pipeline:** Text prompt → AI script → asset generation → Remotion composition → rendered video → platform-ready output with captions and music.

### TikTok Engine

Programmatic TikTok and Reels generator that runs Remotion as an OpenClaw skill.

```bash
openclaw skills install tiktok-engine
```

**GitHub:** [callwallagent/tiktok-engine](https://github.com/callwallagent/tiktok-engine)

### Pexo

Auto-selects across 10+ video generation models with multi-shot sequencing. Reported 73% faster production than manual model selection.

```bash
openclaw skills install pexo
```

### BibiGPT

AI video summarization across 30+ platforms (Bilibili, YouTube, etc.) — useful for research and content repurposing.

```bash
openclaw skills install bibigpt
```

### video-agent

Part of the official `openclaw/skills` repository with detailed Remotion integration docs.

**GitHub:** [openclaw/skills — video-agent](https://github.com/openclaw/skills/blob/main/skills/michaelwang11394/video-agent/references/remotion-integration.md)

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

```json5 title="~/.openclaw/openclaw.json"
{
  "mcp": {
    "servers": {
      "ffmpeg": {
        "command": "npx",
        "args": ["ffmpeg-mcp"]
      }
    }
  }
}
```

**GitHub:** [video-creator/ffmpeg-mcp](https://github.com/video-creator/ffmpeg-mcp)

### sora-2-mcp

OpenAI Sora 2 video generation with FFmpeg merging. Generates AI video clips that can be composited into Remotion projects.

**GitHub:** [writingmate/sora-2-mcp](https://github.com/writingmate/sora-2-mcp)

### mcp-video

Guardrailed video editing MCP with planning and quality checks — safer for autonomous operation.

**GitHub:** [KyaniteLabs/mcp-video](https://github.com/KyaniteLabs/mcp-video)

---

## Remotion AI Integration

Remotion has invested heavily in AI-agent compatibility.

### Agent Skills

The most important integration. Install in your Remotion project:

```bash
npx skills add remotion-dev/skills
```

This adds 28 rule files that teach your AI agent:
- How to structure compositions and sequences
- 9 component patterns (text, image, video, audio, shape, chart, 3D, code, transition)
- 7 transition types with proper timing
- Animation best practices with `interpolate()` and `spring()`
- How to use `staticFile()` for assets
- Rendering configuration

**GitHub:** [remotion-dev/skills](https://github.com/remotion-dev/skills) (3.6k stars)

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
npx create-video@latest --template prompt-to-video
cd my-prompt-video

# Set API keys
export OPENAI_API_KEY=sk-...
export ELEVENLABS_API_KEY=...

# Generate a video from a prompt
npm run gen -- "Explain how OpenClaw's heartbeat system works in 60 seconds"
```

**What happens under the hood:**
1. GPT-4.1 generates a script with scene descriptions
2. DALL-E 3 generates images for each scene
3. ElevenLabs generates voiceover with word-level timestamps
4. A JSON timeline is assembled
5. Remotion renders the composition with synced visuals and audio

### Custom pipeline with OpenClaw

For more control, build your own pipeline:

```bash title="Step 1: Generate script"
openclaw chat "Write a 60-second video script about OpenClaw's memory system. 
Format as JSON: { scenes: [{ duration: number, narration: string, visual: string }] }"
```

```bash title="Step 2: Generate assets"
# With remotion-media-mcp configured, OpenClaw can:
# - generate_speech for narration
# - generate_image for scene backgrounds
# - generate_music for background track
```

```bash title="Step 3: Create composition"
# OpenClaw generates a Remotion composition using Agent Skills knowledge
openclaw chat "Create a Remotion composition from this script JSON. 
Use Sequence for each scene, AbsoluteFill for layouts, 
and spring() for transitions."
```

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
- **DALL-E 3** — via OpenAI API (used by the prompt-to-video template)
- **Stable Diffusion** — via local or API deployment
- **remotion-media-mcp** — `generate_image` tool handles this automatically

### FFmpeg (Post-processing)

Remotion uses FFmpeg internally, but for post-processing:
- Concatenate multiple rendered clips
- Add watermarks or overlays
- Convert formats (MP4 → GIF, WebM)
- Extract audio tracks

The `ffmpeg-mcp` server lets OpenClaw run FFmpeg operations via natural language.

---

## Production Recipes

### Faceless TikTok / YouTube Shorts

The most popular use case. Full pipeline using ClawVid:

```yaml title="lobster-workflow.yml"
name: faceless-short
steps:
  - id: script
    run: |
      openclaw chat "Write a 45-second script about {{topic}}.
      Format: { scenes: [...], hook: string, cta: string }"
    output: script.json

  - id: assets
    run: |
      openclaw chat "Using remotion-media-mcp:
      1. generate_speech for each scene narration
      2. generate_image for each scene background  
      3. generate_music for a background track"
    needs: [script]

  - id: render
    run: npx remotion render TikTokVideo out/short.mp4 --props=script.json
    needs: [assets]

  - id: thumbnail
    run: npx remotion still TikTokVideo out/thumb.png --frame=15
    needs: [render]
```

### Audiogram (Podcast Clips)

Turn podcast audio into shareable video clips with waveform visualization:

```bash
# Use the audiogram template
npx create-video@latest --template audiogram
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
npx create-video@latest --template code-hike
```

OpenClaw can generate the code snippets and step-by-step annotations, then Remotion renders them with syntax highlighting and smooth transitions.

### Automated Daily Digest

Combine with heartbeat for recurring video content:

```json5 title="~/.openclaw/openclaw.json"
{
  "heartbeat": {
    "tasks": [
      {
        "name": "daily-video-digest",
        "interval": 86400,
        "prompt": "Create a 60-second video digest of today's top OpenClaw community updates. Use the Remotion Video Toolkit to generate and render it, then save to ~/videos/digest/"
      }
    ]
  }
}
```

---

## Lobster Workflow for Video Pipelines

For complex multi-step video production, use [Lobster](/guides/lobster-workflows):

```yaml title="video-pipeline.yml"
name: video-production-pipeline
description: End-to-end AI video production

steps:
  - id: research
    run: |
      openclaw chat "Research trending topics in AI this week. 
      Return top 3 as JSON: [{ topic, angle, audience }]"

  - id: scripts
    for_each: "research.output[*]"
    run: |
      openclaw chat "Write a 60-second TikTok script about: {{item.topic}}
      Angle: {{item.angle}}
      Target: {{item.audience}}
      Format: JSON with scenes array"

  - id: generate_assets
    for_each: "scripts.output[*]"
    parallel: true
    run: |
      openclaw chat "For this script, generate all assets:
      1. Scene images (DALL-E or generate_image)
      2. Voiceover (ElevenLabs or generate_speech)  
      3. Background music (generate_music)
      4. Subtitles (generate_subtitles)
      Save all to public/ directory"

  - id: render
    for_each: "generate_assets.output[*]"
    run: npx remotion render TikTokVideo "out/video-{{index}}.mp4" --props="{{item.propsPath}}"

  - id: thumbnails
    for_each: "render.output[*]"
    parallel: true
    run: npx remotion still TikTokVideo "out/thumb-{{index}}.png" --frame=15

  - id: publish
    for_each: "render.output[*]"
    run: |
      openclaw chat "Post video {{item.path}} to TikTok and YouTube Shorts
      with title and hashtags from the script"
    approval: required
```

---

## Alternatives and Comparisons

| Tool | Type | Best For | AI Integration |
|------|------|----------|----------------|
| **Remotion** | React framework | Custom compositions, full control | Agent Skills, MCP, system prompts |
| **Revideo/Midrender** | Motion Canvas fork | Visual editor + code | MCP support |
| **JSON2Video** | Template API | Simple template-based videos | REST API, Make.com, n8n |
| **Synthesia** | Avatar platform | Talking-head videos | Video Agents (interactive) |
| **FFmpeg** | CLI tool | Post-processing, conversion | ffmpeg-mcp |
| **Sora** | AI model | AI-generated footage | sora-2-mcp |

Remotion is the best choice when you need **full programmatic control** and **React ecosystem compatibility**. Use JSON2Video for simpler template-based generation without code.

---

## Cost and Performance

### Rendering costs

| Method | Cost | Render Time (60s video) |
|--------|------|------------------------|
| **Local (CLI)** | Free (your hardware) | 1-5 min depending on complexity |
| **Remotion Lambda** | ~$0.01-0.05 per render | 10-30 seconds |
| **Cloud Run** | ~$0.02-0.10 per render | 15-45 seconds |

### API costs per video

| Service | Usage | Cost |
|---------|-------|------|
| **GPT-4.1** (script) | ~2K tokens | ~$0.02 |
| **DALL-E 3** (5 scenes) | 5 images | ~$0.20 |
| **ElevenLabs** (60s voiceover) | ~150 words | ~$0.03 |
| **Total per video** | | **~$0.25** |

### Optimization tips

1. **Cache AI-generated assets** — don't regenerate images/audio for unchanged scenes
2. **Use `concurrency`** — `renderMedia({ concurrency: "75%" })` uses more CPU threads
3. **Render at target resolution** — don't render 4K if publishing to TikTok (1080x1920)
4. **Use Haiku/local models** for script generation when quality isn't critical
5. **Batch renders** — render overnight with heartbeat for cost-effective scheduling
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
- [Remotion Templates](https://remotion.dev/templates/) — 22+ free templates
- [Remotion Agent Skills](https://github.com/remotion-dev/skills) — 3.6k star skill set
- [ClawVid](https://github.com/neur0map/clawvid) — Short-form video generation
- [TikTok Engine](https://github.com/callwallagent/tiktok-engine) — TikTok/Reels generator
- [remotion-media-mcp](https://github.com/stephengpope/remotion-media-mcp) — Media generation MCP
- [OpenClaw + Composio + Remotion tutorial](https://medium.com/composiohq/i-built-a-faceless-ai-video-pipeline-using-openclaw-composio-remotion-clawvid-heres-05618dc79705) — Step-by-step pipeline guide

---

## See Also

- [Lobster Workflows](/guides/lobster-workflows) — Orchestrate multi-step video pipelines
- [MCP Servers](/guides/mcp-servers) — Connect video MCP servers
- [Heartbeat](/guides/heartbeat) — Schedule automated video generation
- [Cost Management](/guides/cost-management) — Optimize API spend
- [Automation](/guides/automation) — Cron-based video scheduling
