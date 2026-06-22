# Open Design — workflow & wiring (RoastMode)

_How RoastMode screens get designed via Open Design (OD). Captures the setup so it's not re-derived each time._

## What OD is here

Local-first design engine at `~/Desktop/Personal/open-design`. Drives agent-built screens via skills + runs. Used for designing/iterating RoastMode screens before they're translated into React Native.

> **RoastMode uses gluestack-ui v3 + NativeWind v4** (installed; provider mounted in `src/app/_layout.tsx`). UI components live in `src/components/ui/*` (`box`, `text`, `heading`, `vstack`, `hstack`, `button`, `input`, `spinner`, `divider`, `pressable`, `image`, `icon`, `center`). The shared wrappers `ThemedText` / `ThemedView` / `Button` are **gluestack-backed** (they render gluestack `Text` / `Box` / `Button` under the hood) and still honor `src/constants/theme.ts` (`Colors` light/dark, `Spacing`). Design tokens: gluestack scale in `tailwind.config.js` (`primary`/`secondary`/`typography`/`background`/…) + the CSS vars injected by `src/components/ui/gluestack-ui-provider/config.ts`; fonts in `src/global.css`. OD should design **on the gluestack token scale**. Brand color is deferred (gluestack default neutral palette) → recolor later = swap the `--color-primary-*` vars in the provider `config.ts`, not a per-screen redo.

## Daemon

- Runs with the **OD desktop app** — keep the app open while designing. Durable, survives Claude Code restarts.
- Listens on an **ephemeral port** (e.g. `127.0.0.1:61664`), not a fixed one. Don't hardcode it.
- Manual start (if app closed): `cd ~/Desktop/Personal/open-design && node apps/daemon/bin/od.mjs --no-open`. CLI bin: `apps/daemon/bin/od.mjs`.

## MCP wiring (`.mcp.json`)

RoastMode does **not** yet have a `.mcp.json`. To wire OD, create one at the project root:

```json
{ "mcpServers": { "open-design": {
  "command": "node",
  "args": ["/Users/d.vanderhoogt/Desktop/Personal/open-design/apps/daemon/bin/od.mjs", "mcp"]
}}}
```

- **No `OD_DAEMON_URL` env.** Setting it overrides OD's auto-discovery and pins a (wrong, ephemeral) port. Leave it out → the MCP discovers the live app daemon every spawn.
- MCP server caches the daemon URL at spawn → **restart Claude Code after a daemon restart** to re-discover.
- Verify connection: `list_projects` (MCP tool) returns the projects.

## Key MCP tools

`list_projects` · `list_skills` · `list_agents` · `create_project` · `start_run` · `get_run` · `get_artifact` · `get_file` / `write_file` / `list_files` / `search_files`.

## RoastMode design system seed

OD designs need RoastMode's gluestack token scale in front of them. Before the first run, seed a screens project with the project's design tokens:

- **Color scale** — from `tailwind.config.js` (gluestack `primary`/`secondary`/`tertiary`/`typography`/`background`/`outline`/`error`/`success` scales) + the concrete light/dark values in `src/components/ui/gluestack-ui-provider/config.ts` (the `--color-*` CSS vars). Express those vars in the OD (web) artifact so classes like `bg-background-0`, `text-typography-900` resolve.
- **Fonts** — from `src/global.css` (`--font-display` Spline Sans/Inter, `--font-rounded`, `--font-mono`).
- **Components** — mirror the gluestack primitives used in-app (`Box`, `Text`, `Heading`, `VStack`, `HStack`, `Button`, `Input`) as plain web equivalents so the artifact composes the same primitives the RN build will.

## Build recipe (per screen / batch)

1. `create_project(name: "roastmode-screens", skill: "frontend-design")`.
2. Seed it with the gluestack tokens above (color scale + provider CSS vars + fonts + gluestack primitives) via `write_file`.
3. `start_run(project: "roastmode-screens", skill: "frontend-design", agent: "claude", prompt: <screen spec>)` → `runId`.
   - Prompt = the screen's purpose from `AGENTS.md` (§4/§14) + every state (loading/empty/error/offline + paused/weekly-pending/partial/skipped/anon) + "use the project's gluestack v3 token scale + NativeWind classes, stay on-system, colors tokenized (brand/dark polish later = single `--color-primary-*` swap)".
4. Poll `get_run(runId)` until `succeeded` → `get_artifact` to pull HTML (or open `previewUrl`).
5. **STOP — user verifies the design before any RN build** (see `docs/build-workflow.md` §1 Step 3).

## Conventions

- Brand color + dark-mode polish deliberately deferred → design on the gluestack default neutral palette; recolor = swap `--color-primary-*` in the provider `config.ts`. Keep everything tokenized (gluestack classes, no hardcoded hex).
- Every screen covers loading / empty / error / offline + the roast-specific states (paused, weekly-target pending, partial completion, skipped, anonymous session). Mirror `AGENTS.md` §4 + the Golden Rule (§3.1) — any rendered roast copy is excuse/behavior-directed, never person-directed.
- OD is design only. App architecture/layers stay per `AGENTS.md` §15; tasks per `BUILD_PLAN.md`; the build procedure per `docs/build-workflow.md`.
- **OD outputs web; the app is React Native + gluestack-ui v3.** Always translate to gluestack RN components (`src/components/ui/*`) on the same token scale, never paste.
