const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({
  path: './config.env',
});
// ###################### For Sync code (Read line 40)
// NOTE: must be at top of our code!
process.on('uncaughtException', (err) => {
  console.log('uncaught Exception! Shutting down ...');
  console.log(err);
  process.exit(1);
});
// We have to require the app after reading .env file
const app = require('./app');

// Data Base:
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  // .then((connection) => console.log(connection.connections));
  .then(() => {
    console.log('DB connected');
  });

//

const port = 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

// ############################### Unhandled rejected promises (works for Async code!)
// Each time that there is an unhandled rejection somewhere in our app, the process object will emit an object called unhandled rejection.
// Errors from express pipeline: end up in error controller
// Others: end up here.
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down ...');
  console.log(err);
  // First we close the server (giving server time to handle pending requests)
  // Then we shut down with the callback function.
  // some tools will be used to restart the node app.
  server.close(() => process.exit(1));
});
