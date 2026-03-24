const slugify = require('slugify');
const Book = require('../models/Book');
const { DEFAULT_LANGUAGE, normalizeLanguage } = require('./language');

function getBookGroupId(book) {
  return String(book?.groupId || book?._id || '').trim();
}

function createBaseBookSlug(title) {
  const baseSlug = slugify(String(title || ''), { lower: true, strict: true, trim: true });
  return baseSlug || 'book';
}

function pickCanonicalSlugSource(books, fallback = {}) {
  const normalizedFallbackLanguage = normalizeLanguage(fallback.language, DEFAULT_LANGUAGE);
  const candidates = [
    ...books,
    ...(fallback.title ? [{ title: fallback.title, language: normalizedFallbackLanguage }] : [])
  ].filter((book) => String(book?.title || '').trim());

  return (
    candidates.find((book) => normalizeLanguage(book.language, DEFAULT_LANGUAGE) === DEFAULT_LANGUAGE)
    || candidates[0]
    || fallback
  );
}

async function ensureUniqueGroupSlug(baseSlug, groupId) {
  let slug = baseSlug || 'book';
  let counter = 1;

  while (
    await Book.exists({
      slug,
      groupId: { $ne: groupId }
    })
  ) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

async function buildSharedBookSlug({ groupId, title, language }) {
  const books = groupId
    ? await Book.find({ groupId }).select('title language').lean()
    : [];
  const source = pickCanonicalSlugSource(books, { title, language });
  const baseSlug = createBaseBookSlug(source.title);
  return ensureUniqueGroupSlug(baseSlug, groupId);
}

async function syncGroupBookSlugs(groupId, fallback = {}) {
  if (!groupId) return null;

  const books = await Book.find({ groupId }).select('_id title slug language groupId').lean();
  if (!books.length) return null;

  const source = pickCanonicalSlugSource(books, fallback);
  const baseSlug = createBaseBookSlug(source.title);
  const sharedSlug = await ensureUniqueGroupSlug(baseSlug, groupId);

  await Book.updateMany(
    { groupId, slug: { $ne: sharedSlug } },
    { $set: { slug: sharedSlug } }
  );

  return sharedSlug;
}

async function getSharedSlugMap(groupIds = []) {
  const normalizedGroupIds = Array.from(new Set(groupIds.map((groupId) => String(groupId || '').trim()).filter(Boolean)));
  if (!normalizedGroupIds.length) return new Map();

  const books = await Book.find({ groupId: { $in: normalizedGroupIds } })
    .select('_id groupId title slug language')
    .sort({ groupId: 1, language: 1, _id: 1 })
    .lean();

  const booksByGroupId = new Map();
  for (const book of books) {
    const groupId = getBookGroupId(book);
    const variants = booksByGroupId.get(groupId) || [];
    variants.push(book);
    booksByGroupId.set(groupId, variants);
  }

  const slugMap = new Map();
  for (const [groupId, variants] of booksByGroupId.entries()) {
    const source = pickCanonicalSlugSource(variants);
    slugMap.set(groupId, source.slug || createBaseBookSlug(source.title));
  }

  return slugMap;
}

async function applySharedSlugToBooks(books = []) {
  if (!Array.isArray(books) || !books.length) return books;

  const slugMap = await getSharedSlugMap(books.map((book) => getBookGroupId(book)));
  return books.map((book) => {
    const groupId = getBookGroupId(book);
    const sharedSlug = slugMap.get(groupId);
    return sharedSlug ? { ...book, slug: sharedSlug } : book;
  });
}

module.exports = {
  applySharedSlugToBooks,
  buildSharedBookSlug,
  createBaseBookSlug,
  getBookGroupId,
  getSharedSlugMap,
  syncGroupBookSlugs
};
