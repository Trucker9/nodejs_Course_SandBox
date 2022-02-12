const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({
  path: './config.env',
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
app.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

// console.log(process.env);

// Installing code formatters :  npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-ally eslint-plugin-react --save-dev
