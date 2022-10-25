const User = require('./../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('../utils/cloudinary');
const path = require('path');
const DataURIParser = require('datauri/parser');
/****
 * MULTER
 ****/

/* DATA URI */
const parser = new DataURIParser();

/* MULTER */
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

/* RESIZE PHOTO */

// exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();

//   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/image/users/${req.file.filename}`);

//   next();
// });

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // console.log(req.file);

  // await Promise.all(
  // req.files.map(async (file, i) => {
  // console.log('req.file object', file);
  const extName = path.extname(req.file.originalname).toString();
  const file64 = parser.format(extName, req.file.buffer);

  // console.log(file64);
  const filename = `post-${
    req.file.originalname.split('.')[0]
  }-${Date.now()}-${+1}.jpeg`;

  await cloudinary.uploader
    .upload(file64.content, { width: 2000, height: 1000, crop: 'limit' })
    .then((result) => {
      req.file.filename = result.secure_url;
      req.file.cloudinary_id = result?.public_id;

      console.log(result);
    });

  // })
  // );

  console.log();
  next();
});

/****
 * Fields to update
 ****/
const filterObj = (obj, ...allowedFields) => {
  newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { status: 'deleted' });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

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
  const filteredBody = filterObj(
    req.body,
    'fullname',
    'email',
    'username',
    'fplteam'
  );

  const user = await User.findById(req.user.id);

  // console.log(user);

  if (req.file) {
    cloudinary.uploader.destroy(user.cloudinary_id, function (error, result) {
      console.log(result, error);
    });
    filteredBody.photo = req.file.filename;
    filteredBody.cloudinary_id = req.file.cloudinary_id;
  }
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
      message: 'Updated successfully',
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// DO NOT UPDATE PASSWORD WITH THIS
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
