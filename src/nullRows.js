const nullRows = item => {
    const scriptProperties = PropertiesService.getScriptProperties();
    const rows = scriptProperties.deleteProperty('ROW');
    checkRow();
}