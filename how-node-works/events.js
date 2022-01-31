const EventEmitter = require("events");
const http = require("http");

//

class Sales extends EventEmitter {
  constructor() {
    super();
  }
}
const myEmitter = new Sales();

// Same as setting callbacks on DOM
// Executes the callback when newSale event is emitted.
myEmitter.on("newSale", () => console.log("There was a new sale"));
// With arguments
myEmitter.on("newSale", (stock) =>
  console.log(" I said There was a new sale ! stock = " + stock)
);
// With arguments
myEmitter.emit("newSale", 9);

///////////////////////////////////////////////////////

// Listening to events on server
const server = http.createServer();
server.listen(8000, "127.0.0.1", () =>
  console.log("Server is listening ... ")
);
server.on("request", () => console.log("Request received"));
server.on("request", () => console.log("Request received 😀"));
server.on("close", () => console.log("Server shutting Down"));
