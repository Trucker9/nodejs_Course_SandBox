// // arguments contains all the values of the current function.(Proving we are in a wrapper function in each module)
// console.log(arguments);
// // Showing the wrapper again.
// console.log(require("module").wrapper);

// module.exports
const C = require("./test-module-1");
const calc1 = new C();
console.log(calc1.add(2, 5));

// exports
// const calc2 = require("./test-module-2");
const { add, multiply } = require("./test-module-2");
console.log(multiply(2, 5));

// caching : first require reads the module and executes it line by line. then stores the export's data to the cache. next requires uses what node stored in cache (the entire code wont be executed)

require("./test-module-3")();
require("./test-module-3")();
require("./test-module-3")();
