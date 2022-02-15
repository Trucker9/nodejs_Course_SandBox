class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // used to decide either send the error to the client or not.
    this.isOperational = true;
    // ??????
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
