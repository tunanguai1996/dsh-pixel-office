# Pixel office

A DSH Web client panel that turns a workspace into a pixel office you can work in: a perspective room with eight small workstations up top and two large desks (supervisor and secretary) across the bottom. Each Agent of the workspace sits at a desk as a small character; clicking one opens its conversation without leaving the room.

## Features

- **One room per workspace.** The stage fills the panel and keeps the 440x260 aspect ratio at any size.
- **Agents are characters.** Eight small desks (four columns, two depths, far ones drawn smaller) and two large desks seen from behind. Names are printed on the monitors, identities on the chair badges.
- **Differs by hand.** Eight hairstyles, five accessories, five outfits and several palettes, so no two employees look alike.
- **Drag to move.** Drop an Agent on another desk to swap seats; the order is remembered per office.
- **Identity dialog.** Pick the built-in supervisor/secretary, or add a custom identity with its own colour, one-line summary, and a detailed persona. Identities stay in the list (with their summaries) until you delete them.
- **Rules and memory.** Office rules live on the whiteboard, personal rules on the mug, persona in the identity dialog. They are **not** attached to every message: saving them (or clicking *Interview*) sends one memory message to that employee only, so chatting costs nothing extra in tokens.
- **Skills on the shelf.** Each desk's shelf lists the skills its owner has used; a new employee inherits the previous occupant's notes when it moves in.
- **Chat without leaving.** WeChat-style bubbles with avatars, per-employee colours, paragraph splitting, images as clickable thumbnails (enlarged inside the popup), files as name-and-size cards, drafts kept per employee.
- **Unread and work states.** A hand is raised when a finished run has not been read; the state dot follows the DSH session status.
- **Life in the room.** A cat and a golden retriever roam, doze, eat and talk; idle employees stand up, stroll and tease about their sub-agents. Ambient motion runs only while the pointer is over the office and the window is visible.
- **Bilingual.** English and Chinese strings ship in `locale/`.

## Portability

Everything is built on public DSH client services only: `sessions` (list, retain, snapshot, create), the session face (`prompt`, `cancel`, `rename`), `uiConversation.imageUrl`, `fileUpload.upload`, `workspaces.archiveSession`, `layout` panel selection, plus the `main` and `sidebar.panellist` slots. No host internals, no private RPC and no browser storage shared with other plugins.

The office's own metadata — identities, summaries, personas, office and personal rules, seat order, seat memory, unread stamps, drafts — is stored in `localStorage` under `dsh-pixel-office.*` and only affects prompts when you explicitly save or interview an employee.

## Install

The bundle is a normal DSH bundle:

```json
{
  "name": "@local/dsh-pixel-office",
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": ["@deepseek-ai/dsh-client-ui-layout", "@deepseek-ai/dsh-client-ui-sidebar"]
    }
  }
}
```

Add it to a profile and restart DSH; the office appears as a sidebar entry named **像素办公室 / Pixel office**.

## Layout

| Area | What it shows |
| --- | --- |
| Top wall | Windows, whiteboard with office rules, wall clock, plants, poster |
| Upper half | Eight small desks, two depth rows |
| Bottom | Supervisor and secretary desks, seen from behind |
| Floor | Desk rug, aisle runner, cat tower, dog bed and bowl |
| Ambient | Cat, dog, strolling employees, chat and quip bubbles |

## Licence

MIT — see `LICENSE`.

## Known limitations

- **Tool-generated images show as file cards.** When an Agent produces an image through a tool, the session event only carries its file path, and DSH exposes no file-preview channel to third-party client plugins (`remote.workspaceFiles` is reserved for first-party plugins, and the `dsh-resource://` scheme is not wired for bundles). The card shows the file name and can be clicked; open the full conversation in DSH to see the image itself.
- **Pending approvals are not rendered.** The office chat shows talk only; approve or answer questions in the full conversation.
- **Ambient life is paused** unless the pointer is over the office and the window is visible, by design.

## How it works (for contributors and reviewing Agents)

- `index.js` — the Host half: declares the bundle entry (no host services are registered).
- `client.js` — the whole Web panel in one file, no dependencies except the React the client provides. It exports one client module through `window.__ModuleLoader__.load`, then:
  - `apply(ctx)` registers the sidebar icon (`sidebar.panellist`) and the main panel (`main`), and injects only public client services: `sessions`, `uiConversation`, `fileUpload`, `workspaces`, `layout`, locale;
  - the room is drawn as plain SVG (`RoomArtInner`), with HTML sprites layered on top so every click target stays above the art;
  - state lives in `localStorage` under `dsh-pixel-office.*`: `.roles` (assignment, identity registry and summaries), `.seat-order`, `.persona`, `.rules`, `.agent-rules`, `.seat-memory`, `.seen-at`, `.draft.<agentId>`;
  - prompts only ever carry what you type; the memory block (identity, summary, rules, persona) is sent once when you save or interview, never per message.
- `locale/en.json`, `locale/zh.json` — strings; `cordis.patch.yml` — the bundle patch; `icon.svg` — the sidebar icon.

### Touch points when changing behaviour

| Want to change | Edit |
| --- | --- |
| Desk layout, depth, sprite size | `COLUMNS`, `ROW_DEFS`, `BIG_DEFS`, `smallSeat`, `bigSeat` |
| Character looks | `Sprite` (back / standing / seated), `paletteOf` |
| Chat bubbles, images, lightbox | `ChatPanel`, `ChatRow`, `ChatImage`, `FileCard` |
| Message parsing | `blocksOf` (accepts `kind` and `type`, `attachment` anywhere) |
| Memory / interview | `interviewAgent`, `interviewRef` |
| Ambient life | the four timers in `OfficeView` (`hoveredRef` gates them) |
| Identity registry | `roleBook`, `identitySummaries`, `summaryOfIdentity`, `removeIdentity` |

Run `node --check client.js` after edits; the panel is wrapped in a React error boundary that shows the error text instead of taking down the app.
