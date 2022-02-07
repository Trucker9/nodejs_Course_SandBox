const dotenv = require('dotenv');
dotenv.config({
  path: './config.env',
});
// We have to require the app after reading .env file
const app = require('./app');

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

// console.log(process.env);


// Installing code formatters :  npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-ally eslint-plugin-react --save-dev