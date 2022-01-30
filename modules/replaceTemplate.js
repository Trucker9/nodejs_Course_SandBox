module.exports = function (template, productDetails) {
  // Template is a string I guess
  let output = template; // Not a good practice to change arguments directly

  output = output.replace(/{%PRODUCTNAME%}/g, productDetails.productName); // replacing all {%PRODUCTNAME%} with /../g
  output = output.replace(/{%IMAGE%}/g, productDetails.image);
  output = output.replace(/{%PRICE%}/g, productDetails.price);
  output = output.replace(/{%FROM%}/g, productDetails.from);
  output = output.replace(/{%NUTRIENTS%}/g, productDetails.nutrients);
  output = output.replace(/{%QUANTITY%}/g, productDetails.quantity);
  output = output.replace(/{%ID%}/g, productDetails.id);
  output = output.replace(/{%DESCRIPTION%}/g, productDetails.description);

  if (!productDetails.organic)
    output = output.replace(/{%NOT_ORGANIC%}/g, "not-organic");

  return output;
};
