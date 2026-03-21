import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import BlogContent from '../../components/BlogContent';
import RichTextEditor from '../../components/RichTextEditor';
import { plainTextToRichHtml } from '../../utils/html';

const INPUT_CLASS = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-400/10';
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[120px]`;
const CARD_CLASS = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950';
const ALERT_ERROR_CLASS = 'mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200';
const ALERT_SUCCESS_CLASS = 'mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200';
const CATEGORY_OPTIONS = ['action', 'romance', 'comedy', 'mystery', 'finance'];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' }
];

const initialBookForm = {
  title: '',
  author: '',
  description: '',
  category: CATEGORY_OPTIONS[0],
  coverImage: '',
  language: 'en',
  groupId: ''
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
  contentHtml: '<p></p>'
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

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function extractPlainText(html) {
  if (typeof window === 'undefined') {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const container = document.createElement('div');
  container.innerHTML = html || '';
  return container.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function EmptyAdminState() {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-sky-300">Admin access</p>
        <h1 className="mt-3 text-3xl font-bold">Please login as admin to access this page</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The dashboard stays hidden until a valid admin session is available. Once you login, publishing and analytics tools will appear here.
        </p>
        <Link href="/auth/login" className="mt-6 inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-white transition hover:bg-brand-500">
          Go to login
        </Link>
      </div>
    </Layout>
  );
}

export default function AdminPage() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  useEffect(() => {
    setIsReady(true);
    setIsAuthenticated(Boolean(getToken()));
  }, []);

  const chapterSlugPreview = useMemo(() => slugifyPreview(chapterForm.title || `chapter-${chapterForm.chapterNumber || 'new'}`), [chapterForm.chapterNumber, chapterForm.title]);
  const blogSlugPreview = useMemo(() => slugifyPreview(blogForm.title || 'new-blog-post'), [blogForm.title]);
  const editBlogSlugPreview = useMemo(() => slugifyPreview(editBlogForm.title || 'updated-blog-post'), [editBlogForm.title]);

  const resetMessages = () => {
    setFormError('');
    setListError('');
    setSuccessMessage('');
  };

  const loadDashboard = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setLoadingStats(false);
      setLoadingBooks(false);
      setLoadingBlogs(false);
      return;
    }

    setLoadingStats(true);
    setLoadingBooks(true);
    setLoadingBlogs(true);
    setFormError('');
    setListError('');

    try {
      const [statsResponse, booksResponse, blogsResponse] = await Promise.all([
        api.get('/admin/stats', { headers }),
        api.get('/books', { params: { limit: 100 } }),
        api.get('/admin/blogs', { headers })
      ]);

      const nextBooks = booksResponse.data.data || [];
      setStats(statsResponse.data);
      setBooks(nextBooks);
      setBlogPosts(blogsResponse.data.data || []);
      setChapterForm((current) => ({
        ...current,
        bookId: current.bookId || nextBooks[0]?._id || ''
      }));
    } catch (error) {
      setStats(null);
      setBooks([]);
      setBlogPosts([]);
      setListError(error.message || 'Could not load the admin workspace.');
    } finally {
      setLoadingStats(false);
      setLoadingBooks(false);
      setLoadingBlogs(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboard();
  }, [isAuthenticated, loadDashboard]);

  const submitBook = async (event) => {
    event.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;
    resetMessages();

    try {
      setSubmittingBook(true);
      await api.post('/books', {
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        description: bookForm.description.trim(),
        category: bookForm.category.trim(),
        coverImage: bookForm.coverImage.trim(),
        language: bookForm.language,
        groupId: bookForm.groupId || undefined
      }, { headers });

      setSuccessMessage('Book saved successfully.');
      setBookForm(initialBookForm);
      await loadDashboard();
    } catch (error) {
      setFormError(error.message || 'Failed to save the book.');
    } finally {
      setSubmittingBook(false);
    }
  };

  const submitChapter = async (event) => {
    event.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;
    resetMessages();

    try {
      setSubmittingChapter(true);
      await api.post('/chapters', {
        bookId: chapterForm.bookId,
        chapterNumber: Number(chapterForm.chapterNumber),
        title: chapterForm.title.trim(),
        content: chapterForm.content.trim()
      }, { headers });

      setSuccessMessage('Chapter added successfully.');
      setChapterForm((current) => ({ ...initialChapterForm, bookId: current.bookId }));
      await loadDashboard();
    } catch (error) {
      setFormError(error.message || 'Failed to add the chapter.');
    } finally {
      setSubmittingChapter(false);
    }
  };

  const submitBlog = async (event) => {
    event.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;
    resetMessages();

    try {
      setSubmittingBlog(true);
      await api.post('/admin/blogs', {
        title: blogForm.title.trim(),
        description: blogForm.description.trim(),
        coverImage: blogForm.coverImage.trim(),
        contentHtml: blogForm.contentHtml,
        content: extractPlainText(blogForm.contentHtml)
      }, { headers });

      setSuccessMessage('Blog published successfully.');
      setBlogForm(initialBlogForm);
      await loadDashboard();
    } catch (error) {
      setFormError(error.message || 'Failed to publish the blog.');
    } finally {
      setSubmittingBlog(false);
    }
  };

  const startEditingBook = (book) => {
    resetMessages();
    setEditingBookId(book._id);
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      category: book.category || CATEGORY_OPTIONS[0],
      coverImage: book.coverImage || '',
      language: book.language || 'en',
      groupId: book.groupId || ''
    });
  };

  const startEditingBlog = (post) => {
    resetMessages();
    setEditingBlogId(post._id);
    setEditBlogForm({
      title: post.title || '',
      description: post.description || '',
      coverImage: post.coverImage || '',
      contentHtml: post.contentHtml || plainTextToRichHtml(post.content || '')
    });
  };

  const saveBookEdit = async (bookId) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    resetMessages();

    try {
      setSavingEdit(true);
      await api.put(`/books/${bookId}`, {
        title: editForm.title.trim(),
        author: editForm.author.trim(),
        description: editForm.description.trim(),
        category: editForm.category.trim(),
        coverImage: editForm.coverImage.trim(),
        language: editForm.language,
        groupId: editForm.groupId || undefined
      }, { headers });
      setEditingBookId('');
      setSuccessMessage('Book updated successfully.');
      await loadDashboard();
    } catch (error) {
      setListError(error.message || 'Failed to update the book.');
    } finally {
      setSavingEdit(false);
    }
  };

  const saveBlogEdit = async (blogId) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    resetMessages();

    try {
      setSavingBlogEdit(true);
      await api.put(`/admin/blogs/${blogId}`, {
        title: editBlogForm.title.trim(),
        description: editBlogForm.description.trim(),
        coverImage: editBlogForm.coverImage.trim(),
        contentHtml: editBlogForm.contentHtml,
        content: extractPlainText(editBlogForm.contentHtml)
      }, { headers });
      setEditingBlogId('');
      setSuccessMessage('Blog updated successfully.');
      await loadDashboard();
    } catch (error) {
      setListError(error.message || 'Failed to update the blog.');
    } finally {
      setSavingBlogEdit(false);
    }
  };

  const deleteBook = async (bookId) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    resetMessages();

    try {
      setDeletingBookId(bookId);
      await api.delete(`/books/${bookId}`, { headers });
      setSuccessMessage('Book deleted successfully.');
      await loadDashboard();
    } catch (error) {
      setListError(error.message || 'Failed to delete the book.');
    } finally {
      setDeletingBookId('');
    }
  };

  const deleteBlog = async (blogId) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    resetMessages();

    try {
      setDeletingBlogId(blogId);
      await api.delete(`/admin/blogs/${blogId}`, { headers });
      setSuccessMessage('Blog deleted successfully.');
      await loadDashboard();
    } catch (error) {
      setListError(error.message || 'Failed to delete the blog.');
    } finally {
      setDeletingBlogId('');
    }
  };

  if (!isReady || !isAuthenticated) {
    return <EmptyAdminState />;
  }

  return (
    <Layout>
      <section className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Clean publishing controls for books, chapters, blog posts, and multilingual content.
          </p>
        </div>
      </section>

      {formError ? <p className={ALERT_ERROR_CLASS}>{formError}</p> : null}
      {listError ? <p className={ALERT_ERROR_CLASS}>{listError}</p> : null}
      {successMessage ? <p className={ALERT_SUCCESS_CLASS}>{successMessage}</p> : null}

      {loadingStats ? (
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-300">Loading admin analytics...</p>
      ) : stats ? (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Books" value={stats.totalBooks} />
          <StatCard label="Chapters" value={stats.totalChapters} />
          <StatCard label="Blogs" value={stats.totalBlogs || 0} />
          <StatCard label="Total Views" value={stats.totalViews} />
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={CARD_CLASS}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Add Book</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Publish a title in one language or connect it to an existing translation group.</p>
          </div>

          <form onSubmit={submitBook} className="space-y-4">
            <input className={INPUT_CLASS} type="text" value={bookForm.title} onChange={(event) => setBookForm((current) => ({ ...current, title: event.target.value }))} placeholder="Book title" required />
            <input className={INPUT_CLASS} type="text" value={bookForm.author} onChange={(event) => setBookForm((current) => ({ ...current, author: event.target.value }))} placeholder="Author" />
            <textarea className={TEXTAREA_CLASS} value={bookForm.description} onChange={(event) => setBookForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <select className={INPUT_CLASS} value={bookForm.category} onChange={(event) => setBookForm((current) => ({ ...current, category: event.target.value }))} required>
                {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <select className={INPUT_CLASS} value={bookForm.language} onChange={(event) => setBookForm((current) => ({ ...current, language: event.target.value }))}>
                {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <select className={INPUT_CLASS} value={bookForm.groupId} onChange={(event) => setBookForm((current) => ({ ...current, groupId: event.target.value }))}>
              <option value="">Create a new title group</option>
              {books.map((book) => <option key={book._id} value={book._id}>{book.title} ({(book.language || 'en').toUpperCase()})</option>)}
            </select>
            <input className={INPUT_CLASS} type="url" value={bookForm.coverImage} onChange={(event) => setBookForm((current) => ({ ...current, coverImage: event.target.value }))} placeholder="Cover image URL" required />
            <button type="submit" disabled={submittingBook} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
              {submittingBook ? 'Saving book...' : 'Save Book'}
            </button>
          </form>
        </div>

        <div className={CARD_CLASS}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Add Chapter</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Attach chapters to any published language version without requiring both translations.</p>
          </div>

          <form onSubmit={submitChapter} className="space-y-4">
            <select className={INPUT_CLASS} value={chapterForm.bookId} onChange={(event) => setChapterForm((current) => ({ ...current, bookId: event.target.value }))} required disabled={loadingBooks || books.length === 0}>
              <option value="">Select a book</option>
              {books.map((book) => <option key={book._id} value={book._id}>{book.title} ({(book.language || 'en').toUpperCase()})</option>)}
            </select>
            <input className={INPUT_CLASS} type="number" min="1" value={chapterForm.chapterNumber} onChange={(event) => setChapterForm((current) => ({ ...current, chapterNumber: event.target.value }))} placeholder="Chapter number" required />
            <input className={INPUT_CLASS} type="text" value={chapterForm.title} onChange={(event) => setChapterForm((current) => ({ ...current, title: event.target.value }))} placeholder="Chapter title" required />
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              Generated slug: <span className="font-semibold text-slate-900 dark:text-white">{chapterSlugPreview || 'chapter-preview'}</span>
            </div>
            <textarea className={`${TEXTAREA_CLASS} min-h-[240px]`} value={chapterForm.content} onChange={(event) => setChapterForm((current) => ({ ...current, content: event.target.value }))} placeholder="Write chapter content here" required />
            <button type="submit" disabled={submittingChapter || books.length === 0} className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
              {submittingChapter ? 'Saving chapter...' : 'Save Chapter'}
            </button>
          </form>
        </div>
      </section>

      <section className={`${CARD_CLASS} mt-8`}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Blog Editor</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use bold, italic, lists, and the 🔗 link button to create SEO-friendly internal or external links.</p>
        </div>

        <form onSubmit={submitBlog} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <input className={INPUT_CLASS} type="text" value={blogForm.title} onChange={(event) => setBlogForm((current) => ({ ...current, title: event.target.value }))} placeholder="Blog title" required />
            <textarea className={`${TEXTAREA_CLASS} min-h-[110px]`} value={blogForm.description} onChange={(event) => setBlogForm((current) => ({ ...current, description: event.target.value }))} placeholder="SEO description" required />
            <input className={INPUT_CLASS} type="url" value={blogForm.coverImage} onChange={(event) => setBlogForm((current) => ({ ...current, coverImage: event.target.value }))} placeholder="Cover image URL" required />
            <RichTextEditor label="Content" value={blogForm.contentHtml} onChange={(value) => setBlogForm((current) => ({ ...current, contentHtml: value }))} placeholder="Write your article, then use 🔗 to add internal links like /blog/my-post or external URLs." minHeight={320} />
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
                <p className="text-sm text-slate-600 dark:text-slate-300">{blogForm.description || 'Short description for SEO and blog cards.'}</p>
                <BlogContent html={blogForm.contentHtml} />
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className={`${CARD_CLASS} mt-8`}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Books List</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review language versions, translation groups, and existing metadata.</p>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-300">{books.length} total</span>
        </div>

        {loadingBooks ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading books...</p>
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
                        <>
                          <input className={INPUT_CLASS} type="text" value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
                          <input className={INPUT_CLASS} type="text" value={editForm.author} onChange={(event) => setEditForm((current) => ({ ...current, author: event.target.value }))} />
                          <textarea className={TEXTAREA_CLASS} value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <select className={INPUT_CLASS} value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}>
                              {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                            <select className={INPUT_CLASS} value={editForm.language} onChange={(event) => setEditForm((current) => ({ ...current, language: event.target.value }))}>
                              {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </div>
                          <select className={INPUT_CLASS} value={editForm.groupId} onChange={(event) => setEditForm((current) => ({ ...current, groupId: event.target.value }))}>
                            <option value="">Standalone group</option>
                            {books.map((optionBook) => <option key={optionBook._id} value={optionBook._id}>{optionBook.title} ({(optionBook.language || 'en').toUpperCase()})</option>)}
                          </select>
                          <input className={INPUT_CLASS} type="url" value={editForm.coverImage} onChange={(event) => setEditForm((current) => ({ ...current, coverImage: event.target.value }))} />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => saveBookEdit(book._id)} disabled={savingEdit} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-60">{savingEdit ? 'Saving...' : 'Save'}</button>
                            <button type="button" onClick={() => setEditingBookId('')} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700">Cancel</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-lg font-semibold">{book.title}</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
                          </div>
                          <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{book.description || 'No description available.'}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 dark:bg-slate-800">{book.category}</span>
                            <span>{(book.language || 'en').toUpperCase()}</span>
                            <span>Group: {book.groupId || 'legacy'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => startEditingBook(book)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:hover:border-sky-400 dark:hover:text-sky-300">Edit</button>
                            <button type="button" onClick={() => deleteBook(book._id)} disabled={deletingBookId === book._id} className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10">{deletingBookId === book._id ? 'Deleting...' : 'Delete'}</button>
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
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Edit rich content safely and keep internal links clickable on the frontend.</p>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-300">{blogPosts.length} total</span>
        </div>

        {loadingBlogs ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading blog posts...</p>
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
                        <input className={INPUT_CLASS} type="text" value={editBlogForm.title} onChange={(event) => setEditBlogForm((current) => ({ ...current, title: event.target.value }))} />
                        <textarea className={`${TEXTAREA_CLASS} min-h-[110px]`} value={editBlogForm.description} onChange={(event) => setEditBlogForm((current) => ({ ...current, description: event.target.value }))} />
                        <input className={INPUT_CLASS} type="url" value={editBlogForm.coverImage} onChange={(event) => setEditBlogForm((current) => ({ ...current, coverImage: event.target.value }))} />
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                          Generated slug: <span className="font-semibold text-slate-900 dark:text-white">/blog/{editBlogSlugPreview || 'updated-blog-post'}</span>
                        </div>
                        <RichTextEditor label="Content" value={editBlogForm.contentHtml} onChange={(value) => setEditBlogForm((current) => ({ ...current, contentHtml: value }))} minHeight={280} />
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                          <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Content preview</p>
                          <BlogContent html={editBlogForm.contentHtml} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => saveBlogEdit(post._id)} disabled={savingBlogEdit} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-60">{savingBlogEdit ? 'Publishing...' : 'Save & Publish'}</button>
                          <button type="button" onClick={() => setEditingBlogId('')} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700">Cancel</button>
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
                          <button type="button" onClick={() => startEditingBlog(post)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:hover:border-sky-400 dark:hover:text-sky-300">Edit</button>
                          <button type="button" onClick={() => deleteBlog(post._id)} disabled={deletingBlogId === post._id} className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10">{deletingBlogId === post._id ? 'Deleting...' : 'Delete'}</button>
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
