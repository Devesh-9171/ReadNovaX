const mongoose = require('mongoose');

const LANGUAGE_VALUES = ['en', 'hi'];

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    author: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['action', 'romance', 'comedy', 'mystery', 'finance']
    },
    description: { type: String, required: true },
    coverImage: { type: String, required: true },
    language: { type: String, enum: LANGUAGE_VALUES, default: 'en', index: true },
    groupId: { type: String, trim: true, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalViews: { type: Number, default: 0, index: true },
    viewsLast24h: { type: Number, default: 0 },
    viewsLast7d: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0, index: true },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

bookSchema.pre('save', function setDefaultLanguageAndGroup(next) {
  if (!this.language) {
    this.language = 'en';
  }

  if (!this.groupId && this._id) {
    this.groupId = this._id.toString();
  }

  next();
});

bookSchema.index({ title: 'text', author: 'text', category: 'text' });
bookSchema.index({ category: 1, totalViews: -1 });
bookSchema.index({ featured: 1, updatedAt: -1 });
bookSchema.index({ updatedAt: -1 });
bookSchema.index({ groupId: 1, language: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Book', bookSchema);
