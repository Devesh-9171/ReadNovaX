import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function App() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    author: '',
    genre: '',
    synopsis: ''
  });

  const totalLikes = useMemo(
    () => stories.reduce((acc, story) => acc + story.likes, 0),
    [stories]
  );

  async function fetchStories() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/stories`);
      if (!res.ok) throw new Error('Failed to load stories');
      const data = await res.json();
      setStories(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStories();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function addStory(event) {
    event.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create story');
      }

      const created = await res.json();
      setStories((prev) => [created, ...prev]);
      setForm({ title: '', author: '', genre: '', synopsis: '' });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function likeStory(id) {
    try {
      const res = await fetch(`${API_BASE}/api/stories/${id}/like`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Could not like this story');
      const updated = await res.json();
      setStories((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (likeError) {
      setError(likeError.message);
    }
  }

  return (
    <main className="app-shell">
      <header>
        <h1>NarrativaX</h1>
        <p>Discover, publish, and celebrate original stories.</p>
      </header>

      <section className="stats">
        <article>
          <h2>{stories.length}</h2>
          <p>Stories</p>
        </article>
        <article>
          <h2>{totalLikes}</h2>
          <p>Total Likes</p>
        </article>
      </section>

      <section className="panel">
        <h3>Publish a story</h3>
        <form onSubmit={addStory} className="story-form">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Story title"
            required
          />
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder="Author"
            required
          />
          <input
            name="genre"
            value={form.genre}
            onChange={handleChange}
            placeholder="Genre"
            required
          />
          <textarea
            name="synopsis"
            value={form.synopsis}
            onChange={handleChange}
            placeholder="Synopsis"
            required
            rows={4}
          />
          <button type="submit">Publish</button>
        </form>
      </section>

      <section className="panel">
        <h3>Story feed</h3>
        {loading ? <p>Loading stories...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="story-grid">
          {stories.map((story) => (
            <article className="story-card" key={story.id}>
              <h4>{story.title}</h4>
              <p className="meta">
                {story.author} · {story.genre}
              </p>
              <p>{story.synopsis}</p>
              <button type="button" onClick={() => likeStory(story.id)}>
                ❤️ {story.likes}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
