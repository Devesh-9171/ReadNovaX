import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const INPUT_CLASS = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-400/10';
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[120px]`;
const CARD_CLASS = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950';
const ALERT_ERROR_CLASS = 'mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200';
const ALERT_SUCCESS_CLASS = 'mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200';
const CATEGORY_OPTIONS = ['action', 'romance', 'comedy', 'mystery', 'finance'];

const initialBookForm = {
  title: '',
  author: '',
  description: '',
  category: CATEGORY_OPTIONS[0],
  coverImage: ''
};

const initialChapterForm = {
  bookId: '',
  chapterNumber: '',
  title: '',
  content: ''
};

function slugifyPreview(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookForm, setBookForm] = useState(initialBookForm);
  const [chapterForm, setChapterForm] = useState(initialChapterForm);
  const [editingBookId, setEditingBookId] = useState('');
  const [editForm, setEditForm] = useState(initialBookForm);
  const [statsError, setStatsError] = useState('');
  const [bookError, setBookError] = useState('');
  const [chapterError, setChapterError] = useState('');
  const [booksError, setBooksError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');
  const [chapterSuccess, setChapterSuccess] = useState('');
  const [booksSuccess, setBooksSuccess] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [submittingBook, setSubmittingBook] = useState(false);
  const [submittingChapter, setSubmittingChapter] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState('');

  const chapterSlugPreview = useMemo(() => slugifyPreview(chapterForm.title || `chapter-${chapterForm.chapterNumber || 'new'}`), [chapterForm.chapterNumber, chapterForm.title]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError('');

    try {
      const { data } = await api.get('/admin/stats', { headers: getAuthHeaders() });
      setStats(data);
    } catch (error) {
      setStats(null);
      setStatsError(error.message || 'Failed to load admin stats.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    setBooksError('');

    try {
      const { data } = await api.get('/books', { params: { limit: 100 } });
      const nextBooks = data.data || [];
      setBooks(nextBooks);
      setChapterForm((current) => ({
        ...current,
        bookId: current.bookId || nextBooks[0]?._id || ''
      }));
    } catch (error) {
      setBooks([]);
      setBooksError(error.message || 'Failed to load books.');
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadBooks();
  }, [loadBooks, loadStats]);

  const handleBookChange = (field, value) => {
    setBookForm((current) => ({ ...current, [field]: value }));
  };

  const handleChapterChange = (field, value) => {
    setChapterForm((current) => ({ ...current, [field]: value }));
  };

  const resetBookMessages = () => {
    setBookError('');
    setBookSuccess('');
  };

  const submitBook = async (event) => {
    event.preventDefault();
    resetBookMessages();

    try {
      setSubmittingBook(true);
      await api.post(
        '/books',
        {
          title: bookForm.title.trim(),
          author: bookForm.author.trim(),
          description: bookForm.description.trim(),
          category: bookForm.category.trim(),
          coverImage: bookForm.coverImage.trim()
        },
        { headers: getAuthHeaders() }
      );

      setBookSuccess('Book added successfully.');
      setBookForm(initialBookForm);
      await Promise.all([loadStats(), loadBooks()]);
    } catch (error) {
      setBookError(error.message || 'Failed to add book.');
    } finally {
      setSubmittingBook(false);
    }
  };

  const submitChapter = async (event) => {
    event.preventDefault();
    setChapterError('');
    setChapterSuccess('');

    try {
      setSubmittingChapter(true);
      await api.post(
        '/chapters',
        {
          bookId: chapterForm.bookId,
          chapterNumber: Number(chapterForm.chapterNumber),
          title: chapterForm.title.trim(),
          content: chapterForm.content.trim()
        },
        { headers: getAuthHeaders() }
      );

      setChapterSuccess('Chapter added successfully.');
      setChapterForm((current) => ({
        ...initialChapterForm,
        bookId: current.bookId || books[0]?._id || ''
      }));
      await loadStats();
    } catch (error) {
      setChapterError(error.message || 'Failed to add chapter.');
    } finally {
      setSubmittingChapter(false);
    }
  };

  const startEditingBook = (book) => {
    setBooksSuccess('');
    setBooksError('');
    setEditingBookId(book._id);
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      category: book.category || CATEGORY_OPTIONS[0],
      coverImage: book.coverImage || ''
    });
  };

  const saveBookEdit = async (bookId) => {
    setBooksError('');
    setBooksSuccess('');

    try {
      setSavingEdit(true);
      await api.put(
        `/books/${bookId}`,
        {
          title: editForm.title.trim(),
          author: editForm.author.trim(),
          description: editForm.description.trim(),
          category: editForm.category.trim(),
          coverImage: editForm.coverImage.trim()
        },
        { headers: getAuthHeaders() }
      );
      setEditingBookId('');
      setBooksSuccess('Book updated successfully.');
      await Promise.all([loadStats(), loadBooks()]);
    } catch (error) {
      setBooksError(error.message || 'Failed to update book.');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteBook = async (bookId) => {
    setBooksError('');
    setBooksSuccess('');

    try {
      setDeletingBookId(bookId);
      await api.delete(`/books/${bookId}`, { headers: getAuthHeaders() });
      setBooksSuccess('Book deleted successfully.');
      if (editingBookId === bookId) {
        setEditingBookId('');
      }
      await Promise.all([loadStats(), loadBooks()]);
    } catch (error) {
      setBooksError(error.message || 'Failed to delete book.');
    } finally {
      setDeletingBookId('');
    }
  };

  return (
    <Layout>
      <section className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Publish readable stories fast, generate chapter slugs automatically, and manage your catalog in one place.
          </p>
        </div>
      </section>

      {statsError && <p className={ALERT_ERROR_CLASS}>{statsError}</p>}
      {booksError && <p className={ALERT_ERROR_CLASS}>{booksError}</p>}
      {booksSuccess && <p className={ALERT_SUCCESS_CLASS}>{booksSuccess}</p>}

      {loadingStats ? (
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-300">Loading admin analytics...</p>
      ) : stats ? (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Books" value={stats.totalBooks} />
          <StatCard label="Chapters" value={stats.totalChapters} />
          <StatCard label="Total Views" value={stats.totalViews} />
        </section>
      ) : (
        <div className={`${CARD_CLASS} mb-8`}>
          <p className="text-sm text-slate-600 dark:text-slate-300">Login as an admin to view analytics and manage content.</p>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={CARD_CLASS}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Add Book</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create a new book with title, optional author, and a cover image URL.</p>
          </div>

          {bookError && <p className={ALERT_ERROR_CLASS}>{bookError}</p>}
          {bookSuccess && <p className={ALERT_SUCCESS_CLASS}>{bookSuccess}</p>}

          <form onSubmit={submitBook} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Title</label>
              <input className={INPUT_CLASS} type="text" value={bookForm.title} onChange={(event) => handleBookChange('title', event.target.value)} placeholder="Enter book title" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Author</label>
              <input className={INPUT_CLASS} type="text" value={bookForm.author} onChange={(event) => handleBookChange('author', event.target.value)} placeholder="Optional author name" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <textarea className={TEXTAREA_CLASS} value={bookForm.description} onChange={(event) => handleBookChange('description', event.target.value)} placeholder="Write a short description" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <select className={INPUT_CLASS} value={bookForm.category} onChange={(event) => handleBookChange('category', event.target.value)} required>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Cover Image URL</label>
              <input className={INPUT_CLASS} type="url" value={bookForm.coverImage} onChange={(event) => handleBookChange('coverImage', event.target.value)} placeholder="https://example.com/cover.jpg" required />
            </div>

            <button type="submit" disabled={submittingBook} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
              {submittingBook ? 'Adding book...' : 'Add Book'}
            </button>
          </form>
        </div>

        <div className={CARD_CLASS}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Add Chapter</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Attach a new chapter to an existing book with an automatic slug preview.</p>
          </div>

          {chapterError && <p className={ALERT_ERROR_CLASS}>{chapterError}</p>}
          {chapterSuccess && <p className={ALERT_SUCCESS_CLASS}>{chapterSuccess}</p>}

          <form onSubmit={submitChapter} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Book</label>
              <select className={INPUT_CLASS} value={chapterForm.bookId} onChange={(event) => handleChapterChange('bookId', event.target.value)} required disabled={loadingBooks || books.length === 0}>
                <option value="">Select a book</option>
                {books.map((book) => (
                  <option key={book._id} value={book._id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Chapter Number</label>
              <input className={INPUT_CLASS} type="number" min="1" value={chapterForm.chapterNumber} onChange={(event) => handleChapterChange('chapterNumber', event.target.value)} placeholder="1" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Title</label>
              <input className={INPUT_CLASS} type="text" value={chapterForm.title} onChange={(event) => handleChapterChange('title', event.target.value)} placeholder="Chapter title" required />
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              Generated slug: <span className="font-semibold text-slate-900 dark:text-white">{chapterSlugPreview || 'chapter-preview'}</span>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Content</label>
              <textarea className={TEXTAREA_CLASS} value={chapterForm.content} onChange={(event) => handleChapterChange('content', event.target.value)} placeholder="Write chapter content here" required />
            </div>

            <button type="submit" disabled={submittingChapter || books.length === 0} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
              {submittingChapter ? 'Adding chapter...' : 'Add Chapter'}
            </button>
          </form>
        </div>
      </section>

      <section className={`${CARD_CLASS} mt-8`}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Books List</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Edit book metadata or delete a title directly from the admin catalog.</p>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-300">{books.length} total</span>
        </div>

        {loadingBooks ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading books...</p>
        ) : books.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            No books available yet.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {books.map((book) => {
              const isEditing = editingBookId === book._id;
              return (
                <article key={book._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr]">
                    <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={isEditing ? editForm.coverImage || book.coverImage : book.coverImage} alt={`${book.title} cover`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="space-y-3">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input className={INPUT_CLASS} type="text" value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} placeholder="Book title" />
                          <input className={INPUT_CLASS} type="text" value={editForm.author} onChange={(event) => setEditForm((current) => ({ ...current, author: event.target.value }))} placeholder="Author" />
                          <select className={INPUT_CLASS} value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}>
                            {CATEGORY_OPTIONS.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                          <input className={INPUT_CLASS} type="url" value={editForm.coverImage} onChange={(event) => setEditForm((current) => ({ ...current, coverImage: event.target.value }))} placeholder="Cover image URL" />
                          <textarea className={TEXTAREA_CLASS} value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => saveBookEdit(book._id)} disabled={savingEdit} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-60">
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditingBookId('')} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-lg font-semibold">{book.title}</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
                          </div>
                          <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{book.description || 'No description available.'}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 dark:bg-slate-800">{book.category}</span>
                            <span>Slug: {book.slug}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => startEditingBook(book)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:hover:border-sky-400 dark:hover:text-sky-300">
                              Edit
                            </button>
                            <button type="button" onClick={() => deleteBook(book._id)} disabled={deletingBookId === book._id} className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10">
                              {deletingBookId === book._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className={CARD_CLASS}>
      <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
