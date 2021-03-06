const getMyColumns = excelFile => {
    const sheet = convertToSheet(excelFile, "fraGmail");
    const columns = gleanColumns(sheet);

    if (columns.length === 0) {
        return null;
    }
    const shortestLength = Math.min(columns.handles.length, columns.quantities.length);

    if (shortestLength !== columns.handles.length) {
        console.log('shortestLength !== products.handles.length');
        return null;
    }
    return columns
}