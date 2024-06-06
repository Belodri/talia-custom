export const _foundryHelpers = {
    getActorByUuid,
    SECONDS: {
        IN_ONE_MINUTE: 60,
        IN_TEN_MINUTES: 600,
        IN_ONE_HOUR: 3600,
        IN_SIX_HOURS: 21600,
        IN_EIGHT_HOURS: 28800,
        IN_ONE_DAY: 86400,
        IN_ONE_WEEK: 604800
    },
};

/**
 * Gets the actor object by the actor UUID
 * @param {string} uuid - the actor UUID
 * @returns {Actor5e} the actor that was found via the UUID
 */
function getActorByUuid(uuid) {
    const actorToken = fromUuidSync(uuid);
    const actor = actorToken?.actor ? actorToken?.actor : actorToken;
    return actor;
}