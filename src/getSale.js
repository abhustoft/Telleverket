const getSale = (products, index) => {
    const vendor = products.vendors[index] ? products.vendors[index] : 'Ukjent leverandør';
    const soldSize = products.sizes[index] ? products.sizes[index].toLowerCase().replace(/\s/gi, '') : 'no size';
    const decrement = products.quantities[index] ? products.quantities[index] : '0';
    const size = products.sizes[index] ? products.sizes[index] : 'none';
    const season = products.seasons[index] ? products.seasons[index] : 'none';
    const name = products.names[index] ? products.names[index]: 'none';
    const ean = products.eans[index] ? products.eans[index]: 'none';
    const soldColor =  products.colors[index] ? products.colors[index].toLowerCase().replace(/\s/gi, '') : 'no color';

    return {
        vendor: vendor,
        soldSize: soldSize,
        season: season,
        soldColor: soldColor,
        decrement: decrement,
        size: size,
        ean: ean,
        name: name
    };
}