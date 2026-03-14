import express from "express";
import cors from "cors";
import { stories, getNextId } from "./data.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/stories", (_req, res) => {
  res.json(stories);
});

app.post("/api/stories", (req, res) => {
  const { title, author, genre, synopsis } = req.body;

  if (!title || !author || !genre || !synopsis) {
    return res.status(400).json({ message: "All story fields are required." });
  }

  const newStory = {
    id: getNextId(),
    title,
    author,
    genre,
    synopsis,
    likes: 0
  };

  stories.unshift(newStory);
  return res.status(201).json(newStory);
});

app.post("/api/stories/:id/like", (req, res) => {
  const id = Number(req.params.id);
  const story = stories.find((item) => item.id === id);

  if (!story) {
    return res.status(404).json({ message: "Story not found." });
  }

  story.likes += 1;
  return res.json(story);
});

app.listen(PORT, () => {
  console.log(`NarrativaX API running on http://localhost:${PORT}`);
});
