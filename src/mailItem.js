function MailItem(
    date = 0,
    decrement = 0,
    error = false,
    processed = false,
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
  this.processed = processed;
  this.foundInShopify = foundInShopify;
  this.message = message;
  this.price = price;
  this.result = result;
  this.shop = shop;
  this.vendor = vendor;
}