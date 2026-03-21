import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import SeoHead from '../../../components/SeoHead';
import api from '../../../utils/api';
import { buildMeta } from '../../../utils/seo';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'HI' }
];

export default function BookPage({ book, chapters, translations = [], isFallback }) {
  const router = useRouter();

  if (!book) {
    return (
      <Layout>
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950/80">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">This book is still loading</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {isFallback ? 'The backend is waking up, so we are showing a safe empty state for now.' : 'We could not find this book yet.'}
          </p>
          <Link href="/" className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-white transition hover:bg-brand-500">
            Browse homepage
          </Link>
        </div>
      </Layout>
    );
  }

  const meta = buildMeta({
    title: `${book.title} by ${book.author} | ReadNovaX`,
    description: book.description,
    image: book.coverImage,
    path: `/book/${book.slug}${book.language === 'hi' ? '?lang=hi' : ''}`
  });

  const showLanguageSwitch = translations.length > 1;

  return (
    <Layout>
      <SeoHead
        {...meta}
        structuredData={{ '@context': 'https://schema.org', '@type': 'Book', name: book.title, author: book.author, aggregateRating: { '@type': 'AggregateRating', ratingValue: book.rating } }}
      />
      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
        <div className="relative h-80 w-full overflow-hidden rounded-3xl shadow-sm">
          <Image src={book.coverImage} alt={book.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 250px" priority />
        </div>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{book.title}</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">By {book.author}</p>
            </div>
            {showLanguageSwitch ? (
              <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900">
                {LANGUAGE_OPTIONS.map((option) => {
                  const translation = translations.find((item) => item.language === option.code);
                  if (!translation) return null;
                  const href = `/book/${book.slug}${option.code === 'hi' ? '?lang=hi' : ''}`;
                  const active = translation.language === book.language;
                  return (
                    <Link key={option.code} href={href} className={`rounded-full px-3 py-1.5 ${active ? 'bg-brand-600 text-white dark:bg-sky-400 dark:text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}>
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
          <p className="mt-4 max-w-2xl text-slate-700 dark:text-slate-200">{book.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
            <span>⭐ {book.rating}</span>
            <span>{book.totalViews.toLocaleString()} reads</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-[0.18em] dark:bg-slate-800">{book.language}</span>
          </div>
          {chapters[0] && (
            <Link href={`/book/${book.slug}/${chapters[0].slug}${book.language === 'hi' ? '?lang=hi' : ''}`} className="mt-5 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-white transition hover:bg-brand-500">
              Start Reading
            </Link>
          )}
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Chapters</h2>
          {router.query.lang ? <span className="text-sm text-slate-500 dark:text-slate-400">Language: {String(router.query.lang).toUpperCase()}</span> : null}
        </div>
        <div className="rounded-3xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {chapters.length > 0 ? chapters.map((chapter) => (
            <Link key={chapter._id} href={`/book/${book.slug}/${chapter.slug}${book.language === 'hi' ? '?lang=hi' : ''}`} className="block border-b border-slate-200 py-3 last:border-none dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Chapter {chapter.chapterNumber}</span>
              <span className="mt-1 block text-base">{chapter.title}</span>
            </Link>
          )) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chapter list will appear here once it finishes loading.</p>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps({ params, query }) {
  try {
    const { data } = await api.get(`/books/${params.slug}`, { params: { lang: query.lang || 'en' } });
    return { props: { ...data, isFallback: false } };
  } catch (_error) {
    return { props: { book: null, chapters: [], translations: [], isFallback: true } };
  }
}
