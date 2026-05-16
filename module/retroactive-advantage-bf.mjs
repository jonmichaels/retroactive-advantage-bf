class RetroAdvantageBF {
  static MODULE_NAME = "retroactive-advantage-bf";
  static MODULE_TITLE = "Retroactive Advantage for Black Flag / Tales of the Valiant";

  /* -------------------------------------------------- */

  /**
   * Handles creating a new roll with the updated advantage mode.
   * Ported from retroactive-advantage-5e — adapted for Black Flag.
   * @param {Roll} d20Roll              The original roll instance.
   * @param {number} newAdvMode         CONFIG.Dice.ChallengeDie.MODES value.
   * @param {object} [messageOptions]   Options for Dice So Nice.
   * @returns {Roll}                    A new roll instance with updated advantage.
   */
  static async _makeNewRoll(d20Roll, newAdvMode, messageOptions) {
    if (newAdvMode === undefined) {
      throw new Error("RetroAdvBF: you must provide what the New Advantage mode is");
    }

    // Generic d20 detection — works for any system's d20 rolls
    if (!(d20Roll instanceof Roll) || d20Roll.terms[0]?.faces !== 20) {
      throw new Error("RetroAdvBF: provided roll was not a d20 roll");
    }

    if (d20Roll.options.advantageMode === newAdvMode) {
      throw new Error("RetroAdvBF: provided roll is already that kind of roll");
    }

    // Use Black Flag's MODES if available, fall back to numeric values
    const { DISADVANTAGE, NORMAL, ADVANTAGE } = CONFIG.Dice.ChallengeDie?.MODES
      || { DISADVANTAGE: -1, NORMAL: 0, ADVANTAGE: 1 };

    // Clone the roll without mutating the original
    let newD20Roll = new d20Roll.constructor(d20Roll._formula, {...d20Roll.data}, {...d20Roll.options});
    newD20Roll.options.advantageMode = newAdvMode;

    // Copy and mutate terms
    newD20Roll.terms = [...d20Roll.terms];
    let d20Term = newD20Roll.terms[0];
    const filteredModifiers = d20Term.modifiers.filter((modifier) => !["kh", "kl"].includes(modifier));
    const originalResultsLength = d20Term.results.length;
    d20Term.modifiers = [...filteredModifiers];

    switch (newAdvMode) {
      case NORMAL:
        d20Term.number = 1;
        d20Term.results = [d20Term.results.shift()];
        break;

      case ADVANTAGE:
        d20Term.modifiers.push("kh");
        if (d20Term.number === 1) {
          d20Term.number = 2;
          await d20Term.roll();
        }
        break;

      case DISADVANTAGE:
        d20Term.modifiers.push("kl");
        if (d20Term.number === 1) {
          d20Term.number = 2;
          await d20Term.roll();
        }
        break;
    }

    // Clear term flavor to prevent "Reliable Talent" loop
    d20Term.options.flavor = undefined;

    // Reset each result to pre-evaluateModifiers state
    d20Term.results.forEach((term) => {
      term.active = true;
      delete term.discarded;
      delete term.indexThrow;
    });

    // Re-evaluate modifiers (applies kh/kl)
    await d20Term._evaluateModifiers();

    // Reconstruct formula and total using Foundry core methods
    newD20Roll._formula = Roll.getFormula(newD20Roll.terms);
    newD20Roll._total = Roll.prototype._evaluateTotal.call(newD20Roll);

    // Dice So Nice integration — only roll new dice that were added
    if (game.modules.get("dice-so-nice")?.active && d20Term.results.length > originalResultsLength) {
      const fakeD20Roll = Roll.fromTerms([new foundry.dice.terms.Die({...d20Term, faces: 20})]);
      fakeD20Roll.terms[0].results = fakeD20Roll.terms[0].results.filter((foo, index) => index > 0);
      fakeD20Roll.terms[0].number = fakeD20Roll.terms[0].results.length;

      await game.dice3d.showForRoll(
        fakeD20Roll,
        game.users.get(messageOptions?.userId),
        true,
        messageOptions?.whisper?.length ? messageOptions.whisper : null,
        messageOptions?.blind,
        null,
        messageOptions?.speaker
      );
    }

    return newD20Roll;
  }

  /* -------------------------------------------------- */

  /**
   * Handle button clicks from the chat log.
   * @param {string} action      "dis", "norm", or "adv"
   * @param {string} messageId   The chat message ID
   */
  static _handleChatButton = async (action, messageId) => {
    try {
      const { DISADVANTAGE, NORMAL, ADVANTAGE } = CONFIG.Dice.ChallengeDie?.MODES
        || { DISADVANTAGE: -1, NORMAL: 0, ADVANTAGE: 1 };

      const chatMessage = game.messages.get(messageId);
      if (!action || !chatMessage) throw new Error("RetroAdvBF: Missing Information");

      const [roll] = chatMessage.rolls;
      if (!(roll instanceof Roll) || roll.terms[0]?.faces !== 20) return;

      let newD20Roll;

      const messageOptions = {
        userId: chatMessage.author,
        whisper: chatMessage.whisper,
        blind: chatMessage.blind,
        speaker: chatMessage.speaker
      };

      switch (action) {
        case "dis":
          newD20Roll = await this._makeNewRoll(roll, DISADVANTAGE, messageOptions);
          break;
        case "norm":
          newD20Roll = await this._makeNewRoll(roll, NORMAL, messageOptions);
          break;
        case "adv":
          newD20Roll = await this._makeNewRoll(roll, ADVANTAGE, messageOptions);
          break;
      }

      let update = await newD20Roll.toMessage({}, {create: false});
      [
        "blind", "timestamp", "user", "whisper", "speaker",
        "emote", "flags", "flavor", "sound", "type", "_id"
      ].forEach(k => delete update[k]);
      update = foundry.utils.mergeObject(chatMessage.toJSON(), update);

      return chatMessage.update(update);
    } catch (err) {
      console.error("RetroAdvantageBF | A problem occurred:", err);
    }
  };

  /* -------------------------------------------------- */

  /** Initialize module. */
  static init() {
    console.log(`${RetroAdvantageBF.MODULE_NAME} | Initializing ${RetroAdvantageBF.MODULE_TITLE}`);

    /**
     * Add re-roll buttons to chat messages.
     * Uses the generic renderChatMessage hook (works in any system).
     * @param {ChatMessage} message   The message being rendered.
     * @param {HTMLElement} html      The element of the message.
     */
    Hooks.on("renderChatMessage", async (message, html) => {
      // DEBUG: trace every renderChatMessage call
      const rollsLength = message.rolls?.length ?? 0;
      const isRoll = message.isRoll ?? false;
      console.debug(`RetroBF | renderChatMessage | isAuthor=${!!message.isAuthor} isOwner=${!!message.isOwner} isRoll=${isRoll} rollsLength=${rollsLength} type=${message.type}`);

      if (!(message.isAuthor || message.isOwner) || !isRoll) {
        console.debug(`RetroBF | Guard 1 FAILED`);
        return;
      }

      const [roll] = message.rolls;
      const isD20 = roll && (roll instanceof Roll || roll instanceof foundry.dice.Roll) && roll.terms[0]?.faces === 20;
      if (!isD20) {
        console.debug(`RetroBF | Guard 2 FAILED | instanceof Roll=${roll instanceof Roll} typeof=${typeof roll} faces=${roll?.terms?.[0]?.faces} hasRoll=${!!roll}`);
        return;
      }

      console.debug(`RetroBF | PASSED guards | advMode=${roll.options?.advantageMode}`);

      const advantageMode = roll?.options?.advantageMode;
      const { DISADVANTAGE, NORMAL, ADVANTAGE } = CONFIG.Dice.ChallengeDie?.MODES
        || { DISADVANTAGE: -1, NORMAL: 0, ADVANTAGE: 1 };

      const div = document.createElement("DIV");
      div.innerHTML = await renderTemplate("modules/retroactive-advantage-bf/module/retro-buttons.hbs", {
        dis: advantageMode === DISADVANTAGE,
        norm: advantageMode === NORMAL,
        adv: advantageMode === ADVANTAGE
      });

      div.querySelectorAll("[data-retro-action]").forEach(n => {
        n.addEventListener("click", RetroAdvantageBF._onClickRetroButton.bind(RetroAdvantageBF));
      });

      // Generic CSS selectors — try dice-roll first, then chat-card
      const dr = html.querySelector(".dice-roll");
      const dr2 = html.querySelector ? html.querySelector(".dice-result") : null;
      const dr3 = html.querySelector ? html.querySelector(".dice-formula") : null;
      console.debug(`RetroBF | CSS check | html.className="${html.className || '(none)'}" | .dice-roll=${!!dr} .dice-result=${!!dr2} .dice-formula=${!!dr3} | html.tagName=${html.tagName}`);
      
      if (dr) {
        console.debug(`RetroBF | Inserting before .dice-roll`);
        return dr.before(div.firstElementChild);
      }

      const cc = html.querySelector(".chat-card");
      if (cc) return cc.append(div.firstElementChild);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Handle clicking a retro button.
   * @param {PointerEvent} event   The initiating click event.
   */
  static async _onClickRetroButton(event) {
    const action = event.currentTarget.dataset.retroAction;
    const messageId = event.currentTarget.closest("[data-message-id]").dataset.messageId;
    this._handleChatButton(action, messageId);
  }
}

/* -------------------------------------------------- */

Hooks.on("init", RetroAdvantageBF.init);
