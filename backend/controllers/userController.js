const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('bookmarks')
    .populate('favoriteBooks')
    .populate('readingHistory.bookId readingHistory.chapterId');

  if (!user) throw new AppError('User not found', 404);
  res.json(user);
});

exports.toggleBookmark = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  const chapterId = req.params.chapterId;
  const index = user.bookmarks.findIndex((id) => id.toString() === chapterId);
  if (index >= 0) user.bookmarks.splice(index, 1);
  else user.bookmarks.push(chapterId);

  await user.save();
  res.json({ bookmarks: user.bookmarks });
});

exports.toggleFavoriteBook = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  const bookId = req.params.bookId;
  const index = user.favoriteBooks.findIndex((id) => id.toString() === bookId);
  if (index >= 0) user.favoriteBooks.splice(index, 1);
  else user.favoriteBooks.push(bookId);

  await user.save();
  res.json({ favoriteBooks: user.favoriteBooks });
});

exports.saveReadingProgress = asyncHandler(async (req, res) => {
  const { bookId, chapterId, progress } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  const existing = user.readingHistory.find((item) => item.chapterId.toString() === chapterId);

  if (existing) {
    existing.progress = progress;
    existing.lastReadAt = new Date();
  } else {
    user.readingHistory.push({ bookId, chapterId, progress });
  }

  await user.save();
  res.json({ readingHistory: user.readingHistory });
});
