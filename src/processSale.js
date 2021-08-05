function processSale(location_id, handle, size, color, decrement, mailItem) {
    const msBetweenCalls = 600;

    let startCall = Date.now();
    const product_id = getProductId(handle);
    let finishedCall = Date.now();

    let sleepTime = msBetweenCalls - (finishedCall - startCall)
    if (sleepTime > 0) {
        Utilities.sleep(sleepTime);
    }

    startCall = Date.now();
    const matchedVariant = getItemVariants(product_id, handle, size, color, decrement, mailItem);
    
    finishedCall = Date.now();
    sleepTime = msBetweenCalls - (finishedCall - startCall);

    if (sleepTime > 0) {
        Utilities.sleep(sleepTime);
    }

    if (mailItem.error) {
        return mailItem;
    }

    startCall = Date.now();
    let remaining = null;
    
    if (!dryRun()) {
      remaining = decrementInventory(location_id, matchedVariant.id, matchedVariant.decrement);
    }

    finishedCall = Date.now();
    sleepTime = msBetweenCalls - (finishedCall - startCall)

    if (sleepTime > 0) {
        Utilities.sleep(sleepTime);
    }

    if (remaining === null) {
        mailItem.result = 'decrementInventory feilet, se logger';
        mailItem.error = true;
        mailItem.foundInShopify = true;
    } else {
        console.log('Remaining inventory after decrement: ', remaining);
        mailItem.result = 'Fant størrelse: ' + matchedVariant.size +
            ',  og farge: ' + matchedVariant.color +
            '.  Gjenværende: ' + remaining;
        mailItem.foundInShopify = true;
        mailItem.error = false;
    }
    return mailItem;
}


