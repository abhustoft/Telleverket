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
        const mailItem = new MailItem(
            'I dag',
            0,
            true,
            true,
            0,
            '',
            `Email er nede på ${emailQuotaRemaining}, så vil ikke kjøre nå.`,
            '',
            '',
            ''
        );
        sendResults([mailItem], excelFile.getName());
        return;
    }
    const results = [];
    const location_id = getLocationId();
    Utilities.sleep(600);

    if (location_id.error) {
        const mailItem = new MailItem(
            'I dag',
            0,
            true,
            true,
            0,
            `getLocationId feilet: ${location_id.error}`,
            0,
            '',
            '',
            ''
        );
        sendResults([mailItem], excelFile.getName());
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
        const mailItem = new MailItem(
            'I dag',
            0,
            true,
            true,
            0,
            `Fant ingen salg. Søndag?`,
            0,
            '',
            '',
            ''
        );
        sendResults([mailItem], excelFile.getName());
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

            const mailItem = new MailItem(
                date = Math.floor(Date.now() / 1000) - 60 * 60 * 24, //Yesterday's sale, sec since 1970
                decrement = Number.parseFloat(sale.decrement,10).toFixed(),
                error = false,
                unprocessed = false,
                found = true,
                message = '\n\n' + 
                    sale.vendor + ':  ' + 
                    sale.name + 
                    '  ----     Solgt: ' + Math.trunc(sale.decrement) + 
                    '\nId: "' + handle + 
                    ', farge: ' + sale.soldColor + 
                    ', størrelse: ' + sale.size +
                    ' EAN: ' + sale.ean,
                price = Number.parseFloat(columns.prices[index] ? columns.prices[index]: '0.0',10).toFixed(),
                result = '',
                shop = columns.shops[index],
                vendor = sale.vendor,
            );

            if (typeof handle !== 'undefined' && handle !== 'nohandle' && sale.decrement !== 0) {
                const returnedMailItem = processSale(
                    location_id,
                    handle,
                    sale.soldSize,
                    sale.soldColor,
                    sale.decrement,
                    mailItem);

                results.push(returnedMailItem);
            } else {
                if (sale.decrement !== 0) {
                    console.log('No handle, could not process sale.');
                    mailItem.result = 'Does not have a handle';
                    mailItem.foundInShopify = false;
                    mailItem.error = true;
                } else {
                    mailItem.result = 'Decrement is 0';
                    mailItem.foundInShopify = true;
                    mailItem.error = false;
                }
                mailItem.unprocessed = true;
                results.push(mailItem);
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
