const express = require("express");
const app = express();
/////////////////////////////////////////////

// Response to get() http method app.get( <route> , <function(request, response)> );
app.get("/", function (request, response) {
  response.status(200).send("Hello from server");
});




// Start up the server
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

