const mongoose = require('mongoose');
const { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, normalizeLanguage } = require('../utils/language');

const shortStorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    coverImage: { type: String, trim: true, required: true },
    coverImagePublicId: { type: String, trim: true, default: '' },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    content: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    language: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      required: true,
      default: DEFAULT_LANGUAGE,
      index: true,
      set: (value) => normalizeLanguage(value, DEFAULT_LANGUAGE)
    },
    groupId: { type: String, trim: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['review', 'published', 'rejected'], default: 'review', index: true },
    rejectionReason: { type: String, trim: true, default: '' },
    publishedAt: { type: Date },
    wordCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 },
    views: { type: Number, default: 0, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

shortStorySchema.pre('validate', function normalize(next) {
  this.tags = Array.from(new Set((this.tags || []).map((tag) => String(tag || '').trim().toLowerCase()).filter(Boolean)));
  this.language = normalizeLanguage(this.language, DEFAULT_LANGUAGE);
  if (!this.groupId && this._id) {
    this.groupId = this._id.toString();
  }
  if ((this.tags || []).length > 3) {
    return next(new Error('Short stories support max 3 tags'));
  }
  return next();
});

shortStorySchema.index({ groupId: 1, language: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ShortStory', shortStorySchema);
