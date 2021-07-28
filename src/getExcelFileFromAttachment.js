const getExcelFileFromAttachment = attachment => {
    let excelFile = {};
    const blobs = Utilities.unzip(attachment);

    Logger.log('Har %s stk vedleggsdata.', blobs.length);
    Logger.log('Unzipped attachment type: %s', blobs[0].getContentType());
    excelFile = blobs[0].getAs('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    Logger.log('Navn på vedlegg: %s type %s', excelFile.getName(), excelFile.getContentType());
    return excelFile;
}