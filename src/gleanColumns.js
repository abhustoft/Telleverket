/**        FROM:       https://gist.github.com/azadisaryev/ab57e95096203edc2741#file-convertexcel2sheets
 * Convert Excel file to Sheets
 * @param {Blob} excelFile The Excel file blob data; Required
 * @param {String} filename File name on uploading drive; Required
 * @param {Array} arrParents Array of folder ids to put converted file in; Optional, will default to Drive root folder
 * @return {Spreadsheet} Converted Google Spreadsheet instance
 **/
function gleanColumns(fileDataResponse) {
    let decrementValues = []
    let handleValues = [];
    let nameValues = [];
    let priceValues = []
    let shopValues = []
    let vendorValues = []

    try {
        // const params = {
        //     // The ID of the spreadsheet to retrieve data from.
        //     spreadsheetId: fileDataResponse.id,  // TODO: Update placeholder value.
        //
        //     // The A1 notation of the values to retrieve.
        //     ranges: ["A1:I"],  // TODO: Update placeholder value.
        // };
        //
        // const blob = Sheets.Spreadsheets.Values.batchGet(  fileDataResponse.id,
        //     {ranges: ["A1:I"], majorDimension:"ROWS"});
        // debugger;
        decrementValues = Sheets.Spreadsheets.Values.get(fileDataResponse.id, "H1:H");
        handleValues = Sheets.Spreadsheets.Values.get(fileDataResponse.id, "G1:G");
        nameValues = Sheets.Spreadsheets.Values.get(fileDataResponse.id, "B1:B");
        priceValues = Sheets.Spreadsheets.Values.get(fileDataResponse.id, "I1:I");
        shopValues = Sheets.Spreadsheets.Values.get(fileDataResponse.id, "A1:A");
        vendorValues = Sheets.Spreadsheets.Values.get(fileDataResponse.id, "F1:F");
      console.log('handles, names, vendors, decs: ', handleValues.values[6], nameValues.values[6], vendorValues.values[6], decrementValues.values[6]);
    } catch (e) {
        console.log('gleanColumns: Could not read content of file: ', e);
        return [];
    }

    const rawHandles    = handleValues.values.map(handle => handle[0]);
    const firstHandle   = rawHandles.indexOf('Lev.varenr.') + 1;
    const handles       = rawHandles.slice(firstHandle);
    const sizes         = [...handles].map(empty => '');
    const colors        = [...handles].map(empty => '');

    const rawDecrements = decrementValues.values.map(decrement => decrement[0]);
    const rawNames      = nameValues.values.map(name => name[0]);
    const rawPrices     = priceValues.values.map(price => price[0]);
    const rawShops      = shopValues.values.map(shop => shop[0]);
    const rawVendors    = vendorValues.values.map(vendor => vendor[0]);

    const cleanedHandles = handles.map((handle, index) => {
        let justHandle;
        let newHandle;
        if (typeof handle !== 'undefined') {
            justHandle = handle.replace(/^.*&/, '');
            if (justHandle === handle) {
                return 'nohandle';
            }
            newHandle = handle.replace(/^.*@/, '');
            sizes[index] = justHandle.replace(/@.*$/, '');
            colors[index] = justHandle.replace(/^.*-(?!.*-)/, ''); // Last '-' from lookahead
        }
        return newHandle;
    });

    const decrements = rawDecrements.slice(firstHandle);
    const names = rawNames.slice(firstHandle);
    const prices = rawPrices.slice(firstHandle);
    const shops = rawShops.slice(firstHandle);
    const vendors = rawVendors.slice(firstHandle);

    return {
        colors: colors,
        handles: cleanedHandles,
        names: names,
        prices: prices,
        quantities: decrements,
        shops: shops,
        sizes: sizes,
        vendors: vendors,
    };
}
