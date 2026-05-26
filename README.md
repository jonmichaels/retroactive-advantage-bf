# Retroactive Advantage — Black Flag / Tales of the Valiant

> **⚠️ Disclaimer:** This module was created by an AI coding agent (Hephaestus, via Hermes Agent) under the direction of Jon Michaels. While tested and functional, users should verify behavior in their own games before relying on it in critical sessions.

[![Foundry VTT](https://img.shields.io/badge/Foundry-v13-orange)](https://foundryvtt.com)
[![Black Flag](https://img.shields.io/badge/System-Black%20Flag%20%2F%20ToV-blue)](https://github.com/koboldpress/black-flag)
[![Version](https://img.shields.io/badge/Version-1.0.2-green)](https://github.com/jonmichaels/retroactive-advantage-bf/releases)

Adds Advantage / Normal / Disadvantage re-roll buttons to d20 chat messages in **Black Flag Roleplaying (Tales of the Valiant)** for Foundry VTT.

Players can retroactively change their roll's advantage mode without re-rolling from the character sheet. The current mode's button is disabled to show what was rolled.

## Installation

**In Foundry VTT:**
1. Go to **Add-on Modules** → **Install Module**
2. Paste the manifest URL: `https://github.com/jonmichaels/retroactive-advantage-bf/releases/latest/download/module.json`
3. Click **Install**

**Manual:**
Download the latest release zip and extract to `Data/modules/retroactive-advantage-bf/`.

## Requirements

- **Foundry VTT** v13+
- **Black Flag Roleplaying** (Tales of the Valiant) system v2.0+

## How It Works

After a d20 roll appears in chat, three buttons are added below the dice result:

| Button | Effect |
|--------|--------|
| **Disadvantage** | Changes the roll to disadvantage (keep lowest d20) |
| **Normal** | Changes the roll to a straight roll (single d20) |
| **Advantage** | Changes the roll to advantage (keep highest d20) |

The currently active mode's button is disabled.

## Credits

This module is a Black Flag / Tales of the Valiant port of the D&D 5E Retroactive Advantage module.

- **Original module:** [ElfFriend-DnD/foundryvtt-retroactive-advantage-5e](https://github.com/ElfFriend-DnD/foundryvtt-retroactive-advantage-5e) — created by ElfFriend-DnD
- **Updated fork:** [krbz999/foundryvtt-retroactive-advantage-5e](https://github.com/krbz999/foundryvtt-retroactive-advantage-5e) — maintained by krbz999
- **Black Flag port:** This module — by Jon Michaels, coded by Hephaestus (AI agent)

## License

MIT
