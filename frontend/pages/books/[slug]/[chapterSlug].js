import ChapterReaderPage from '../../../components/ChapterReaderPage';
import api from '../../../utils/api';

function buildChapterPath(book, chapter, language = book?.language || 'en') {
  if (!book || !chapter) return '/';
  return `/book/${book.slug}/${chapter.slug}${language === 'hi' ? '?lang=hi' : ''}`;
}

export default ChapterReaderPage;

export async function getServerSideProps({ params, query, resolvedUrl }) {
  try {
    const requestedLanguage = query.lang || 'en';
    const { data } = await api.get(`/chapters/${params.slug}/${params.chapterSlug}`, { params: { lang: requestedLanguage } });
    const canonicalPath = buildChapterPath(data.book, data.chapter, data.book?.language || requestedLanguage);

    if (data.book && data.chapter && resolvedUrl !== canonicalPath) {
      return {
        redirect: {
          destination: canonicalPath,
          permanent: true
        }
      };
    }

    return { props: { ...data, isFallback: false } };
  } catch (_error) {
    return {
      props: {
        book: null,
        chapter: null,
        chapters: [],
        previousChapter: null,
        nextChapter: null,
        translations: [],
        chapterTranslations: [],
        isFallback: true
      }
    };
  }
}
