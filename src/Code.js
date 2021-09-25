function processEmails() {
    if (dryRun()) {
        console.log('This is a dry run!');
    }
    
    const {excelFile, threads, datanovaSaleLabel} = getExcelFileFromEmail();
    if (!excelFile) {
        return;
    }

    let isFinished = false;
    let runFromRow = 0;
    let lastRow = 0;
    const scriptProperties = PropertiesService.getScriptProperties();
    const processedRow = scriptProperties.getProperty('ROW');

    if (processedRow === null) {
        console.log('No previous run, this is first run. Start at row 0');
    } else {
        console.log('The previous run ran last row: ', processedRow);
        runFromRow = Number.parseInt(processedRow, 10) + 1;
    }

    const start = Date.now();
    scriptProperties.setProperty('StartedRunning', start);
    const emailQuotaRemaining = MailApp.getRemainingDailyQuota();
    if (emailQuotaRemaining < 9) {
        console.log(`Email quota remaining is ${emailQuotaRemaining}, so skip this run.`);
        const mailItem1 = new MailItem();
        mailItem1.date = 'I dag';
        mailItem1.decrement = 0;
        mailItem1.error = true;
        mailItem1.processed = true;
        mailItem1.foundInShopify  = true;
        mailItem1.message = `Email er nede på ${emailQuotaRemaining}, så vil ikke kjøre nå.`;
        mailItem1.price = '';
        mailItem1.result = '';
        mailItem1.shop = '';
        mailItem1.vendor = '';

        sendResults([mailItem1], excelFile.getName());
        return;
    }
    const results = [];
    const location_id = getLocationId();
    Utilities.sleep(600);

    if (location_id.error) {
        const mailItem2 = new MailItem();
        mailItem2.date = 'I dag';
        mailItem2.decrement = 0;
        mailItem2.error = true;
        mailItem2.processed = true;
        mailItem2.foundInShopify  = true;
        mailItem2.message = `getLocationId feilet: ${location_id.error}`;
        mailItem2.price = '';
        mailItem2.result = '';
        mailItem2.shop = '';
        mailItem2.vendor = '';
        sendResults([mailItem2], excelFile.getName());
        return;
    }
    const gotLocationId = Date.now();
   
    const columns = getMyColumns(excelFile);
    if (!columns) {
        return;
    }

    if (columns.handles.length === 0) {
        // Nothing bought, could be a sunday
        console.log('No purchases found in excel file. Sunday?');
       
        datanovaSaleLabel.removeFromThreads(threads);
        GmailApp.createLabel("Processed").addToThreads(threads);
        if (threads[0]) {
            threads[0].markRead();
        }
        scriptProperties.deleteProperty('ROW');
        checkRow();
        const mailItem3 = new MailItem();
        mailItem3.date = 'I dag';
        mailItem3.decrement = 0;
        mailItem3.error = true;
        mailItem3.processed = true;
        mailItem3.foundInShopify  = true;
        mailItem3.message = `Fant ingen salg. Søndag?`;
        mailItem3.price = '';
        mailItem3.result = '';
        mailItem3.shop = '';
        mailItem3.vendor = '';
        sendResults([mailItem3], excelFile.getName());
        return
    }

    const gotExcelFile = Date.now();
    console.log('Got columns index 0 - ', columns.shops.length - 1);

    if (runFromRow < columns.shops.length) {

        for (let index = runFromRow; index < columns.shops.length; index++) {
            lastRow = index;
            isFinished = false;
            const handle = columns.handles[index];
            const sale = getSale(columns, index);
            console.log(
                'Running row index:',
                index,
                ' Vendor: ',
                sale.vendor,
                ' Item: ',
                columns.names[index],
                ', price: ' +
                columns.prices[index] ? columns.prices[index] : 'unknown',
                ' * ',
                sale.decrement,
                ' with handle: ',
                handle
            );

            const mailItem4 = new MailItem();
            
            mailItem4.date = Math.floor(Date.now() / 1000) - 60 * 60 * 24; //Yesterday's sale, sec since 1970
            mailItem4.decrement = Number.parseFloat(sale.decrement,10).toFixed();
            mailItem4.error = false;
            mailItem4.processed = true;
            mailItem4.ean = sale.ean;
            mailItem4.foundInShopify  = true;
            
            mailItem4.message = '\n' + 
                sale.vendor + ':  ' + 
                sale.name + 
                '  ---->     Solgt: ' + Math.trunc(sale.decrement) + 
                '\nID: "' + handle + 
                ',    Farge: ' + sale.soldColor + 
                ',    Størrelse: ' + sale.size +
                ',\nEAN: ' + sale.ean + ', Sesong: ', + sale.season;
            
            mailItem4.price = Number.parseFloat(columns.prices[index] ? columns.prices[index]: '0.0',10).toFixed();
            mailItem4.result = '';
            mailItem4.shop = columns.shops[index];
            mailItem4.vendor = sale.vendor;

            if (typeof handle !== 'undefined' && handle !== 'nohandle' && mailItem4.decrement !== '0') {
                const returnedMailItem = processSale(
                    location_id,
                    handle,
                    sale.soldSize,
                    sale.soldColor,
                    sale.decrement,
                    mailItem4);

                returnedMailItem.processed = true;
                results.push(returnedMailItem);
            } else {
                if (sale.decrement !== 0) {
                    console.log('No handle, could not process sale.');
                    mailItem4.result = 'Har ikke handle i Datanova-filen, kan ikke spørre Shopify om produkt id';
                    mailItem4.foundInShopify = true; // So it does not group in the not-found list
                    mailItem4.error = false;
                    mailItem4.noHandle = true;
                } else {
                    mailItem4.result = 'Antall salg er 0, sikkert et feilslag i kassen';
                    mailItem4.error = false;
                }
                results.push(mailItem4);
            }
            //Should I stop now?
            if (index > runFromRow + 98) {
                console.log('Breaking at row index:  ', index);
                scriptProperties.setProperty('ROW', index.toString());
                checkRow();
                break;
            } else {
                isFinished = true;  // Only potentially finished -> finished when loop ends
            }
        }

        const decrementingLoop = Date.now();

        if (isFinished) {
            console.log('Finished processing email! Last row index:  ', lastRow, ' Processed ', results.length, ' lines');
            scriptProperties.deleteProperty('ROW');
            checkRow();
            datanovaSaleLabel.removeFromThreads(threads);
            const gmailLabel = GmailApp.createLabel("Processed").addToThreads(threads);
            console.log('Added label: ', gmailLabel.getName());
            if (threads[0]) {
                threads[0].markRead();
            }
        } else {
            scriptProperties.setProperty('ROW', lastRow.toString());
            console.log('Broke row loop, isFinished: ', isFinished, ' Last row: ', lastRow, ' Processed ', results.length, ' lines');
            const tenMinTrigger = ScriptApp.newTrigger("processEmails")
                .timeBased()
                .after(10 * 60 * 1000)
                .create();
            console.log('Set up trigger: ', tenMinTrigger.getUniqueId())
            checkRow();
        }
        const updatingLabels = Date.now();
        sendResults(results, excelFile.getName());
        const sending = Date.now();
        const msGotLocationId = gotLocationId - start;
        const msGotExcelFile = gotExcelFile - gotLocationId;
        const msDecrementingLoop = decrementingLoop - gotExcelFile;
        const msUpdatingLabels = updatingLabels - decrementingLoop;
        const msSending = sending - updatingLabels;
        const msTotal = Date.now() - start;

        console.log(`Getting locationId took ${Math.floor(msGotLocationId / 1000)} seconds`);
        console.log(`Getting Excel file took another ${Math.floor(msGotExcelFile / 1000)} seconds`);
        console.log(`Decrementing loop took another ${Math.floor(msDecrementingLoop / 1000)} seconds`);
        console.log(`Time per item: ${Number.parseFloat(msDecrementingLoop / 1000 / columns.shops.length).toFixed(2)}`)
        console.log(`Updating labels took another ${Math.floor(msUpdatingLabels / 1000)} seconds`);
        console.log(`Sending email took another = ${Math.floor(msSending / 1000)} seconds`);
        console.log(`Total time = ${Math.floor(msTotal / 1000)} seconds`);
    } else {
        console.log('Bug using row number, stored row is higher than available rows! Delete stored row number and clean up.');
        datanovaSaleLabel.removeFromThreads(threads);
        GmailApp.createLabel("Processed").addToThreads(threads);
        if (threads[0]) {
            threads[0].markRead();
        }
        scriptProperties.deleteProperty('ROW');
        checkRow();
    }
}
