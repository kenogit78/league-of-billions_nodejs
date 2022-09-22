const express = require('express');
const router = express.Router();
// const auth = require('../../middlewares/authenticate')
const authController = require('../../controllers/authentications');

const postController = require('../../controllers/post');

router.use(authController.protect);

router.get('/', postController.getAllPosts);

router.post('/new', postController.makePost);

router
  .route('/:id')
  .put(
    postController.uploadPostImages,
    postController.resizePostImages,
    postController.editPost
  )
  .delete(postController.deletePost);

router.put('/:id/like', postController.likePost);

// router.put('/:id/dislike',  postController.dislikePost)
// router.put('/:id/comments',  postController.commentPost)
// router.put('/:id/share',  postController.sharePost)
// router.get('/timeline/all', postController.getAllpost);
// router.get('/:id', postController.getAllpost);

module.exports = router;
