# NarrativaX

NarrativaX is a full-stack starter project for sharing short story ideas and collecting likes from readers.

## Project structure

- `backend/` — Express API with in-memory story storage.
- `frontend/` — React + Vite user interface.

## Quick start

```bash
npm run install:all
```

### Run backend

```bash
npm run dev:backend
```

Backend URL: `http://localhost:4000`

### Run frontend

```bash
npm run dev:frontend
```

Frontend URL: `http://localhost:5173`

The frontend calls the backend using `VITE_API_BASE_URL`. By default it targets `http://localhost:4000`.

## API endpoints

- `GET /health`
- `GET /api/stories`
- `POST /api/stories`
- `POST /api/stories/:id/like`

## Notes

The data layer is intentionally in-memory for rapid prototyping. Replace it with a database when moving to production.
