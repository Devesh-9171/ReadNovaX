import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    api
      .get('/user/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMe(res.data))
      .catch((err) => setError(err.message || 'Failed to load profile'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reader Profile</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage your account and quickly sign out when you are done.</p>
        </div>
        <button type="button" onClick={handleLogout} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-red-400 hover:text-red-500 dark:border-slate-700 dark:hover:border-red-400 dark:hover:text-red-300">
          Logout
        </button>
      </div>

      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
      {!me ? (
        <p>Please login to view your profile.</p>
      ) : (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p><strong>{me.username}</strong> ({me.email})</p>
          <section>
            <h2 className="font-semibold">Favorite Books</h2>
            <ul className="list-disc pl-5">{(me.favoriteBooks || []).map((book) => <li key={book._id}>{book.title}</li>)}</ul>
          </section>
          <section>
            <h2 className="font-semibold">Bookmarks</h2>
            <ul className="list-disc pl-5">{(me.bookmarks || []).map((chapter) => <li key={chapter._id}>{chapter.title}</li>)}</ul>
          </section>
        </div>
      )}
    </Layout>
  );
}
