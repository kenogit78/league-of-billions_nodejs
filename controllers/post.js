const Post = require('../models/post')
const responseHandler = require('../utils/response')

const config = require('../config');
const { response } = require('../utils/response');


exports.makePost = async(req, res) => {
    const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    // res.status(200).json(savedPost);
    return responseHandler.sendSuccess(res, {
      message: "Post sent successfully",
      status: 201,
      data: savedPost
    })
  } catch (err) {
    // res.status(500).json(err);
    return responseHandler.sendError(res, {
      status: 401,
      message: 'Error | Post not sent',
    })
  }
}

exports.editPost = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      // res.status(200).json("the post has been updated");
      return responseHandler.sendSuccess(res,{
        status: 201,
        message: "the post has been updated",
        data: post
        })
    } else {
      // res.status(403).json("you can update only your post");
      return responseHandler.sendError(res, {
        status: 403,
        message: "you can update only your post"
      })
    }
  } catch (err) {
    // res.status(500).json(err);
    return responseHandler.sendError(res, 
      {message: 'Could not update post', status: 404})
  }
}

exports.deletePost = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      // res.status(200).json("the post has been deleted");
      return responseHandler.sendSuccess( res, {
        message: "the post has been deleted",
        status: 201,
        data: post
      })
    } else {
      res.status(403).json("you can delete only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
}

exports.likePost = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      // res.status(200).json("The post has been liked");
      return responseHandler.sendSuccess(res, {
        message: "The post has been liked",
        status: 201,
        data: post.likes
      })
    }else{
      await post.updateOne({ $pull: { likes: req.body.userId } });
      return responseHandler.sendSuccess(res, {
        message: "The post has been unliked",
        status: 201,
        data: post.likes
      })
    }
  } catch (err) {
    res.status(500).json(err);
  }
}

exports.dislikePost = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { dislikes: req.body.userId } });
      // res.status(200).json("The post has been liked");
      return responseHandler.sendSuccess(res, {
        message: "The post has been disliked",
        status: 201,
        data: post.dislikes
      })
    }else{
      await post.updateOne({ $pull: { dislikes: req.body.userId } });
      return responseHandler.sendSuccess(res, {
        message: "The post has been undisliked",
        status: 201,
        data: post.dislikes
      })
    }
  } catch (err) {
    res.status(500).json(err);
  }
}


// exports.commentPost = 

// exports.sharePost = 

// exports.getAllpost = async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.params.userId);
//     const userPosts = await Post.find({ userId: currentUser._id });
//     const friendPosts = await Promise.all(
//       currentUser.followings.map((friendId) => {
//         return Post.find({ userId: friendId });
//       })
//     );
//     res.status(200).json(userPosts.concat(...friendPosts));
//   } catch (err) {
//     res.status(500).json(err);
//   }
// }