import { ItemHookManager } from "../../../utils/ItemHookManager.mjs";

export default {
    register() {
        ItemHookManager.register("Aspect of the Wyrm", async (item) => {
            const config = {
                consumeResource: item.system.uses.value === 0 ? true : null,
                consumeUsage: item.system.uses.value !== 0 ? true : null,
            };
            const options = {
                skipItemMacro: true,
            };
            
            if(config.consumeResource) {
                options["flags.dnd5e.use.consumedUsage"] = true;
            } else {
                options["flags.dnd5e.use.consumedResource"] = true;
            }
            
            await item.use(config, options);
            ui.notifications.info(`Consumed ${config.consumeResource ? `${item.system.consume.amount} Ki` : "1 Use"}`);
        });
    }
}
