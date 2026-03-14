const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/bookController');

const router = express.Router();

router.get('/homepage', controller.getHomepage);
router.get('/', controller.getBooks);
router.get('/category/:slug', controller.getCategoryBooks);
router.post('/recalculate-trending', auth('admin'), controller.recalculateTrending);
router.get('/:slug', controller.getBookBySlug);

module.exports = router;
