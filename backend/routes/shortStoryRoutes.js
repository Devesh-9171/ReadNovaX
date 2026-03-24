const express = require('express');
const controller = require('../controllers/shortStoryController');
const { authMiddleware, requireRoles } = require('../middleware/authMiddleware');
const auth = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', authMiddleware, requireRoles(['author', 'admin']), uploadSingleImage('coverImage'), controller.createShortStory);
router.get('/:id', controller.getPublishedShortStory);
router.post('/complete-view', auth.optionalAuth, controller.completeShortStoryView);

module.exports = router;
