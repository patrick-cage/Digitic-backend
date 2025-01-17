const express = require('express');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { blogImgResize, uploadPhoto } = require('../middlewares/uploadImages');
const { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, likeblog, dislikeblog, uploadImages } = require('../controller/blogCtrl');
const router = express.Router()

router.post('/', authMiddleware, isAdmin, createBlog)
router.put('/upload/:id', authMiddleware, isAdmin,uploadPhoto.array('images',2), blogImgResize,uploadImages)
router.put('/likes', authMiddleware, likeblog)
router.put('/dislikes', authMiddleware, dislikeblog)
router.put('/:id', authMiddleware, isAdmin, updateBlog)
router.get('/:id', getBlog)
router.get('/', getAllBlogs)

router.delete('/:id', authMiddleware,isAdmin, deleteBlog)
module.exports = router;