const express = require('express')
const router = express.Router()
// const auth = require('../../middlewares/authenticate')

const postController = require('../../controllers/post')

router.post('/new', postController.makePost)
router.put('/:id',  postController.editPost)
router.delete('/:id',  postController.deletePost)
router.put('/:id/like',  postController.likePost)
// router.put('/:id/dislike',  postController.dislikePost)
// router.put('/:id/comments',  postController.commentPost)
// router.put('/:id/share',  postController.sharePost)
// router.get('/timeline/all', postController.getAllpost);
// router.get('/:id', postController.getAllpost);

module.exports = router