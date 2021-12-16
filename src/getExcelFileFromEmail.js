const getExcelFileFromEmail = () => {
    const datanovaSaleLabel = GmailApp.getUserLabelByName("DatanovaSale");

    if (!datanovaSaleLabel) {
        Logger.log("DatanovaSale label not found");
        return;
    }
    
    const threads = datanovaSaleLabel.getThreads();
    const threadMessages = GmailApp.getMessagesForThreads(threads);
    Logger.log('Har %s stk threadMessages.', threadMessages.length);

    const threadMessage = threadMessages[0]; // Henter bare en fil?
    if (threadMessage) {
        Logger.log('Har %s stk threadMessage.', threadMessage.length);
    } else {
        console.log('threadMessage er tomt');
        return {excelFile: null, threads: null, datanovaSaleLabel: null};
    }
    const message = threadMessage[0];
    const attachments = message.getAttachments();
    Logger.log('Har %s stk vedlegg.', attachments.length);

    if (attachments.length === 0) {
        console.log('attachments er tomt');
        return {excelFile: null, threads: null, datanovaSaleLabel: null};
    }
    const attachment = attachments[0];

    const excelFile = getExcelFileFromAttachment(attachment);
    if (!excelFile) {
        console.log('Vedlegg er tomt');
        return {excelFile: null, threads: null, datanovaSaleLabel: null};
    }
    return {excelFile: excelFile, threads: threads, datanovaSaleLabel: datanovaSaleLabel};
}