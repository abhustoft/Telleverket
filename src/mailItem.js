function MailItem(
    date = 0,
    decrement = 0,
    error = false,
    noHandle = false,
    processed = false,
    ean = 0,
    season = '',
    foundInShopify = false,
    message = '',
    price = 0,
    result = '',
    shop = '',
    vendor = '',
) {
  this.date = date;
  this.decrement = decrement;
  this.error = error;
  this.noHandle = noHandle;
  this.processed = processed;
  this.ean = ean;
  this.season = this.season;
  this.foundInShopify = foundInShopify;
  this.message = message;
  this.price = price;
  this.result = result;
  this.shop = shop;
  this.vendor = vendor;
}