const dotenv = require('dotenv');
const slugify = require('slugify');
const connectDB = require('../utils/db');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const BlogPost = require('../models/BlogPost');
const data = require('../data/sampleData');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  await connectDB(process.env.MONGO_URI);
  await Promise.all([Book.deleteMany({}), Chapter.deleteMany({}), User.deleteMany({}), BlogPost.deleteMany({})]);

  const books = [];
  for (const bookData of data.books) {
    const book = await Book.create({
      ...bookData,
      trendingScore: bookData.viewsLast24h * 3 + bookData.viewsLast7d * 2 + bookData.totalViews
    });
    books.push(book);

    const chapters = data.chaptersBySlug[book.slug] || [];
    for (const chapter of chapters) {
      await Chapter.create({
        bookId: book._id,
        title: chapter.title,
        slug: slugify(`chapter-${chapter.chapterNumber}-${chapter.title}`, { lower: true, strict: true }),
        chapterNumber: chapter.chapterNumber,
        content: chapter.content,
        views: Math.floor(Math.random() * 2000)
      });
    }
  }

  const blogPosts = [];
  for (const post of data.blogPosts || []) {
    blogPosts.push(
      await BlogPost.create({
        ...post,
        slug: slugify(post.title, { lower: true, strict: true }),
        publishedAt: new Date()
      })
    );
  }

  console.log(`Seeded ${books.length} books and ${blogPosts.length} blog posts`);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
