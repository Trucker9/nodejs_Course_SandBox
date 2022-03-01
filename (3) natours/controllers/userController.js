const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   // Patter: like below,
//   // cb is like next in express. first argument of cb is for adding error and second is the value.
//   // <propertyName>: (req, file, cb) => {
//   //   cb(null, '<value>' );
//   // },
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // Getting extension of the file (look at mimetype to understand better, in this case -> mimetype: image/jpeg )
//     const extension = file.mimetype.split('/')[1];
//     // name of the file will be: user - <userId> - <time> to avoid duplicate name for files.
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

// Because we want to process the image, we store it memory.
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    // true -> uploaded file is image
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Configuring multer.
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// .single(photo) means that we will get one file and the field name of that file is going to be "photo".
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // name of the file will be: user - <userId> - <time> to avoid duplicate name for files.
  // We reformat the file, so its always jpeg and there is no need to find the file extension like before.
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // We saved the image into memory, so we can access it now with "req.file.buffer" (instead of writing it to disk
  // and reading it again)
  await sharp(req.file.buffer)
    // be default it makes it center (check docs for more info)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    // Writing it to disk.
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
/**
 * Just filling up req.params.id when the user is logged in.
 */
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  // If user uploaded a file, add its name to the filterBody object. this object is going to be updated in the database.
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  // We are changing non-sensitive data, so we use update to avoid running middlewares.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup instead.',
  });
};
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
