const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const controller = require('../controllers/adminController');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({ storage });

const router = express.Router();
router.get('/stats', auth('admin'), controller.dashboardStats);
router.get('/blogs', auth('admin'), controller.getBlogs);
router.post('/books', auth('admin'), upload.single('coverImage'), controller.createBook);
router.put('/books/:bookId', auth('admin'), upload.single('coverImage'), controller.updateBook);
router.post('/books/:bookId/chapters', auth('admin'), controller.addChapter);
router.post('/blogs', auth('admin'), controller.createBlog);
router.put('/blogs/:blogId', auth('admin'), controller.updateBlog);
router.delete('/blogs/:blogId', auth('admin'), controller.deleteBlog);

module.exports = router;
