const AppError = require('../utils/appError');

//###################################################### Marking mongoose error's operational
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  // is operational is True by default.
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // using regular expression to find a text between quotes.
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  // Getting out all validation messages.
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () =>
  new AppError('Expired token. Please log in again.', 401);
// #################################################### Error sending
const sendErrorDev = (err, req, res) => {
  //req.originalUrl returns the complete route of the request.
  // if we are sending error for our API, use this. else, render error page.
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  console.log(
    '↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ Logged From errorController ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓'
  );
  console.error(err);
  console.log(
    '↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ Logged From errorController ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑'
  );
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: `Only for Development: ${err.message}`,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) For API
  if (req.originalUrl.startsWith('./api')) {
    // Operational (NOT a code problem), trusted error: send message to client
    // First we create a custom error of our own AppError class, then we send it to client.
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming or other unknown error: don't leak error details
    }
    // 1) Log error
    console.log(
      '↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ Logged From errorController ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓'
    );
    console.error(err);
    console.log(
      '↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ Logged From errorController ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑'
    );

    // 2) Send generic message to client
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });

    // B) For rendered website.
  }
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong!', msg: err.message });
  }
  console.log(
    '↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ Logged From errorController ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓'
  );
  console.error(err);
  console.log(
    '↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ Logged From errorController ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑'
  );

  return res.status(500).json({
    status: 'Something went very wrong!',
    message: 'Pls contact dev team.',
  });
};

// ################################################# All errors will end up here using error middleware.
module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Creating new error object.
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
