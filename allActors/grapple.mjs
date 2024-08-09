/*  REQUIRES MODULE: 
    - Rideable
    - Requestor
    - dFred's Convenient Effects
*/


/*
    Grappling workflow

    1) target another token
    2) use the feat "Grapple"
    3) roll the skill check
    3) wait for the owner of the other token to roll the opposing skill check
    4) if the grapple is successful, click "Apply Effects" button in the chat message

    To stop grappling a creature, use the "End Grapple" macro.
*/

import { _foundryHelpers } from "../scripts/_foundryHelpers.mjs";
import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {

    _onSetup() {
        TaliaCustomAPI.add({
            Grapple
        });

        Hooks.on("talia-custom.postGrapple", (grabbedTokenId, grabbingTokenId) => {
            
            console.log({grabbedTokenId, grabbingTokenId});
        });

        Hooks.on("renderChatMessage", (msg, html, data) => {
            if(msg.flags?.["talia-custom"]?.hideFromPlayers && !game.user?.isGM) {
                html.hide();
                return;
            }
        });
    }
}

class Grapple {
    constructor({
        actorTokenId,
        targetTokenId,
        actorCheck = { total: undefined, isCritical: undefined, isFumble: undefined },
        targetCheck = { total: undefined, isCritical: undefined, isFumble: undefined },
    } = {}) {
        this.actorTokenId = actorTokenId;
        this.targetTokenId = targetTokenId;
        this.actorCheck = actorCheck;
        this.targetCheck = targetCheck;
    }

    initialize() {
        this.actorToken = this.actorTokenId ? canvas.scene.tokens.get(this.actorTokenId) : undefined;
        this.targetToken = this.targetTokenId ? canvas.scene.tokens.get(this.targetTokenId) : undefined;
        return this;
    }

    getTarget() {
        if(game.user.targets.size !== 1) ui.notifications.error("You need to target exactly one token.");
        this.targetTokenId = game.user.targets.first().id;
        return this;
    }

    validateImmunity() {
        if(this.targetToken.actor.getRollData().traits.ci.value.has("grappled")) ui.notifications.error("Your target is immune to being grappled.");
        return this;
    }

    validateSizeDiff() {
        function _grappleSizeIndex(actor) {
            const rollData = actor.getRollData();
            const baseSizeIndex = ['tiny', 'sm', 'med', 'lg', 'huge', 'grg'].indexOf(rollData.traits.size);
            //factor in flag "talia-custom.grappleSizeBonus"
            const grappleSizeBonus = rollData.flags?.["talia-custom"]?.grappleSizeBonus ? rollData.flags?.["talia-custom"]?.grappleSizeBonus : 0;
            //factor in flag "dnd5e.powerfulBuild", add +1 to bonus if it's enabled
            const powerfulBuildBonus = rollData.flags?.dnd5e?.powerfulBuild ? 1 : 0;
            return baseSizeIndex + grappleSizeBonus + powerfulBuildBonus;
        }
        if(_grappleSizeIndex(this.targetToken.actor) > _grappleSizeIndex(this.actorToken.actor) + 1) ui.notifications.error("This creature is too big for you to grapple.");
        return this;
    }

    async rollActorCheck() {
        const roll = await this.actorToken.actor.rollSkill("ath", {flavor: "Grapple Check"});
        if(!roll) ui.notifications.error("The roll was declined.");
        this.actorCheck.total = roll.total;
        this.actorCheck.isCritical = roll.isCritical;
        this.actorCheck.isFumble = roll.isFumble;
        return this;
    }

    async rollTargetCheck() {
        const rollData = this.targetToken.actor.getRollData();
        const higherSkill = rollData.skills.acr.total > rollData.skills.ath.total ? "acr" : "ath";
        const DC = this.actorCheck.isFumble ? 0 : this.actorCheck.isCritical ? 99 : this.actorCheck.total;
        const roll = await this.targetToken.actor.rollSkill(higherSkill, {flavor: "Opposing Grapple Check", targetValue: DC});
        if(!roll) ui.notifications.error("The roll was declined.");
        this.targetCheck.total = roll.total;
        this.targetCheck.isCritical = roll.isCritical;
        this.targetCheck.isFumble = roll.isFumble;
        return this;
    }

    get checkSuccessful() {
        /*  successful grapple if:
            - actor crit & target not crit
            - target fumble & actor not fumble
            - actor total > target total
        */
        const ac = this.actorCheck;
        const tc = this.targetCheck;
        if(typeof ac.total === "undefined" || typeof tc.total === "undefined") return undefined;
        return (ac.isCritical && !tc.isCritical) || (!ac.isFumble && tc.isFumble) || (ac.total > tc.total) ? true : false;
    }


    checkOwnership(type) {  //checks if the current user is the owner of the target token or the actor token
        if((type === "target" && !this.targetToken.isOwner) || (type === "actor" && !this.actorToken.isOwner)) {
            ui.notifications.error("Only the owner of the document can execute this command.");
            return null;
        } else if (type !== "target" && type !== "actor") {
            ui.notifications.error(`Invalid argument: ${type}`);
            return null;
        } else return this;
    }

    async requestOpposingRoll(img) {
        const passingData = {
            actorTokenId: this.actorTokenId,
            targetTokenId: this.targetTokenId,
            actorCheck: this.actorCheck
        };

        await Requestor.request({
            title: "Grapple",
            buttonData: [{
                label: `Contest DC ${this.actorCheck.total}`,
                scope: { passingData },
                command: async function() {
                    await TaliaCustom.Grapple.targetRequestorMacro(passingData) 
                }
            }],
            description: `Contest the grapple attempt by <b>${this.actorToken.actor.name}</b>.`,
            speaker: ChatMessage.implementation.getSpeaker({actor: this.actorToken.actor}),
            img
        });
        return this;
    }

    async requestApplyEffects(img) {
        const passingData = {
            actorTokenId: this.actorTokenId,
            targetTokenId: this.targetTokenId,
        };

        await Requestor.request({
            title: "Grapple",
            buttonData: [{
                label: `Apply Effects`,
                scope: { passingData },
                command: async function() {
                    await TaliaCustom.Grapple.applyEffects(passingData)
                }
            }],
            description: `If the target failed the contest against you, apply effects to grapple them.`,
            speaker: ChatMessage.implementation.getSpeaker({actor: this.actorToken.actor}),
            img
        })
        return this;
    }

    async grappleTarget() {
        await game.Rideable.MountbyID([this.targetTokenId], this.actorTokenId, {Grappled: true});
        return this;
    }

    async applyGrapplingEffect() {  //uses a dfreds custom effect
        const effectData = game.dfreds.effectInterface.findCustomEffectByName("Grappling").toObject();
        effectData.changes = [{ key: "flags.talia-custom.grapplingTokenId", value: this.targetTokenId, mode: 5, priority: 20 }];
        effectData.description = `You're currently grappling ${this.targetToken.actor.name}`;

        //provide the target token as a reference for the effect to delete the grappling effect on target when deleted
        const effect = await game.dfreds.effectInterface.addEffectWith({effectData, uuid: this.actorToken.actor.uuid, origin: this.targetTokenId});
        Hooks.call("talia-custom.appliedGrapplingEffect", effect);     
        return this;
    }

    static async applyEffects(passingData) {
        const grapple = new Grapple(passingData)
            .initialize()
            .checkOwnership("actor")
        await grapple.grappleTarget()            //also applies the grappled effect via dFred's
        await grapple.applyGrapplingEffect()     //applies the grappling effect to self
    }

    static async itemMacro(item, token) {
        await _foundryHelpers.displayItemInfoOnly(item);
        const grapple = new Grapple({actorTokenId: token.id})
            .getTarget()
            .initialize()
            .validateImmunity()
            .validateSizeDiff()
        await grapple.rollActorCheck()
        await grapple.requestOpposingRoll(item.img)          //requestor which lets the target roll to contest the check; also evaluates the success of the grapple attempt
        await grapple.requestApplyEffects(item.img)          //requestor which the actor can click to apply the grappled effect to the target and the grappling effect to themselves using dFredCE
    }

    static async targetRequestorMacro(passingData) {
        const grapple = new Grapple(passingData)
            .initialize()
            .checkOwnership("target")
        await grapple.rollTargetCheck()
        //.createSuccessMessage()     //a message stating if the grapple was a success or a fail
    }
}