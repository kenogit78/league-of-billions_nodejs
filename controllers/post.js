const Post = require('../models/post');
const responseHandler = require('../utils/response');
const factory = require('./handlerFactory');

const config = require('../config');
const { response } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const cloudinary = require('../utils/cloudinary');
const DatauriParser = require('datauri/parser');
const path = require('path');

/* DATA URI */
const parser = new DatauriParser();

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

exports.uploadPostImages = upload.array('img', 3);

exports.resizePostImages = catchAsync(async (req, res, next) => {
  if (!req.files) return next();
  console.log(req);
  req.body.img = [];
  req.body.cloudinary_id = [];

  await Promise.all(
    req.files.map(async (file, i) => {
      console.log('req.file object', file);
      const extName = path.extname(file.originalname).toString();
      const file64 = parser.format(extName, file.buffer);

      console.log(file64);
      const filename = `post-${file.originalname.split('.')[0]}-${Date.now()}-${
        i + 1
      }.jpeg`;

      // await sharp(file.buffer)
      //   .resize(2000, 1333)
      //   .toFormat('jpeg')
      //   .jpeg({ quality: 90 })
      //   .toFile(`public/image/posts/${filename}`);

      await cloudinary.uploader.upload(file64.content, function (result) {
        req.body.img.push(result.secure_url);
        req.body.cloudinary_id.push(result?.public_id);

        console.log(result);
      });

      // req.body.img.push(filename);
    })
  );

  console.log();
  next();
});

exports.makePost = factory.createOne(Post);

exports.getAllPosts = factory.getAll(Post);

exports.editPost = factory.updateOne(Post);

exports.deletePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);
  // console.log(post);

  // console.log(post.cloudinary_id.length);
  if (post.user.id === req.user.id) {
    await post.deleteOne();

    // DELETE IMAGES FROM CLOUDINARY
    if (post.cloudinary_id.length > 0) {
      await cloudinary.api.delete_resources(post.cloudinary_id);
    }
    // res.status(200).json("the post has been deleted");
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } else {
    res.status(403).json('you can delete only your post');
  }
});

// exports.deletePost = factory.deleteOne(Post);

/*****************
 * LIKE FUNCTION *
 *****************/
exports.likePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post.likes.includes(req.body.userId)) {
    await post.updateOne({ $push: { likes: req.body.userId } });
    // res.status(200).json("The post has been liked");
    return responseHandler.sendSuccess(res, {
      message: 'The post has been liked',
      status: 201,
    });
  } else {
    await post.updateOne({ $pull: { likes: req.body.userId } });
    return responseHandler.sendSuccess(res, {
      message: 'The post has been unliked',
      status: 201,
    });
  }
});
