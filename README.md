# Pixel office

A DSH Web client panel that turns a workspace into a pixel office you can work in: eight small workstations up top, two large desks (supervisor, secretary) across the bottom, and a chat popup for every employee. Agents are characters you can see, drag, dispatch and interview without leaving the room.

## Features

**The room**
- One office per workspace; the stage fills the panel at the 440:260 aspect ratio.
- Eight small desks in two depth rows (far ones drawn smaller) plus two large desks seen from behind.
- Names on the monitors, identities on the chair badges; every desk keeps its chair even while empty.
- Drag an Agent onto another desk to swap seats; order is remembered per office.
- Ambient life: a cat and a golden retriever roam, doze and eat; idle employees get up, stretch and chat. Ambient motion runs only while the pointer is over the office and the window is visible.
- Asymmetric decor: desk rug, aisle runner, cat tower, dog bed, plants, filing cabinet, water cooler, posters.

**People**
- Eight hairstyles, five accessories, five outfits and several palettes, so no two employees look alike.
- Identity dialog: the built-in supervisor/secretary, or a custom identity with its own colour and a one-line summary. Identities stay listed (with summaries) until you delete them; clicking the active card no longer clears it.
- Permission level dropdown per employee (default / read-only / workspace write / full access) — a prompt-level hint, not a host enforcement.
- Persona lives with the person, not the identity: click the avatar in the chat header to open a small popover and edit it.

**Memory** (never attached to every message)
- **Company rules** on the whiteboard: a hard list every employee follows.
- **Team summary** next to it: shared conclusions; a finished, accepted job adds one line automatically.
- **Personal summary** on the paper at each desk's left edge: one employee only, and inherited by whoever takes the desk next when they have none of their own.
- All of it is sent once, when you save or when you interview the employee — never per message.

**Collaboration**
- Dispatch with one line in any top-level conversation: `@Name：task` (`@Name task` also works).
- Only downwards: supervisor > secretary > everyone else, and nobody may task a supervisor.
- Every dispatch becomes a task card on the local board (persisted), shown in the bottom-right corner: open / done / accepted, with the report attached.
- **Accept** and **Reject**: accepting appends a line to the team summary; rejecting re-dispatches the job for a redo.
- An unfinished job is handed back to its owner when the office is opened again after a restart.
- The employee reports only to whoever dispatched the job; the report arrives as a message in that conversation.
- A letter flies from desk to desk on dispatch and back on report, purely visual.
- Hands are raised only for replies addressed to you, not for employee-to-employee traffic.

**Chat** (WeChat-style, inside the office)
- Bubbles split by paragraph, per-employee colours, avatars on both sides.
- Images render as clickable thumbnails and enlarge in an overlay; file names that belong to images stay hidden.
- Drafts are kept per employee; Enter sends, Shift+Enter breaks the line.
- Token usage for the session is shown in the middle of the header (K/M/B).

## Known limitations

- Tool-generated images (an Agent writes a file and mentions its path) cannot be previewed: DSH exposes no file-preview channel to third-party client plugins. Only images attached to a message render.
- Pending approvals/questions are not rendered inside the office; answer them in the full conversation.
- The permission level is advisory (prompt-level), because DSH does not expose permission presets to client plugins.

## Portability

Everything is built on public DSH client services: `sessions` (list, retain, snapshot, create), the session face (`prompt`, `cancel`, `rename`), `uiConversation.imageUrl`, `fileUpload.upload`, `workspaces.archiveSession`, `layout`, plus the `main` and `sidebar.panellist` slots. No host internals and no private RPC.

Office metadata lives in `localStorage` under `dsh-pixel-office.*`: roles and identity registry, seat order, personas, rules, personal summaries, team summary, seat memory, task board, capabilities, unread stamps, drafts.

## Install

Add the folder (or the published package) as a DSH bundle, then restart DSH; the office appears as a sidebar entry.

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

## How it works (for contributors)

- `index.js` — Host half: bundle entry only.
- `client.js` — the whole panel, no dependencies beyond the React the client provides.
  - `apply(ctx)` registers the sidebar icon and the main panel and reads only public client services.
  - The room is plain SVG (`RoomArtInner`, memoised), with HTML sprites layered on top so every click target stays above the art.
  - `OfficeView` owns identity, persona, memory, seat order, the task board and the dispatch watcher.
  - `ChatPanel` renders the conversation, images, tokens and the persona popover.
- `locale/en.json`, `locale/zh.json` — strings; `cordis.patch.yml` — bundle patch; `icon.svg` — sidebar icon.

### Touch points

| Want to change | Edit |
| --- | --- |
| Desk layout, depth, sprite size | `COLUMNS`, `ROW_DEFS`, `BIG_DEFS`, `smallSeat`, `bigSeat` |
| Character looks | `Sprite`, `paletteOf` |
| Room artwork | `RoomArtInner` |
| Chat bubbles, images, lightbox | `ChatPanel`, `ChatRow`, `ChatImage`, `FileCard` |
| Message parsing | `blocksOf` (accepts `kind` and `type`, attachment anywhere) |
| Dispatch, tasks, letters | the dispatch watcher in `OfficeView`, `parseDispatch`, `addTask`, `closeTask`, `flyLetter` |
| Memory and interview | `interviewAgent`, `teamBook`, `agentRulesBook`, `personaEditor` |
| Identity registry | `roleBook`, `identitySummaries`, `summaryOfIdentity`, `removeIdentity` |

Run `node --check client.js` after edits; the panel is wrapped in an error boundary that shows the error text instead of taking down the app.

## Licence

MIT — see `LICENSE`.
