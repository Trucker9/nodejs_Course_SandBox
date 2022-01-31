const fs = require("fs");
const server = require("http").createServer();

server.on("request", (req, res) => {
  // // Solution 1 ->  File must be read to memory and uses tons of resources
  // fs.readFile("test-file.txt", (err, data) => {
  //   if (err) console.log(err);
  //   res.end(data);
  // });

  // // Solution 2: Streams -> reads and sends the file chunk by chunk.
  // const readable = fs.createReadStream("test-file.txt"); // Any time that a new chunk of data is read, the createReadStream emits the "data" event and we listen for that to send the data to the client.
  // // In the callback function we use on "data" event, we have access to that chunk.
  // readable.on("data", (chunk) => {
  //   res.write(chunk);
  // });
  // // When sending the steam is finished, "end" event will be emitted. We have to write res.end(); to tell that the stream is finished. otherwise it would not work. (data has been sent with "res.write();" before. we just need to signal the end)
  // readable.on("end", () => {
  //   res.end();
  // });

  // readable.on("error", (err) => {
  //   console.log(err);
  //   res.statusCode = 500; // status code
  //   res.end("File not found!");
  // });

  // Solution 3 (PIPE) -> In solution 2, the data can't be sent to the client as fast as reading it.
  // When the response cant be sent nearly as fast as receiving it from the file, it is called back pressure and we need to avoid it.
  // pipe allows us to to pipe the output of a readable stream right into the input of the writeable stream.
  const readable = fs.createReadStream("test-file.txt");
  readable.pipe(res); 
  // <readableSource>.pipe(<writeableDest>)
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Listening...");
});
