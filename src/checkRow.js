const checkRow = item => {
    const scriptProperties = PropertiesService.getScriptProperties();
    const rows = scriptProperties.getProperty('ROW');
  console.log('Current stored row:  ', rows);
}