const getLocationId = () => {
    // Used Shopify pluginID's Exporter to find inventory id of a test garment, "ABHs testplagg, IKKE SLETT"
    // so that location id is found in the return
    const getInventory = "https://juniorbarneklar.myshopify.com/admin/api/2020-07/inventory_levels.json?inventory_item_ids=38323994755236";

    try {
        const resp = UrlFetchApp.fetch(getInventory, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': `${shopifyAccessToken}`,
            },
            muteHttpExceptions: true,
        });

        const content = JSON.parse(resp.getContentText());
        
        return content.inventory_levels ?
            content.inventory_levels[0].location_id :
            {error: 'Ingen locationId'};

    } catch (error) {
        console.log('Fikk exception:', error);
        return {error: error};
    }
}
