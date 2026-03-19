import Link from 'next/link';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';
import BlogCard from '../components/BlogCard';
import SeoHead from '../components/SeoHead';
import AdSlot from '../components/AdSlot';
import api from '../utils/api';
import { buildMeta } from '../utils/seo';

export default function Home({ data, error, categories, latestBlogs }) {
  const meta = buildMeta({
    title: 'ReadNovaX - Read trending novels online',
    description: 'Discover trending books, latest chapters, and immersive reading on ReadNovaX.',
    image: '/images/logo.svg',
    path: '/'
  });

  const animatedTitle = 'Welcome to ReadNovaX';

  return (
    <Layout>
      <SeoHead {...meta} />
      <section className="brand-hero mb-8 rounded-2xl p-8 text-white">
        <h1 className="hero-title mb-2 text-3xl font-bold sm:text-4xl">
          {animatedTitle.split('').map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="hero-letter"
              style={{ animationDelay: `${index * 0.04}s` }}
              aria-hidden="true"
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
          <span className="sr-only">{animatedTitle}</span>
        </h1>
        <p className="mb-5 max-w-2xl">Featured novels updated daily with clean reading, bookmarks, and personalized progress.</p>
        <Link href="/category/action" className="rounded bg-white px-4 py-2 font-semibold text-blue-700">Start Reading</Link>
      </section>

      <AdSlot label="Top Banner Ad" className="mb-8" />

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 p-4 text-red-600">{error}</p>
      ) : (
        <>
          <Section title="Featured Novels" books={data.featured} />
          <Section title="Trending Books" books={data.trending} />
          <Section title="Popular Books" books={data.popular} />

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Latest Chapters</h2>
            <div className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {data.latestChapters.filter((chapter) => chapter.bookId).map((chapter) => (
                <Link key={chapter._id} className="block rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800" href={`/books/${chapter.bookId.slug}/${chapter.slug}`}>
                  {chapter.bookId.title} — Chapter {chapter.chapterNumber}: {chapter.title}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold">Categories</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link key={cat} href={`/category/${cat}`} className="rounded-full bg-slate-200 px-4 py-2 capitalize dark:bg-slate-800">
              {cat}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-brand-600 dark:text-sky-300">Latest Blog</p>
            <h2 className="text-2xl font-bold">Guides, updates, and reading inspiration</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Explore the newest articles published from the ReadNovaX admin panel—no code deployment required.</p>
          </div>
          <Link href="/blog" className="text-sm font-semibold text-brand-600 transition hover:text-brand-500 dark:text-sky-300 dark:hover:text-sky-200">
            View all posts →
          </Link>
        </div>

        {latestBlogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            Blog posts will appear here after publishing.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {latestBlogs.map((post, index) => <BlogCard key={post._id || post.slug} post={post} priority={index < 2} />)}
          </div>
        )}
      </section>
    </Layout>
  );
}

function Section({ title, books }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {books.map((book, index) => <BookCard key={book._id} book={book} priority={index < 2} />)}
      </div>
    </section>
  );
}

export async function getServerSideProps() {
  try {
    const [{ data }, { data: latestBlogData }] = await Promise.all([
      api.get('/books/homepage'),
      api.get('/blog/latest', { params: { limit: 4 } })
    ]);
    const categorySet = new Set();

    for (const group of [data.featured, data.trending, data.popular]) {
      for (const book of group || []) {
        if (book?.category) categorySet.add(book.category);
      }
    }

    return { props: { data, categories: Array.from(categorySet), latestBlogs: latestBlogData.data || [], error: null } };
  } catch (error) {
    return {
      props: {
        data: { featured: [], trending: [], popular: [], latestChapters: [] },
        categories: [],
        latestBlogs: [],
        error: error.message
      }
    };
  }
}
