const slugify = require('slugify');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { cache } = require('../utils/cache');

exports.createBook = asyncHandler(async (req, res) => {
  const data = req.body;
  const book = await Book.create({
    ...data,
    slug: slugify(data.title, { lower: true, strict: true }),
    coverImage: req.file ? `/uploads/${req.file.filename}` : data.coverImage
  });

  cache.flushAll();
  res.status(201).json(book);
});

exports.updateBook = asyncHandler(async (req, res) => {
  const data = req.body;
  if (data.title) data.slug = slugify(data.title, { lower: true, strict: true });
  if (req.file) data.coverImage = `/uploads/${req.file.filename}`;

  const book = await Book.findByIdAndUpdate(req.params.bookId, data, { new: true });
  if (!book) throw new AppError('Book not found', 404);

  cache.flushAll();
  res.json(book);
});

exports.addChapter = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.bookId).select('_id');
  if (!book) throw new AppError('Book not found', 404);

  const chapter = await Chapter.create({
    ...req.body,
    bookId: book._id,
    slug: slugify(req.body.title || `chapter-${req.body.chapterNumber}`, { lower: true, strict: true })
  });

  cache.flushAll();
  res.status(201).json(chapter);
});

exports.dashboardStats = asyncHandler(async (_req, res) => {
  const [totalBooks, totalChapters, totalViews, topBooks] = await Promise.all([
    Book.countDocuments(),
    Chapter.countDocuments(),
    Book.aggregate([{ $group: { _id: null, views: { $sum: '$totalViews' } } }]),
    Book.find().sort({ totalViews: -1 }).limit(5).select('title slug totalViews rating category').lean()
  ]);

  res.json({
    totalBooks,
    totalChapters,
    totalViews: totalViews[0]?.views || 0,
    topBooks
  });
});
