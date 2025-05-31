export default {
    register() {
        performMerges();
        performDeletions();
    }
}

// Must begin with "CONFIG."
const changes = {

}

// Must begin with "CONFIG."
const deletions = [
    "CONFIG.DND5E.currencies.ep"
]

/**  */
function performMerges() {
    const newObj = {};
    for(const [path, v] of Object.entries(changes)) {
        if(!path.startsWith("CONFIG.")) {
            console.error(`configChanges | Invalid change entry "${path}".`);
            continue;
        }

        const cleanedKey = path.split(".").slice(1).join(".");
        newObj[cleanedKey] = v;
    }

    const expanded = foundry.utils.expandObject(newObj);
    foundry.utils.mergeObject(CONFIG, foundry.utils.expandObject(changes));
}

/**  */
function performDeletions() {
    for(const path of deletions) {
        if(!path.startsWith("CONFIG.")) {
            console.error(`configChanges | Invalid deletion entry "${path}".`);
            continue;
        }

        const pathParts = path.split(".").slice(1);

        const cleanedKey = pathParts.join(".");
        const prop = foundry.utils.getProperty(CONFIG, cleanedKey);
        if(!prop) continue;

        const parentParts = [...pathParts];
        const propKey = parentParts.pop();
        
        const parent = foundry.utils.getProperty(CONFIG, parentParts.join("."));
        delete parent[propKey];
    }
}

