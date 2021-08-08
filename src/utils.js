const getProductId = handle => {
    const getByHandle = `https://juniorbarneklar.myshopify.com/admin/api/2020-07/products.json?handle=${handle}`;
    const resp3 = UrlFetchApp.fetch(getByHandle, {
        method: 'GET',
        headers: {
            'X-Shopify-Access-Token': `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`,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        muteHttpExceptions: true,
    });

    var product = JSON.parse(resp3.getContentText());

    if (!product.products || product.products.length === 0) {
        console.log('Product Id for handle: ', handle, ' NOT FOUND')
        return null;
    } else {
        console.log("Product Id for handle: ", handle, ' is ', product.products[0].id);
        return product.products[0].id;
    }
}

const getItemVariants = (product_id, handle, size, color, decrement, mailItem) => {
    let matchedVariant = {};
    const getVariants = `https://juniorbarneklar.myshopify.com/admin/api/2020-07/products/${product_id}/variants.json?fields=inventory_item_id,title,inventory_quantity, option1, option2`;

    const response = UrlFetchApp.fetch(getVariants, {
        method: 'GET',
        headers: {
            'X-Shopify-Access-Token': `${shopifyAccessToken}`,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        muteHttpExceptions: true,
    });

    const theHandles = JSON.parse(response.getContentText());
    if (!theHandles) {
        mailItem.result = 'Kunne ikke finne varianter for handle';
        mailItem.error = true;
        console.log('Kunne ikke finne varianter for handle');
        return matchedVariant;
    }
    if (theHandles.errors) {
        mailItem.result = 'Variant feil:' + theHandles + '  for handle ' + handle;
        mailItem.error = true;
        console.log('Variant error: ', theHandles, '  for handle ', handle);
        return matchedVariant;
    }

    console.log('Product Id ', product_id, ' has ', theHandles.variants.length, ' variants');
    console.log('Looking for sold item with size ', size, ' and color ', color, ' Decrement by: ', decrement);

    theHandles.variants.every((variant, index) => {
        const regex = /\s/gi
        const variantSize = variant.option1.toLowerCase().replace(regex, '');
        let variantColor = 'No color found';

        if (variant.option2) {
            variantColor = variant.option2.toLowerCase().replace(regex, '');
        } else {
            mailItem.result = 'Variant error: the variant', variant, '  has no color ';
            mailItem.error = true;
            console.log('Variant error: the variant', variant, '  has no color ');
            return true;
        }

        if (variantSize === size && variantColor === color) {
            // Found the variant in Shopify!
            mailItem.result = `MATCH variant no ${index}: Size ${variantSize} and color ${variantColor}`;
            mailItem.error = false;
            mailItem.foundInShopify = true;
            matchedVariant = {
                title: variant.title,
                id: variant.inventory_item_id,
                handle: handle,
                size: size,
                color: color,
                decrement: decrement,
            };
            console.log('MATCH variant no', index, ': Size', variantSize, ' and color ', variantColor);
            return false;
        } else {
            console.log('No match for variant no ', index, ': Size', variantSize, ' and color ', variantColor);
        }
        return true;
    });

    if (!matchedVariant.title) {
        console.log('Could not find any match for:', theHandles);
        let titles = '';
        if (theHandles && theHandles.variants) {
            titles = theHandles.variants.reduce((accumulator, currentValue) => `    ${accumulator}\n    ${currentValue.title}`, '')
        }
        matchedVariant = {
            id: '',
            handle: '',
            size: '',
            color: '',
            decrement: ''
        };

        mailItem.result = 'Fant denne i Shopify, men fant ingen varianter for: ' + titles;
        mailItem.error = true;
    }
    return matchedVariant;
}
