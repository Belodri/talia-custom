import { Helpers } from "../utils/helpers.mjs";


export default {
    register() {
        /**
         * Whenever a character has this item equipped and opens the inventory tab on their character sheet,
         * there's a CHANCE % chance a random joke will be printed to chat.
         */
        Hooks.on("tidy5e-sheet.selectTab", (app, element, newTabId) => {
            if(newTabId !== "inventory") return;

            const item = app.object?.items?.getName("Bag of Scolding") ?? null;
            if(item?.system?.equipped !== true) return;

            const isTrigger = Math.random() <= CHANCE;
            if(!isTrigger) return;

            const randomJokeIndex = Helpers.getRandomInt(0, (JOKES.length - 1));

            ChatMessage.implementation.create({
                speaker: ChatMessage.getSpeaker({
                    actor: app.object,
                    alias: "Bag of Scolding",
                }),
                content: `<p>${JOKES[randomJokeIndex]}</p>`,
                emote: true,
            });
        });
    }
}
const CHANCE = 0.1;
const JOKES = [
    "I'd tell you to go fuck yourself but that's a horror I wouldn't wish on anybody.",
    "Your face is fit for radio and your voice is fit for silent movies.",
    "You are a background character in your own life.",
    "You look like a walking side-effect of a bad potion interaction.",
    "If you had a brain, I'd tell you to think about the consequences of your actions.",
    "Look at your friends. See what they're doing? That's exactly how you ended up in this predicament.",
    "You know, even you could be the most clever one in the party. You just need to consider a solo career.",
    "Ah, a classic. I thought you were smarter than you actually are.",
    "Oh, welcome! Let me guess - more bad decisions on top of bad decisions?",
    "Oh thank you, but I didn't really NEED more material to ridicule you with.",
    "I envy those who have not had the displeasure of making your acquaintance.",
    "You look like the kind of person who would fudge dice rolls.",
    "You're absolutely magical! Not like wish or fireball though, more like true strike.",
    "You truly are wonderful. I mean, I always wonder how the fuck you manage to look in the mirror without crying every morning.",
    "It wasn't until I met you that I was grateful for my extremely poor eyesight.",
    "Ahhgh, help, a troll is violating me! Oh, it's you. That's even worse.",
    "You are, by far, the worst adventurer I've never heard of.",
    "Look, pal, I only have a maximum carrying capacity of 500lb. You need to start pulling your weight in this party.",
    "I can hold a lot, but I'm fairly certain your go won't fit. Your competence, however...",
    "Your mother was a hamster and your father smelt of elderberries.",
    "You are unique in that with most people, at least their mothers think they are special.",
    "Whenever I see you, I'm glad I'm not a bag of devouring.",
    "You're about as sharp as a circle.",
    "If you were a spell, nobody would bother to learn you.",
    "Whoa! Looking at you makes me wonder what deity your parents pissed off.",
    "You're the kind of person to make breakfast in the order of milk, then cereal, then bowl.",
    "Each of your sentences is more clever than the next.",
    "When your parents said you could be anything you wanted, a disappointment was not supposed to be an option.",
    "Even a gorgon would keep her eyes shut with you around.",
    "I have neither the time nor the crayons to explain how much of a bad idea this is.",
    "You are the adventurer-equivalent of a participation award.",
    "You know your friends only tolerate you, right?",
    "I hope that you lose weight so that there will be less of you.",
    "I'd say your aim is cancer, but cancer actually kills people.",
    "Y'all should have a competition about who makes the worst decisions.",
    "You got two brain cells, and they're both fighting for 3rd place.",
    "I'd ask what's wrong with you, but I think it would be faster to ask what isn’t.",
    "How is it that you have two functional legs yet have gotten absolutely nowhere in your life?",
    "If I looked like you, I'd overdose on invisibility potions.",
    "I'd say get better, but it's you, I shouldn't expect the impossible.",
    "I am sewn to carry your burdens.",
    "You think I'm grumpy? Sure, let's just stick a ten foot pole inside of you and see how you feel!",
    "You're none of your best friends' best friend.",
    "If you're looking for your dignity, I don't have it.",
    "You're impossible to underestimate.",
    "Your mother should have eaten you while your bones were soft.",
    "I've met ghouls more lively than you.",
    "You have the charisma of an irate owlbear.",
    "Your battle strategy resembles a headless chicken.",
    "I'd say think about your next move but I'd hate to see you hurt yourself.",
    "Come on! Count to five! You can do it!",
    "Psst. I'll give you a legendary artifact if you TPK the wizard.",
    "The other party members are planning to betray you. I've heard them talking about it during night Watch.",
    "Say, what's your favourite meal? Crayons or boogers?",
    "Listen there’s two ways to do this, your way, and the right way…",
    "I think you're the only creature for whom Feeblemind would be a buff.",
    "Don’t worry, if mind flayers ever descend you'll be safe.",
    "The only thing you could look good in is a coffin!",
    "Your eyes are open, mouth moving, but Mr Brain has long since departed eh?",
    "Are you trying to defeat your foes with your body odor?",
    "You smell worse than a Necromancer’s workshop!",
    "With how dense you are, one could mistake you for a Graviturgy Wizard's spell.",
    "They say laughter is the best medicine, so your face must cast Cure Wounds.",
    "You look like you put a ruler under your pillow, to see how long you sleep.",
    "I heard you put a bounty out on yourself so for once you could feel wanted.",
    "One of my previous owners was an oily bog hag whow as constantly cracked out on fey shrooms. I miss her dearly whenever I see you.",
    "Oh I bet you're fun at parties. You do know what a party is right?",
    "No you can't have a health potion! What? I'm just trying to do your friends a favour.",
    "You sound like you're 4'3\" in heels.",
    "You should be the poster child for why we need to keep abortions legal.",
    "Let me guess. You're a self-taught Wizard?",
    "You're the loveliest hag in the coven.",
    "You've got all the good sense of a mind flayer's last meal.",
    "I suspected you'd fallen out of the idiot tree, but I didn't know you were dragged through Stupid Forest afterward.",
    "There's nothing about your looks that a full-face helmet wouldn't improve."
];

