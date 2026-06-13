# retroactive-advantage-bf — Foundry VTT Development Notes

## Purpose
- Adds retroactive Advantage / Normal / Disadvantage buttons to Black Flag Roleplaying / Tales of the Valiant d20 chat rolls.
- Lets players change a roll's advantage mode after the roll appears in chat without rolling again from the actor sheet.
- Ported from D&D 5E Retroactive Advantage modules, adapted for Black Flag Challenge Die / advantage-mode behavior.

## Runtime Targets
- Current released target in `module.json`: Foundry v13, Black Flag v2+.
- Current compatibility work: Foundry v14 + Black Flag v3.
- Local project: `/home/jon/projects/retroactive-advantage-bf`.
- v14 module symlink: `/home/jon/foundryuserdata14/Data/modules/retroactive-advantage-bf -> /home/jon/projects/retroactive-advantage-bf`.
- v14 Foundry MCP Bridge symlink for live testing: `/home/jon/foundryuserdata14/Data/modules/foundry-mcp-bridge -> /home/jon/projects/foundry-vtt-mcp/packages/foundry-module`.
- Use the locally configured Foundry v14 development server/port from the active environment. Do not commit private Foundry hostnames or URLs.

## Current Architecture
- Manifest: `module.json`.
- Entry point: `module/retroactive-advantage-bf.mjs`.
- Styles: `module/retro-adv.css`.
- Button template: `module/retro-buttons.hbs`.
- Localization: `lang/en.json`.
- Main class: `RetroAdvantageBF`.
- Init hook: `Hooks.on("init", RetroAdvantageBF.init)`.
- Chat hook: `Hooks.on("renderChatMessageHTML", async (message, html) => { ... })` injects buttons into d20 roll chat cards. `renderChatMessage` is deprecated in Foundry v13+ and logs warnings in v14.
- Button click path:
  1. `data-retro-action` button click (`dis`, `norm`, `adv`)
  2. `_onClickRetroButton(event)` finds the containing chat message id
  3. `_handleChatButton(action, messageId)` reads the original message/roll
  4. `_makeNewRoll(d20Roll, newAdvMode, messageOptions)` clones and mutates the d20 term
  5. `newD20Roll.toMessage({}, { create: false })` creates update data
  6. original `ChatMessage` is updated in-place

## Advantage / Roll Data Rules
- Uses `CONFIG.Dice.ChallengeDie?.MODES` when available; falls back to numeric values `{ DISADVANTAGE: -1, NORMAL: 0, ADVANTAGE: 1 }`.
- Only acts on rolls where the first term is a d20: `roll.terms[0]?.faces === 20`.
- Changing to advantage/disadvantage applies `kh`/`kl` modifiers and rolls an added d20 only when the original was a single-d20 normal roll.
- Changing to normal reduces to one result and clears keep-high/keep-low modifiers.
- Clears `d20Term.options.flavor` to avoid known repeated feature-loop behavior.
- Dice So Nice integration shows only newly-added dice when the retroactive mode adds a second d20.

## Build / Test Commands
- No bundler/package setup currently; source is loaded directly by Foundry from module files.
- Static checks:
  - `node --check module/retroactive-advantage-bf.mjs`
  - `python3 -m json.tool module.json >/dev/null`
- Release packaging, if needed later, must keep `module.json` at the zip root for Foundry installer compatibility.
- Live v14 checks should use Foundry MCP or `fvtt game script execute` where possible, then verify in the running Black Flag v3 test world.

## v14 / Black Flag v3 Compatibility Checklist
- Verify `renderChatMessage` still fires in Foundry v14 and whether it is deprecated/replaced for v14 chat rendering.
- Verify the hook receives either a DOM element or jQuery wrapper; current code handles both `querySelector` and `html.find(...)`.
- Verify chat messages still expose `message.isAuthor`, `message.isOwner`, `message.isRoll`, `message.rolls`, and `message.rolls[0]` in v14.
- Verify Black Flag v3 d20 rolls still store mode in `roll.options.advantageMode` and still use `CONFIG.Dice.ChallengeDie.MODES`.
- Verify roll term internals still allow the current clone/mutate path: `terms`, first d20 term `number`, `results`, `modifiers`, `roll()`, `_evaluateModifiers()`, `Roll.getFormula(...)`, and `_evaluateTotal(...)`.
- Verify `newD20Roll.toMessage({}, { create: false })` and `ChatMessage.update(...)` still work for in-place chat card replacement in v14.
- Verify buttons render in the correct location for Black Flag v3 chat cards and remain styled by `retro-adv.css`.
- Watch logs for Foundry v14 deprecation warnings, especially hook names, ChatMessage fields, private Roll APIs, and jQuery compatibility.

## Reference Workflow
- Load/read this file before editing.
- Follow the global Foundry rule: reference before intuition. For Black Flag roll/chat data questions, inspect live v14/BF v3 objects before changing code.
- Useful QMD queries:
  - `Foundry v14 renderChatMessage chat message hook ApplicationV2 ChatMessage`
  - `Black Flag v3 ChallengeDie MODES advantageMode roll options d20`
  - `Foundry v14 Roll terms modifiers evaluateTotal ChatMessage update`
- Prefer focused compatibility fixes over broad refactors.
- Commit and push every meaningful change.

## Known Pitfalls
- The module relies on Foundry Roll internals (`terms`, `_formula`, `_total`, `_evaluateModifiers`, `_evaluateTotal`). These are likely compatibility risks in Foundry v14 and must be live-verified.
- Do not assume dnd5e retroactive-advantage behavior maps exactly to Black Flag v3; Black Flag's Challenge Die / roll options are authoritative.
- Keep generic d20 detection unless live BF v3 inspection proves it is too broad.
- If visual button placement/styling is reported with a screenshot or “VISUALLY ANALYZE,” call `vision_analyze` before coding visual fixes.
- Do not commit private Foundry hostnames, URLs, credentials, or full copyrighted RPG prose.
