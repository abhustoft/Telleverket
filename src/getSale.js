const getSale = (products, index) => {
    const vendor = products.vendors[index] ? products.vendors[index] : 'Ukjent leverandør';
    const soldSize = products.sizes[index] ? products.sizes[index].toLowerCase().replace(/\s/gi, '') : 'no size';
    const decrement = products.quantities[index] ? products.quantities[index] : '0';
    const size = products.sizes[index] ? products.sizes[index] : 'none';
    const name = products.names[index] ? products.names[index]: 'none';
    let soldColor = '';
    // if (products.names[index] === 'wheat') {
    //     // TODO: Remove preceding digits for Wheat 2020Q34
    //     soldColor = products.colors[index] ? products.colors[index].toLowerCase().replace(/\s/gi, '').replace(/^\d*/gi, ''): 'no color';
    // } else {
        soldColor =  products.colors[index] ? products.colors[index].toLowerCase().replace(/\s/gi, '') : 'no color';
    // }

    return {
        vendor: vendor,
        soldSize: soldSize,
        soldColor: soldColor,
        decrement: decrement,
        size: size,
        name: name
    };
}