export class Helpers {

    static uuidFromActor(actor) {
        if(!actor instanceof CONFIG.Actor.documentClass) throw new Error("Parameter 'actor' is not an Actor.");
        return actor.uuid;
    }

    static getActorOrTokenDocUuid(doc) {
        if(doc instanceof CONFIG.Actor.documentClass || doc instanceof CONFIG.Token.documentClass) return doc.uuid;
        return null;
    }

    /**
     * Returns the actor pointed to by the uuid, or tokenDocument.actor if the uuid points to a tokenDocument.
     * @param {string} uuid The uuid of the actor
     * @returns {Actor} Actor | null
     */
    static actorFromUuid(uuid) {
        let doc = fromUuidSync(uuid);
        if(doc instanceof CONFIG.Token.documentClass) doc = doc.actor;
        if(doc instanceof CONFIG.Actor.documentClass) return doc;
        return null;
    }

    /**
     * Returns an array of uuids from an array of Actors.
     * @param {Actor[]} actors Array of Actors
     * @returns {string[]}
     */
    static uuidsFromActors(actors) {
        return actors.map( (actor, index) => {
            if(!actor instanceof CONFIG.Actor.documentClass) throw new Error(`Parameter ${actor} at actors[${index}] is not an Actor.`);
            return actor.uuid;
        });
    }

    /**
     * Returns an array of Actors from an array of uuids.
     * @param {string[]} uuids Array of uuids
     * @returns {Actor[]}
     */
    static actorsFromUuids(uuids) {
        return uuids.map( uuid => {
            let doc = fromUuidSync(uuid);
            if(!doc instanceof CONFIG.Actor.documentClass) throw new Error(`No Actor with uuid "${uuid}" could be found.`);
            return doc;
        });
    }
}