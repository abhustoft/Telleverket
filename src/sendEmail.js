function sendResults(results, attachedFile) {
    const emailQuotaRemaining = MailApp.getRemainingDailyQuota();

    const today = new Date();
    const todayMS = today.getTime();
    const yesterdayMS = todayMS - 60 * 60 * 24 * 1000;
    let yesterday = new Date();
    yesterday.setTime(yesterdayMS);

    const salesDay = yesterday.getDay();
    const salesYear = yesterday.getFullYear().toString();
    const salesWeek = salesYear + getWeek(yesterday).toString();


    results.forEach((mailItem, index) => {
        const firebaseItem = {
            date: mailItem.date,
            day: salesDay,
            itemPrice: mailItem.price,
            items: mailItem.decrement,
            shop: mailItem.shop.includes('toro') ? 'Storo' : 'Sandvika',
            vendor: mailItem.vendor,
            week: salesWeek,
        }
        
        if (!dryRun() && !mailItem.error) {
          toFirebase(firebaseItem);
        }
    })
    
    const foundAndOK = results.filter(item => 
        item.foundInShopify && !item.error && item.processed);
    const notFound = results.filter(item => !item.foundInShopify);
    const unprocessed = results.filter(item => !item.processed && !item.error);

    const errors = results.filter(item => {
        // Found in Shopify, but some other error occurred
        if (item.error && item.foundInShopify) {
            return item.message;
        } else {
            return false;
        }
    });

    const ok = foundAndOK.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const missing = notFound.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const unprocessedTexts = unprocessed.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const notOk = errors.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const soldItems = results.reduce((acc, curr) => acc + Number.parseInt(curr.decrement, 10), 0);
    const sum = results.reduce((acc, curr) => acc + Number.parseInt(curr.price, 10) * Number.parseInt(curr.decrement, 10), 0);

    const sumSandvika = results.reduce((acc, curr, index, items) => {
            if (items[index].shop.includes('andvika')) {
                return acc + Number.parseInt(curr.itemPrice, 10) * Number.parseInt(curr.items, 10);
            } else {
                return acc;
            }
        }, 0
    );
    const sumStoro = results.reduce((acc, curr, index, items) => {
            if (items[index].shop.includes('toro')) {
                return acc + Number.parseInt(curr.itemPrice, 10) * Number.parseInt(curr.items, 10);
            } else {
                return acc;
            }
        }, 0
    );

    let body = '';
    body = body + `Fra fil ${attachedFile}\n`;
    body = body + `Solgte ${soldItems} varer i ${results.length} salg for tilsammen ${new Intl.NumberFormat('no', {
        style: 'currency',
        currency: 'NOK'
    }).format(sum)}\n`
    body = body + `\nFor Sandvika: ${new Intl.NumberFormat('no', {
        style: 'currency',
        currency: 'NOK'
    }).format(sumSandvika)}`;
    body = body + `\nFor Storo: ${new Intl.NumberFormat('no', {
        style: 'currency',
        currency: 'NOK'
    }).format(sumStoro)}`;
    body = body + ok;

    body = body + "\n\n******* Hadde nedtelling 0 (Feilslag i kassen) ***************\n";
    body = body + unprocessedTexts;
    body = body + "\n\n******* Kunne ikke finne disse i Shopify ***************\n";
    body = body + missing;
    body = body + "\n**********Andre feil ****************\n";
    body = body + notOk;

    MailApp.sendEmail({
        to: "abhustoft@gmail.com",
        subject: "Shopify nedtelling av varelager " + emailQuotaRemaining,
        body: body,
        noReply: true,
    });
}
