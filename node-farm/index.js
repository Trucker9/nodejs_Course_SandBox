// #########################################################################################
// ############## Adding modules
//##########################################################################################
// Priority : 1. Built in    2. npm    3. local
const fs = require('fs');
const http = require('http');
const url = require('url');
const slugify = require('slugify');
const replaceTemplate = require('./modules/replaceTemplate');
// #########################################################################################
// ############## Blocking - synchronous way
//##########################################################################################


// const textIn = fs.readFileSync("./txt/input.txt", "utf-8");
// console.log(textIn);
// const newText = `This is what we know about the imposter :${textIn} \n Created on ${Date.now()}`;
// fs.writeFileSync("./txt/input.txt", newText);

// #########################################################################################
// ############## non blocking - asynchronous way
//##########################################################################################
// fs.readFile("./txt/start.txt", "utf-8", (err, data) => {
//   if (err) {
//     return;
//     console.log("ERROR");
//   }
//   console.log(data);
//   fs.readFile(`./txt/${data}.txt`, "utf-8", (err, append) => {
//     console.log(append);
//     fs.readFile(`./txt/append.txt`, "utf-8", (err, text) => {
//       console.log(text);
//       fs.writeFile(
//         "./txt/final.txt",
//         `${text} \n ${append}`,
//         "utf-8",
//         (err) => {
//           console.log("Finished writing the file");
//         }
//       );
//     });
//   });
// });

// #########################################################################################
// ############## Web Server - Routing - HTML template - URL Parsing
//##########################################################################################

const tempOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  'utf-8'
);
const tempProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  'utf-8'
);
const tempCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  'utf-8'
);

const apiData = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const apiDataObj = JSON.parse(apiData);

// Create (call back function will be executed with each request)
const server = http.createServer((request, response) => {
  // watch How parsing does the jon
  // console.log(request.url);
  // console.log(url.parse(request.url, true));

  const { query, pathname } = url.parse(request.url, true); // -> Same as below
  // const query = url.parse(request.url, true).query;
  // const pathname = url.parse(request.url, true).pathname;

  console.log(query);
  console.log(pathname);

  // Overview page
  if (pathname === '/' || pathname === '/overview') {
    const cardsHTML = apiDataObj.map(
      (cardDetails) => replaceTemplate(tempCard, cardDetails) // Filling variables
    );
    cardsHTML.join(''); // Joining all cars in to one single element

    const out = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHTML); // Placing cards filled HTML code

    response.writeHead(200, { 'Content-type': 'text/html' }); // Setting content type
    response.end(out); // Sending it out
  } // Product Page
  else if (pathname === '/product') {
    const whichProduct = apiDataObj[query.id];
    response.writeHead(200, { 'Content-type': 'text/html' }); // Setting content type
    const output = replaceTemplate(tempProduct, whichProduct);
    response.end(output);
  } // API
  else if (pathname === '/api') {
    response.writeHead(200, { 'Content-type': 'application/json' });
    response.end(apiData);
  } // NOT_FOUND page
  else {
    response.writeHead(404, {
      'Content-type': 'text/html',
    });
  }
});
// Start
server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to request on port 8000');
});

// #########################################################################################
// ############## Node modules
//##########################################################################################

/*
Packages stored in "dependencies" of package.json are packages that our code needs them to be ran.
we install them by : npm install <package-name>


But packages that we need for development purposes, are stored in "devDependencies".
we install them by : npm install <package-name> --save-dev
--> Packages in devDependencies can't be accessed by Terminal like packages in dependencies. instead we need to add an script to the package.json file and write the command there :
"scripts": {
    "start": "nodemon index.js"
  }
then we can run it by : npm run start


Packages can be installed globally on a machine and can be used in any node project on that machine.
we install them by : npm install <package-name> --global

*/

// #########################################################################################
// ############## Using third party modules : slugify
//##########################################################################################

// Slugify creates url friendly strings
const slugs = apiDataObj.map((el) => slugify(el.productName, { lower: true }));
console.log(slugs);

// #########################################################################################
// ############## Versioning
//##########################################################################################

/* 
npm packages have a 3 number version string
version : x.y.z     -> example : 1.18.11
x -> Major version -> Huge new release (may include code breaking changes)
y -> Minor version -> introduces some new features but changes are backward compatible (wont break our code)
z -> patch version -> increases when some bugs gets fixes

Updating packages : 
We check for package updates by -> "npm outdated"
there is a symbol before version number in package.json. for example :  
{
  "slugify": "^1.3.4"
}
^ -> when updating, download the latest minor version (code wont break)
~ -> when updating, download the latest patch version
* -> when updating, download the latest version (including major version)
finally we can update the package by : npm update <package-name>


To download dependencies for a project : npm install
NOTE : we dont share node-modules folder to git. we only share package.json and package-lock.json

package-lock.json : this file includes the dependencies of our dependencies. for example if slugify is using another package itself, the details of those packages will be stored here.


*/

// #########################################################################################
// ############## Setting up vs code
//##########################################################################################
