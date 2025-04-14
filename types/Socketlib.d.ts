declare class SocketlibSocket {
    /**
     * Registers a function that can subsequently be called using socketlib. 
     * It's important that the registration of a function is done on all connected clients before the function is being called via socketlib. 
     * Otherwise the call won't succeed. For this reason it's recommended to register all relevant functions during the socketlib.ready hook, 
     * immediatly after socketlib.registerModule has been called.
     * @param name is a name that is used to identify the function within socketlib. This name can be used to call the function later. 
     *              This name must be unique among all names your module registers within socketlib.
     * @param func is the function that's being registered within socketlib.
     * @returns This function has no return value.
     */
    register(name: string, func: Function): void;

    /**
     * Executes a function on the client of exactly one GM. If multiple GMs are connected, one of the GMs will be selected to execute the function.
     * This function will fail if there is no GM connected. The function must have been registered using socket.register before it can be invoked via this function.
     * @param handler can either be the function that should be executed or the name given to that function during registration.
     * @param args The parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.
     * @returns The promise that this function returns will resolve once the GM has finished the execution of the invoked function and will yield the return value of that function.
     * If the execution on the GM client fails for some reason, this function will fail with an appropriate Error as well.
     */
    executeAsGM(handler: string | Function, ...args: any[]): Promise<any>;

    /**
     * Executes a function on the client of the specified user. This function will fail if the specified user is not connected. 
     * The function must have been registered using socket.register before it can be invoked via this function.
     * @param handler can either be the function that should be executed or the name given to that function during registration.
     * @param userId the id of the user that should execute this function.
     * @param args The parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.
     * @returns The promise that this function returns will resolve once the user has finished the execution of the invoked function and will yield the return value of that function. 
     * If the execution on other user's client fails for some reason, this function will fail with an appropriate Error as well.
     */
    executeAsUser(handler: string | Function, userId: string, ...args: any[]): Promise<any>;

    /**
     * Executes a function on the clients of all connected GMs. If the current user is a GM the function will be executed locally as well. 
     * The function must have been registered using socket.register before it can be invoked via this function.
     * @param handler can either be the function that should be executed or the name given to that function during registration.
     * @param args The parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.
     * @returns The promise returned by this function will resolve as soon as the request for execution has been sent to the connected GM clients and will not wait until those clients 
     * have finished processing that function. The promise will not yield any return value.
     */
    executeForAllGMs(handler: string | Function, ...args: any[]): Promise<void>;

    /**
     * Executes a function on the clients of all connected GMs, except for the current user. If the current user is not a GM this function has the same behavior as socket.executeForAllGMs. 
     * The function must have been registered using socket.register before it can be invoked via this function.
     * @param handler can either be the function that should be executed or the name given to that function during registration.
     * @param args The parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.
     * @returns The promise returned by this function will resolve as soon as the request for execution has been sent to the connected GM clients and will not wait until those clients 
     * have finished processing that function. The promise will not yield any return value.
     */
    executeForOtherGMs(handler: string | Function, ...args: any[]): Promise<void>;

    /**
     * Executes a function on all connected clients, including on the local client. 
     * The function must have been registered using socket.register before it can be invoked via this function.
     * @param handler can either be the function that should be executed or the name given to that function during registration.
     * @param args The parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.
     * @returns The promise returned by this function will resolve as soon as the request for execution has been sent to the connected clients and will not wait until those clients 
     * have finished processing that function. The promise will not yield any return value.
     */
    executeForEveryone(handler: string | Function, ...args: any[]): Promise<void>;

    /**
     * Executes a function on all connected clients, but not locally. 
     * The function must have been registered using socket.register before it can be invoked via this function.
     * @param handler can either be the function that should be executed or the name given to that function during registration.
     * @param args The parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.
     * @returns The promise returned by this function will resolve as soon as the request for execution has been sent to the connected clients and will not wait until those clients 
     * have finished processing that function. The promise will not yield any return value.
     */
    executeForOthers(handler: string | Function, ...args: any[]): Promise<void>;

    /**
     * Executes a function on the clients of a specified list of players. 
     * The function must have been registered using socket.register before it can be invoked via this function.
     * @param handler can either be the function that should be executed or the name given to that function during registration.
     * @param recipients an array of user ids that should execute the function.
     * @param args The parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.
     * @returns The promise returned by this function will resolve as soon as the request for execution has been sent to the specified clients and will not wait until those clients 
     * have finished processing that function. The promise will not yield any return value.
     */
    executeForUsers(handler: string | Function, recipients: string[], ...args: any[]): Promise<void>;
}

export { SocketlibSocket };