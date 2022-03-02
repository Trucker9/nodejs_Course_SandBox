/* eslint-disable prefer-template */
const crypto = require('crypto');
// only getting promisify function out of util package.
const { promisify } = require('util');
// See Docs. its good.
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
// Creating a JWT with "id" and "secret".
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Cookie: A piece of text that server sends to browser and browser send it back to server on response request cycle.
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // Browser can just receive, and send back the cookie. not modify it.
    // Not even delete it ( so we can not sign the user out simply by just removing it)
    httpOnly: true,
  };
  // secure:true   ==  cookie will be sent over HTTPS only
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output (Although we added "select:false" in schema, but that works for Queries. if we create a new user (so not doing any query) the password will exist in the user Obj )
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email and password exist
  if (!email || !password) {
    next(new AppError('Please provide email and password!', 400));
    // If we don't write the return here, Error will be sent and the rest of this function will be executed.
    return;
  }
  // 2) Check if user exists && password is correct
  // Password won't be selected by default because it has "select: false" property. here we add it to the user object explicitly.
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// Here we send another cookie to the client to overwrite the token he has. then we give it a short expiration time.
// our cookie is sent over http only, so we con not delete it.
exports.logout = (req, res) => {
  res.cookie('jwt', 'fakeToken', {
    // expires in 10 seconds
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// ######################################################### Protected routes
// Only logged in users can access this routes.
// Here we create a new middle ware that checks for user being logged in, and we add it to "routes" to run before the protected routes.
// if user was logged in, request will go to the next middleware and the protected route can be accessed. other wise it throws error.
exports.protect = catchAsync(async (req, res, next) => {
  // 1) --------------------- Getting token and check of it's there
  // In Postman, we add this header { authorization: "Bearer <TOKEN>" }
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // If there was no token in the authorization header, then check the cookies.
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) --------------------- Verification token
  // By default, JWT.verify() accepts a callback function as its third argument and runs it after token validation has accepted.
  // Here we promisified the method, so after verification it just returns the decoded value.
  const promisifiedVerify = promisify(jwt.verify);
  const decoded = await promisifiedVerify(token, process.env.JWT_SECRET);

  // 3) --------------------- Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) --------------------- Check if user changed password after the token was issued
  // If user was logged and changed the password, he needs to log in again.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Adding current user (later we need user info and we pick it up from req Object.)
  req.user = currentUser;
  // for pug
  res.locals.user = currentUser;

  // GRANT ACCESS TO PROTECTED ROUTE
  next();
});

// Only for rendered pages, there will be no errors!
// We don't want to throw an error that ends up in the global error handling middleware. because in this case, all
// other middleware will be skipped and the error will be shown to the user.
// for example if the JWT was wrong(user was not logged in or was logging out) , we want to go to the next
// middleware and catch that error locally.
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // if all the above was correct, then THERE IS A LOGGED-IN USER
      // res.locals.<something> : in pug templates, we get access to this <something>.(we use it in _header.pug)
      // so if there was a logged-in user, we add the user to res.locals and then we go to the next middleware.
      // if there was a problem or there was no logged-in in user, we return from this function and no user will be
      // added to locals.
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  // When this next is called, a user is added to req.locals
  next();
};

// We can not pass arguments to middleware functions. so we wrap the middleware in a wrapper function and we set our arguments in the wrapper.
// wrapper has the arguments an all it does is to return the middleware function, BUT, middleware has access to wrapper arguments thanks to closures !!!!
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles-> roles that have access to the current route. if user role is not part of the roles array, throws error.
    console.log(`allowed roles: ${roles}
    req.user: ${req.user}`);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) --------------------- Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) --------------------- Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // Here we save the details that user.createPasswordResetToken(); did to our user object, in DB. but validators must be turned off, because we are not saving  complete user object. we simply are just adding some properties to it.
  await user.save({ validateBeforeSave: false });

  // --------------------- 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // If email could not be sent, We have to roll back some changes and then send the error.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) --------------------- Get user based on the token
  // Hashing the token that user has sent to compare it with hashed token in DB.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) --------------------- If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // NOTE: middlewares work on .save(); method. so for stuff like password that we need the validators and middlewares to actually run, we use .save();
  await user.save();

  // 3) --------------------- Update changedPasswordAt property for the user
  // 4) --------------------- Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) --------------------- Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) --------------------- Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) --------------------- If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // NOTE: middlewares work on .save(); method. so for stuff like password that we need the validators and middlewares to actually run, we use save();
  // user.findByIdAndUpdate(); must be avoided since it wont trigger middlewares
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // --------------------- 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
