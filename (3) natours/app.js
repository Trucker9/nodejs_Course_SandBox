// NOTE: configuring express should be done in this file
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('mongo-sanitizer');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const globalErrorHandler = require('./controllers/errorController');
/////////////////////////////////////////////
const app = express();

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
  message: 'Too many requests from this IP, pease try again in an hour!',
});
app.use('/api', limiter);

// development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection.
// removes all "$" and "." from the body.
app.use(mongoSanitizer());

// Data sanitization against XSS
// removes injected HTML and JS data (later the value of properties will be placed in HTML and imagine if value was HTML! )
app.use(xss());
// Serving static files:
app.use(express.static(`${__dirname}/public/`)); // now we can access it in browser with only file name: localhost/overview.html

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
app.use(hpp());

// Creating custom middleware:
app.use((req, res, next) => {
  // console.log('Hello from the middleware 😀');
  // sending to the next middleware
  next();
});

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
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// ########################################### Invalid Routes
// if no middleware from above catches the request, then its not a valid request. so we handle it right here. (last middleware)
// .all() -> any HTTP method.
// "*" -> any route.
app.all('*', (req, res, next) => {
  console.log('reached!sdvdfsv');
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
