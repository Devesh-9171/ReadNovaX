import Image from 'next/image';
import Layout from '../../components/Layout';
import SeoHead from '../../components/SeoHead';
import BlogContent from '../../components/BlogContent';
import api from '../../utils/api';
import { buildMeta } from '../../utils/seo';

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

export default function BlogPostPage({ post, error }) {
  if (error || !post) {
    return (
      <Layout>
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error || 'Blog post not found.'}</p>
      </Layout>
    );
  }

  const meta = buildMeta({
    title: `${post.title} | ReadNovaX Blog`,
    description: post.description,
    image: post.coverImage,
    path: `/blog/${post.slug}`
  });

  return (
    <Layout>
      <SeoHead
        {...meta}
        type="article"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          image: post.coverImage,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          mainEntityOfPage: meta.url,
          publisher: {
            '@type': 'Organization',
            name: 'ReadNovaX'
          }
        }}
      />

      <article className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-brand-600 dark:text-sky-300">ReadNovaX Blog</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 dark:text-slate-300">{post.description}</p>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Published {formatDate(post.publishedAt)}</p>
        </header>

        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 896px" priority />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8">
          <BlogContent content={post.content} />
        </div>
      </article>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { data } = await api.get(`/blog/${params.slug}`);
    return { props: { post: data.post || null, error: null } };
  } catch (error) {
    return { props: { post: null, error: error.message } };
  }
}
