/**        FROM:       https://gist.github.com/azadisaryev/ab57e95096203edc2741#file-convertexcel2sheets
 * Convert Excel file to Sheets
 * @param {Blob} excelFile The Excel file blob data; Required
 * @param {String} filename File name on uploading drive; Required
 * @param {Array} arrParents Array of folder ids to put converted file in; Optional, will default to Drive root folder
 * @return {Spreadsheet} Converted Google Spreadsheet instance
 **/
function convertToSheet(excelFile, filename) {

    const parents = []; // check if optional arrParents argument was provided, default to empty array if not
    const accessToken = ScriptApp.getOAuthToken();

    if (typeof excelFile === 'undefined') {
        console.log('getSheetData: Attachment is empty');
        return {handles: [], quantities: []}
    }

    // Parameters for Drive API Simple Upload request (see https://developers.google.com/drive/web/manage-uploads#simple)
    const uploadParamsPut = {
        method: 'put',
        contentType: 'application/vnd.ms-excel', // works for both .xls and .xlsx files
        contentLength: excelFile.getBytes().length,
        headers: {'Authorization': 'Bearer ' + accessToken},
        payload: excelFile.getBytes(),
        muteHttpExceptions: true,
    };

    const uploadParamsPost = {
        method: 'post',
        contentType: 'application/vnd.ms-excel', // works for both .xls and .xlsx files
        contentLength: excelFile.getBytes().length,
        headers: {'Authorization': 'Bearer ' + accessToken},
        payload: excelFile.getBytes(),
        muteHttpExceptions: false,
    };

    // Upload file to Drive root folder and convert to Sheets
    // To overwrite a file, use PUT, find file id from Google drive, right-click on desired
    // file, get url:
    // https://docs.google.com/spreadsheets/d/107lXGwVlEn7W7p4JSiCOwu-yW9xy8ZtTteh3TPStOIc
    // use id in:
    const uploadResponse = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v2/files/107lXGwVlEn7W7p4JSiCOwu-yW9xy8ZtTteh3TPStOIc?uploadType=media&convert=true', uploadParamsPut);
    
    // To POST, create new file for each run:
    //const uploadResponse = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v2/files/?uploadType=media&convert=true', uploadParamsPost);
    
    // Parse upload&convert response data (need this to be able to get id of converted sheet)
    const fileDataResponse = JSON.parse(uploadResponse.getContentText());

    // Create payload (body) data for updating converted file's name and parent folder(s)
    const payloadData = {
        title: filename,
        parents: []
    };

    parents.forEach(parent => {
        try {
            const folder = DriveApp.getFolderById(parent); // check that this folder id exists in drive and user can write to it
            payloadData.parents.push({id: parent});
        } catch (e) {
        } // fail silently if no such folder id exists in Drive
    });

    // Parameters for Drive API File Update request (see https://developers.google.com/drive/v2/reference/files/update)
    const updateParams = {
        method: 'put',
        headers: {'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()},
        contentType: 'application/json',
        payload: JSON.stringify(payloadData),
        muteHttpExceptions: true
    };

    // Update metadata (filename and parent folder(s)) of converted sheet
    const resp = UrlFetchApp.fetch(
        'https://www.googleapis.com/drive/v2/files/' + fileDataResponse.id, updateParams
    );

    return fileDataResponse;
}
