const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const BlogPost = require('../models/BlogPost');
const asyncHandler = require('../utils/asyncHandler');
const { getSharedSlugMap } = require('../utils/bookSlug');
const { normalizeLanguage } = require('../utils/language');

function isValidSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || '').trim());
}

exports.getSitemapPayload = asyncHandler(async (_req, res) => {
  const [books, chapters, blogPosts] = await Promise.all([
    Book.find()
      .sort({ groupId: 1, language: 1, updatedAt: -1, _id: 1 })
      .select('slug language groupId updatedAt')
      .lean(),
    Chapter.find()
      .sort({ bookId: 1, chapterNumber: 1, updatedAt: -1, _id: 1 })
      .select('bookId slug chapterNumber language updatedAt')
      .lean(),
    BlogPost.find()
      .sort({ publishedAt: -1, updatedAt: -1, _id: -1 })
      .select('slug publishedAt updatedAt')
      .lean()
  ]);

  const chaptersByBookId = new Map();
  for (const chapter of chapters) {
    if (!isValidSlug(chapter.slug)) continue;

    const key = String(chapter.bookId);
    const existing = chaptersByBookId.get(key) || [];
    existing.push({
      slug: chapter.slug,
      chapterNumber: chapter.chapterNumber,
      language: normalizeLanguage(chapter.language),
      updatedAt: chapter.updatedAt
    });
    chaptersByBookId.set(key, existing);
  }

  const sharedSlugMap = await getSharedSlugMap(books.map((book) => book.groupId || String(book._id)));
  const uniqueBlogPosts = [];
  const seenBlogSlugs = new Set();
  for (const post of blogPosts) {
    if (!isValidSlug(post.slug) || seenBlogSlugs.has(post.slug)) continue;
    seenBlogSlugs.add(post.slug);
    uniqueBlogPosts.push({
      slug: post.slug,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt
    });
  }

  const payload = {
    success: true,
    generatedAt: new Date().toISOString(),
    books: books
      .filter((book) => isValidSlug(sharedSlugMap.get(book.groupId || String(book._id)) || book.slug))
      .map((book) => {
        const chaptersForBook = chaptersByBookId.get(String(book._id)) || [];
        const latestChapterUpdate = chaptersForBook
          .map((chapter) => new Date(chapter.updatedAt || 0).getTime())
          .filter(Number.isFinite)
          .sort((left, right) => right - left)[0];

        return {
          id: String(book._id),
          slug: sharedSlugMap.get(book.groupId || String(book._id)) || book.slug,
          language: normalizeLanguage(book.language),
          groupId: book.groupId || String(book._id),
          updatedAt: book.updatedAt,
          latestContentUpdatedAt: latestChapterUpdate ? new Date(Math.max(new Date(book.updatedAt || 0).getTime(), latestChapterUpdate)).toISOString() : book.updatedAt,
          chapters: chaptersForBook
        };
      }),
    blogPosts: uniqueBlogPosts
  };

  res.set('Cache-Control', 'no-store, max-age=0');
  res.json(payload);
});
