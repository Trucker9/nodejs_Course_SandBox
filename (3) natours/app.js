// NOTE: configuring express should be done in this file
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const globalErrorHandler = require('./controllers/errorController');
/////////////////////////////////////////////
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//############################################
//############################################ Global Middlewares (apply on all requests)
// Using middleware: req & res Objects go through middleware stack like a pipe line. here we are adding express.json() to the middleware stack.
// each middleware will send these objects to next( by calling next(); ) middleware and the last one will send it to the client.
// order of middleware is based on what order we write them.
// Middleware applies to all request on the server and route functions are some kind of middleware which end the pipeline by sending back the result to the client.
// NOTE: IF WE WANT TO APPLY A METHOD ON ALL REQUESTS, we define it as middleware, and write it before any routing middleware

// Security: Using default helmet settings. Each node app must have this.
app.use(helmet());

// 100 requests from same IP in 1 hour (3600 ms) - NOTE: resets on app restart.
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// Getting access to the incoming JWT from the browser. it adds an object named cookie to the request object.
app.use(cookieParser());
// Parsing urlEncoded request to body (HTML from submitting)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection.
// removes all "$" and "." from the body.
app.use(mongoSanitizer());

// Data sanitization against XSS
// removes injected HTML and JS data (later the value of properties will be placed in HTML and imagine if value was HTML! )
app.use(xss());
// Serving static files:
// Basically telling the express that if there is a request for static file ( favicon, css, ... ) search in this
// directory for it.
app.use(express.static(path.join(__dirname, 'public'))); // now we can access it in browser with only file name:
// localhost/overview.html
// app.use(express.static(`${__dirname}/public/`));

// HTTP Parameters Pollution --- Sending http request with parameters that are not valid, may cause errors.
// whitelist: allows the parameters in the array to be duplicated in the parameters.
const hppOptions = {
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price',
  ],
};
app.use(hpp(hppOptions));

// Creating custom middleware:
app.use((req, res, next) => {
  // console.log('Hello from the middleware 😀');
  console.log(req.cookies);
  // sending to the next middleware
  next();
});

// // FOR CROSS DOMAIN REQUESTS
// app.use((req, res, next) => {
//   res.setHeader(
//     'Content-Security-Policy',
//     "connect-src *; default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://*" +
//       " 'unsafe-inline' 'unsafe-eval'"
//   );
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   next();
// });
// Allov Access-Control-Allow-Origin
// app.use(cors({ origin: 'http://localhost:8000' }));

// logging request time.
app.use((req, res, next) => {
  // We used this when we sent the result.
  req.requestTime = new Date().toISOString();
  next();
});

//############################################
//############################################ Routes
// Mounting router on a route by Using router as middleware
// when there is a request on /api/v1/tours/?....  it will enter this middleware in the middleware stack and then the tourRouter will kick in.
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// ########################################### Invalid Routes
// if no middleware from above catches the request, then its not a valid request. so we handle it right here. (last middleware)
// .all() -> any HTTP method.
// "*" -> any route.
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ########################################## Error handling middleware
// By giving app.use() a function with 4 arguments, express recognize it as error handling middleware.
// When error happens, we pass the error object to the next(); method of that middleware. express skips all other middlewares and carries that error to this error handling middleware!
// Also: if there is an error in middleware codes, like syntax error, the express will automatically go to the error handling middleware.
app.use(globalErrorHandler);

module.exports = app;
