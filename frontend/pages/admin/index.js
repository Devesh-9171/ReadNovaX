import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import BlogContent from '../../components/BlogContent';

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

const initialBlogForm = {
  title: '',
  description: '',
  coverImage: '',
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

function formatDate(date) {
  if (!date) return 'Not published';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [bookForm, setBookForm] = useState(initialBookForm);
  const [chapterForm, setChapterForm] = useState(initialChapterForm);
  const [blogForm, setBlogForm] = useState(initialBlogForm);
  const [editingBookId, setEditingBookId] = useState('');
  const [editingBlogId, setEditingBlogId] = useState('');
  const [editForm, setEditForm] = useState(initialBookForm);
  const [editBlogForm, setEditBlogForm] = useState(initialBlogForm);
  const [statsError, setStatsError] = useState('');
  const [bookError, setBookError] = useState('');
  const [chapterError, setChapterError] = useState('');
  const [booksError, setBooksError] = useState('');
  const [blogError, setBlogError] = useState('');
  const [blogListError, setBlogListError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');
  const [chapterSuccess, setChapterSuccess] = useState('');
  const [booksSuccess, setBooksSuccess] = useState('');
  const [blogSuccess, setBlogSuccess] = useState('');
  const [blogListSuccess, setBlogListSuccess] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [submittingBook, setSubmittingBook] = useState(false);
  const [submittingChapter, setSubmittingChapter] = useState(false);
  const [submittingBlog, setSubmittingBlog] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingBlogEdit, setSavingBlogEdit] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState('');
  const [deletingBlogId, setDeletingBlogId] = useState('');

  const chapterSlugPreview = useMemo(() => slugifyPreview(chapterForm.title || `chapter-${chapterForm.chapterNumber || 'new'}`), [chapterForm.chapterNumber, chapterForm.title]);
  const blogSlugPreview = useMemo(() => slugifyPreview(blogForm.title || 'new-blog-post'), [blogForm.title]);
  const editBlogSlugPreview = useMemo(() => slugifyPreview(editBlogForm.title || 'updated-blog-post'), [editBlogForm.title]);

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

  const loadBlogs = useCallback(async () => {
    setLoadingBlogs(true);
    setBlogListError('');

    try {
      const { data } = await api.get('/admin/blogs', { headers: getAuthHeaders() });
      setBlogPosts(data.data || []);
    } catch (error) {
      setBlogPosts([]);
      setBlogListError(error.message || 'Failed to load blog posts.');
    } finally {
      setLoadingBlogs(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadBooks();
    loadBlogs();
  }, [loadBlogs, loadBooks, loadStats]);

  const handleBookChange = (field, value) => {
    setBookForm((current) => ({ ...current, [field]: value }));
  };

  const handleChapterChange = (field, value) => {
    setChapterForm((current) => ({ ...current, [field]: value }));
  };

  const handleBlogChange = (field, value) => {
    setBlogForm((current) => ({ ...current, [field]: value }));
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

  const submitBlog = async (event) => {
    event.preventDefault();
    setBlogError('');
    setBlogSuccess('');

    try {
      setSubmittingBlog(true);
      await api.post(
        '/admin/blogs',
        {
          title: blogForm.title.trim(),
          description: blogForm.description.trim(),
          coverImage: blogForm.coverImage.trim(),
          content: blogForm.content.trim()
        },
        { headers: getAuthHeaders() }
      );

      setBlogSuccess('Blog published successfully and is now live.');
      setBlogForm(initialBlogForm);
      await Promise.all([loadStats(), loadBlogs()]);
    } catch (error) {
      setBlogError(error.message || 'Failed to publish blog.');
    } finally {
      setSubmittingBlog(false);
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

  const startEditingBlog = (post) => {
    setBlogListSuccess('');
    setBlogListError('');
    setEditingBlogId(post._id);
    setEditBlogForm({
      title: post.title || '',
      description: post.description || '',
      coverImage: post.coverImage || '',
      content: post.content || ''
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

  const saveBlogEdit = async (blogId) => {
    setBlogListError('');
    setBlogListSuccess('');

    try {
      setSavingBlogEdit(true);
      await api.put(
        `/admin/blogs/${blogId}`,
        {
          title: editBlogForm.title.trim(),
          description: editBlogForm.description.trim(),
          coverImage: editBlogForm.coverImage.trim(),
          content: editBlogForm.content.trim()
        },
        { headers: getAuthHeaders() }
      );

      setEditingBlogId('');
      setBlogListSuccess('Blog updated and republished successfully.');
      await Promise.all([loadStats(), loadBlogs()]);
    } catch (error) {
      setBlogListError(error.message || 'Failed to update blog.');
    } finally {
      setSavingBlogEdit(false);
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

  const deleteBlog = async (blogId) => {
    setBlogListError('');
    setBlogListSuccess('');

    try {
      setDeletingBlogId(blogId);
      await api.delete(`/admin/blogs/${blogId}`, { headers: getAuthHeaders() });
      setBlogListSuccess('Blog deleted successfully.');
      if (editingBlogId === blogId) {
        setEditingBlogId('');
      }
      await Promise.all([loadStats(), loadBlogs()]);
    } catch (error) {
      setBlogListError(error.message || 'Failed to delete blog.');
    } finally {
      setDeletingBlogId('');
    }
  };

  return (
    <Layout>
      <section className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Manage books, chapters, and live blog content from one clean publishing workspace.
          </p>
        </div>
      </section>

      {statsError && <p className={ALERT_ERROR_CLASS}>{statsError}</p>}
      {booksError && <p className={ALERT_ERROR_CLASS}>{booksError}</p>}
      {booksSuccess && <p className={ALERT_SUCCESS_CLASS}>{booksSuccess}</p>}
      {blogListError && <p className={ALERT_ERROR_CLASS}>{blogListError}</p>}
      {blogListSuccess && <p className={ALERT_SUCCESS_CLASS}>{blogListSuccess}</p>}

      {loadingStats ? (
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-300">Loading admin analytics...</p>
      ) : stats ? (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Books" value={stats.totalBooks} />
          <StatCard label="Chapters" value={stats.totalChapters} />
          <StatCard label="Blogs" value={stats.totalBlogs || 0} />
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
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Add Blog</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Paste the content, review the auto-generated slug, and publish instantly without touching code.</p>
        </div>

        {blogError && <p className={ALERT_ERROR_CLASS}>{blogError}</p>}
        {blogSuccess && <p className={ALERT_SUCCESS_CLASS}>{blogSuccess}</p>}

        <form onSubmit={submitBlog} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Title</label>
              <input className={INPUT_CLASS} type="text" value={blogForm.title} onChange={(event) => handleBlogChange('title', event.target.value)} placeholder="Blog headline" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <textarea className={`${TEXTAREA_CLASS} min-h-[110px]`} value={blogForm.description} onChange={(event) => handleBlogChange('description', event.target.value)} placeholder="Short SEO-friendly summary" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Cover Image URL</label>
              <input className={INPUT_CLASS} type="url" value={blogForm.coverImage} onChange={(event) => handleBlogChange('coverImage', event.target.value)} placeholder="https://example.com/blog-cover.jpg" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Content</label>
              <textarea className={`${TEXTAREA_CLASS} min-h-[260px]`} value={blogForm.content} onChange={(event) => handleBlogChange('content', event.target.value)} placeholder="Paste blog content here. Use blank lines for new paragraphs." required />
            </div>

            <button type="submit" disabled={submittingBlog} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
              {submittingBlog ? 'Publishing...' : 'Publish Blog'}
            </button>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Generated slug</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-white">/blog/{blogSlugPreview || 'new-blog-post'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Live preview</p>
              <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <h3 className="text-lg font-semibold">{blogForm.title || 'Your blog title will appear here'}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{blogForm.description || 'Short description for SEO and the blog card preview.'}</p>
                <BlogContent content={blogForm.content || 'Paste content here to preview paragraph formatting.'} />
              </div>
            </div>
          </div>
        </form>
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

      <section className={`${CARD_CLASS} mt-8`}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Blog Management</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Edit, republish, or delete articles. Published updates go live instantly.</p>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-300">{blogPosts.length} total</span>
        </div>

        {loadingBlogs ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading blog posts...</p>
        ) : blogPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            No blog posts published yet.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {blogPosts.map((post) => {
              const isEditing = editingBlogId === post._id;
              return (
                <article key={post._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <div className="space-y-4 p-4">
                    <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={isEditing ? editBlogForm.coverImage || post.coverImage : post.coverImage} alt={`${post.title} cover`} className="h-full w-full object-cover" loading="lazy" />
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <input className={INPUT_CLASS} type="text" value={editBlogForm.title} onChange={(event) => setEditBlogForm((current) => ({ ...current, title: event.target.value }))} placeholder="Blog title" />
                        <textarea className={`${TEXTAREA_CLASS} min-h-[110px]`} value={editBlogForm.description} onChange={(event) => setEditBlogForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
                        <input className={INPUT_CLASS} type="url" value={editBlogForm.coverImage} onChange={(event) => setEditBlogForm((current) => ({ ...current, coverImage: event.target.value }))} placeholder="Cover image URL" />
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                          Generated slug: <span className="font-semibold text-slate-900 dark:text-white">/blog/{editBlogSlugPreview || 'updated-blog-post'}</span>
                        </div>
                        <textarea className={`${TEXTAREA_CLASS} min-h-[220px]`} value={editBlogForm.content} onChange={(event) => setEditBlogForm((current) => ({ ...current, content: event.target.value }))} placeholder="Blog content" />
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                          <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Content preview</p>
                          <BlogContent content={editBlogForm.content} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => saveBlogEdit(post._id)} disabled={savingBlogEdit} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-60">
                            {savingBlogEdit ? 'Publishing...' : 'Save & Publish'}
                          </button>
                          <button type="button" onClick={() => setEditingBlogId('')} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Published {formatDate(post.publishedAt)}</p>
                          <h3 className="text-xl font-semibold">{post.title}</h3>
                          <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{post.description}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Slug: /blog/{post.slug}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => startEditingBlog(post)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:hover:border-sky-400 dark:hover:text-sky-300">
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteBlog(post._id)} disabled={deletingBlogId === post._id} className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10">
                            {deletingBlogId === post._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </>
                    )}
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
