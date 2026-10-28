# Teammate Finder

A web app that helps University of Florida CS/CpE students find project teammates
based on availability, reliability, and working style, instead of random
assignment or a discussion post with no information behind it.

## Why

Group project teams are usually formed with little to no visibility into who a
teammate actually is: their schedule, how responsive they are, or whether they
follow through. Teammate Finder gives students a profile built around those
signals, lets them search for or post open roles on a project, and shows
reviews from past teammates instead of relying on self-reported claims alone.

## Features

- UF email sign-in with verification codes (no passwords)
- Student profiles: availability, weekly hours, response time, goal, pace, roles
- Create a project and invite specific students
- Browse open teams and request to join one
- Owners accept or decline invites and join requests
- Contact info (email) only unlocks between students who currently share a project
- Client-side matching: shared availability, role fit, goal, and pace

## Tech Stack

- **Backend:** Flask, SQLAlchemy, SQLite
- **Frontend:** React, TypeScript, Vite

## API Documentation

The full API contract, including request/response shapes, validation rules,
and privacy rules, is documented in `docs/data-model.md`. A suggested backend
build order is in `docs/backend-handoff.md`.

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and set `SECRET_KEY` to a random value, generate one with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Then run the server:

```bash
python run.py
```

The backend runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The frontend runs at `http://localhost:5173` and talks to the backend above.

### Seeding test data (optional)

```bash
cd backend
python seed.py
```

This creates a couple of test student accounts for local testing.

## Notes

- Email verification currently returns the code directly in the API response
  (`demoCode`) for local testing, since real email sending isn't set up yet.
- Run the backend and frontend servers at the same time, in two separate
  terminals, for the app to work end to end.
