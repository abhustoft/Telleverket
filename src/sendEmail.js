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
    
    const foundAndOK = results.filter((item) => {
      return (
        item.foundInShopify &&
        item.processed &&
        !item.error &&
        !item.noHandle &&
        item.decrement !== "0"
      );
    });
    const notFound    = results.filter(item => !item.foundInShopify);
    // Throw away silly Datanova 'sales' of vendor definition
    const noHandles   = results.filter(item => item.noHandle && Number.parseInt(item.ean, 10) > 100);
    const unprocessed = results.filter(item => !item.processed);
    const zeros       = results.filter(item => item.decrement === '0');
    const errors      = results.filter(item => item.error);

    console.log(`Processed ${results.length} items:`)
    console.log(`OKs: ${foundAndOK.length}`);
    console.log(`No handles: ${noHandles.length}`);
    console.log(`Unprocessed: ${unprocessed.length}`);
    console.log(`Zero sales: ${zeros.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`In all: ${results.length+foundAndOK.length+noHandles.length+unprocessed.length+zeros.length+errors.length}`);

    const okTexts = foundAndOK.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const notFoundTexts = notFound.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const noHandlesTexts = noHandles.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const unprocessedTexts = unprocessed.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const zerosTexts = zeros.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    const errorsTexts = errors.reduce((acc, curr) => `${acc}\n${curr.message} \n${curr.result}`, '');
    
    const soldItems = results.reduce((acc, curr) => acc + Number.parseInt(curr.decrement, 10), 0);
    const sum = results.reduce((acc, curr) => acc + Number.parseInt(curr.price, 10) * Number.parseInt(curr.decrement, 10), 0);

    let body = '';
    body = body + `Fra fil ${attachedFile}\n`;
    body = body + `Solgte ${soldItems} varer i ${results.length} salg for tilsammen ${new Intl.NumberFormat('no', {
        style: 'currency',
        currency: 'NOK'
    }).format(sum)}\n`
   
    body = body + okTexts;

    body = body + "\n\n******* Hadde nedtelling 0 (Feilslag i kassen) ***************\n";
    body = body + zerosTexts;
    body = body + "\n\n******* Ikke Handle i Datanova-rapport fil ***************";
    body = body + noHandlesTexts; 
    body = body + "\n\n******* Har Handle, men fant ikke i Shopify ***************";
    body = body + notFoundTexts;
    body = body + "\n\n********** Ingen feil, men ikke prossert ****************\n";
    body = body + unprocessedTexts;
    body = body + "\n\n********** Fant i Shopify, men annen feil ****************\n";
    body = body + errorsTexts;

    MailApp.sendEmail({
        to: "abhustoft@gmail.com",
        subject: "Shopify nedtelling av varelager " + emailQuotaRemaining,
        body: body,
        noReply: true,
    });
}
