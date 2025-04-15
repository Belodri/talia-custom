import { TaliaCustomAPI } from "./api.mjs";
import { MODULE } from "./constants.mjs";

/** @typedef {import("../types/Socketlib.d.ts").SocketlibSocket} SocketlibSocket */


/**
 * Interface to socketlib implemented as a static utility class.
 * All methods are static and the class is not intended to be instantiated.
 * @see https://github.com/farling42/foundryvtt-socketlib
 */
export default class Socket {
    constructor() {
        throw new Error("Socket is not intended to be instantiated. Use the exposed methods of Socket instead.");
    }

    /**
     * Toggles the debug logging for this class.
     * @param {boolean} [force=undefined]   If provided, forces the debug to the given state.
     * @returns {boolean} Is debugging turned on?
     */
    static toggleDebug(force=undefined) {
        Socket.#DEBUG = typeof force === "boolean"
            ? force
            : !Socket.#DEBUG;
        return Socket.#DEBUG;
    }

    /** 
     * Initialises the class.
     * @returns {void}
     */
    static init() {
        if(Socket.#initialized) throw new Error("Class has already been initialized.");
        //Hooks.once("socketlib.ready", Socket._onLibReady);

        Hooks.once("ready", () => {
            TaliaCustomAPI.add({toggleSocketDebug: Socket.toggleDebug}, "Other");
        });
    }

    /**
     * Registers a given function under a given name with the socketlib socket.
     * If called before socketlib is ready, the function will be 
     * registered as soon as socketlib is ready instead.
     * @param {string} name 
     * @param {Function} func 
     * @returns {void}
     */
    static register(name, func) {
        if(Socket.#socket) Socket.#register(name, func);
        else Socket.#addPending(name, func);
    }

    //#region Socketlib interfaces

    /** @type {SocketlibSocket['executeAsGM']} */
    static get executeAsGM() { return Socket.#socket.executeAsGM.bind(Socket.#socket); }

    /** @type {SocketlibSocket['executeAsUser']} */
    static get executeAsUser() { return Socket.#socket.executeAsUser.bind(Socket.#socket); }

    /** @type {SocketlibSocket['executeForAllGMs']} */
    static get executeForAllGMs() { return Socket.#socket.executeForAllGMs.bind(Socket.#socket); }

    /** @type {SocketlibSocket['executeForOtherGMs']} */
    static get executeForOtherGMs() { return Socket.#socket.executeForOtherGMs.bind(Socket.#socket); }

    /** @type {SocketlibSocket['executeForEveryone']} */
    static get executeForEveryone() { return Socket.#socket.executeForEveryone.bind(Socket.#socket); }

    /** @type {SocketlibSocket['executeForUsers']} */
    static get executeForUsers() { return Socket.#socket.executeForUsers.bind(Socket.#socket); }

    //#endregion

    /** @type {boolean} Is this class initialized? */
    static #initialized = false;

    /** @type {boolean} Should registrations be logged to debug console? */
    static #DEBUG = false;

    /** @type {SocketlibSocket} The socketlib socket for this module. */
    static #socket;

    /** @type {Map<string, Function>} Map of entries to be registered with the socket once its ready. */
    static #pending = new Map();

    /** 
     * Hook `socketlib.ready`
     * 
     * Registers the module socket with socketlib.
     * @returns {void}
     * @private
     */
    static _onLibReady() {
        if(Socket.#socket) throw new Error(`Socket for module "${MODULE.ID} has already been registered."`);

        Socket.#socket = socketlib.registerModule(MODULE.ID);
        Socket.#registerPending();
    }

    /**
     * Registers any pending registrations.
     * @returns {void}
     */
    static #registerPending() {
        for(const [name, func] of Socket.#pending.entries()) {
            Socket.#register(name, func);
            Socket.#pending.delete(name);
        }
    }

    /**
     * Registers a given name and function with the socketlib socket.
     * @param {string} name 
     * @param {Function} func 
     * @returns {void}
     */
    static #register(name, func) {
        Socket.#socket.register(name, func);
        if(Socket.#DEBUG) console.debug(`${MODULE.ID} - Registering socket function.`, {name, func});
    }

    /**
     * Sets a given name and function to be registered when the socketlib socket is ready.
     * @param {string} name 
     * @param {Function} func 
     * @returns {void}
     */
    static #addPending(name, func) {
        if(Socket.#pending.has(name)) throw new Error(`Duplicate name "${name}".`);
        Socket.#pending.set(name, func);
    }
}
