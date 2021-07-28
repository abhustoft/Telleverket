const decrementInventory = (location_id, inventory_item_id, amount) => {
    const data = {
        "location_id": location_id,
        "inventory_item_id": inventory_item_id,
        "available_adjustment": amount
    };
    const reduceInventory = `https://juniorbarneklar.myshopify.com/admin/api/2020-07/inventory_levels/adjust.json?inventory_item_id=${inventory_item_id}&available_adjustment=${-amount}&location_id=${location_id}`;

    try {
        const response = UrlFetchApp.fetch(reduceInventory, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': `${shopifyAccessToken}`,
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            muteHttpExceptions: true,
        });
        const context = JSON.parse(response.getContentText());

        if (context.errors) {
            console.log('ERROR in decrementInventory: ', context.errors);
            return null;
        }

        const inventory_level = context ? context.inventory_level : undefined;
        if (typeof inventory_level === 'undefined' || typeof inventory_level.available === 'undefined') {
            console.log('decrementInventory: Kunne ikke finne gjenværende');
            return null;
        }
        return inventory_level.available;
    } catch (error) {
        console.log('decrementInventory failed with exception: ', error);
        return null;
    }
}