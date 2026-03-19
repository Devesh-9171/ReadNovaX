const express = require('express');
const controller = require('../controllers/blogController');

const router = express.Router();

router.get('/latest', controller.getLatestBlogPosts);
router.get('/', controller.getBlogPosts);
router.get('/:slug', controller.getBlogPostBySlug);

module.exports = router;
