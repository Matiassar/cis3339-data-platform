# CIS 3339 Data Platform

A MEVN (MongoDB, Express, Vue 3, Node.js) web application that helps nonprofit organizations and their Community Health Workers record clients, offer services, run events, and register clients for those events. A dashboard summarizes recent event attendance and clients by ZIP code.

One database supports multiple organizations; each running instance is configured for a single organization through `ORG_ID`.

The assignment and task list are in [`Project-README.md`](Project-README.md).

## Credits

This project has been developed over time by students in the CIS 4339 course. The template this team started from was based on work by:

- Jeremy Griffith and Edwin Charly (Spring 2023)
- Elliot Farmer Garcia, Agatha Molski, and Chris Blanco (Fall 2022)

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | **22 or 24 (LTS)**, as used by the team and CI. Check with `node --version`. |
| npm | Comes with Node.js |
| Git | Any recent version |
| MongoDB | A MongoDB Atlas cluster (the committed `backend/.env` already points to the course cluster) |

## Repository layout

```text
backend/                 Express REST API
  app.js                 App setup, database connection, routes
  auth/                  JWT authentication middleware
  models/                Mongoose schemas
  routes/                Client, event, service, org, and user routes
  scripts/dev-seed.js    Creates the org, demo users, and sample data
frontend/                Vue 3 single-page app (Vite, Pinia, Vue Router, Tailwind)
  src/api/api.js         Axios client + the one error-handling interceptor
  src/composables/       Shared logic (useApi)
  src/utils/             Shared helpers (formatDate)
  src/views/             Pages
  src/components/        Charts and reusable components
.github/                 CI build check and pull request template
```

## Quick start

```powershell
git clone https://github.com/Matiassar/cis3339-data-platform.git
cd cis3339-data-platform
```

**Terminal 1: backend**

```powershell
cd backend
npm install
npm run seed:dev
npm start
```

You should see `Server listening on port 3000` and `Database connection Success!`.

**Terminal 2: frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> and log in with one of the demo users below.

> If `npm install` prints an `install-scripts` warning about **bcrypt**, run `npm rebuild bcrypt` in `backend/` before starting it.

> If the backend prints `querySrv ECONNREFUSED`, your network is blocking the DNS lookup used by `mongodb+srv://` addresses. The committed `MONGO_URL` already uses the standard `mongodb://` format that lists the cluster's servers directly, so pull the latest `main`; if you changed it locally, restore it with `git restore backend/.env`.

## Demo users

| Role | Username | Password | Can do |
| --- | --- | --- | --- |
| Viewer | `user` | `user` | View clients, events, services, and the dashboard |
| Editor | `admin` | `admin` | Everything a viewer can, plus create, edit, delete, and register clients for events |

Passwords are stored as bcrypt hashes; the plaintext values only exist in `backend/.env` for the seed script.

## Environment files

The real `.env` files are **not committed** (the repository is public). Copy the provided templates and fill in the values:

```powershell
# from the repo root
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

For grading, the working `backend/.env` and `frontend/.env` are **submitted separately via Canvas** — drop those files in place of the copied templates and the app runs with no further configuration. Every value in them was created only for this course project (a dedicated Atlas cluster, a database user limited to this project, and a random JWT secret), and will be rotated/removed after grading.

### `backend/.env`

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection string, including the `dataplatform` database name |
| `PORT` | Port the API listens on (`3000`) |
| `ORG_ID` | The organization this instance serves; every client, event, and service query is scoped to it |
| `JWT_SECRET` | Secret used to sign and verify login tokens |
| `CORS_ORIGIN` | The frontend origin allowed to call the API (`http://localhost:5173` in development) |
| `SEED_VIEWER_USERNAME` / `SEED_VIEWER_PASSWORD` | Viewer account created by the seed script |
| `SEED_EDITOR_USERNAME` / `SEED_EDITOR_PASSWORD` | Editor account created by the seed script |

### `frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_ROOT_API` | Base URL of the backend API, e.g. `http://localhost:3000` |

`VITE_ROOT_API` is read **when the app is built or the dev server starts**, not while it runs. After changing it, restart `npm run dev` or rebuild. `npm run build` fails with a clear message if it is missing, so a build can never silently point at the wrong server.

## Database setup

```powershell
cd backend
npm run seed:dev
```

This creates, in the database from `MONGO_URL`:

- the organization matching `ORG_ID`
- the `user` (viewer) and `admin` (editor) accounts, with bcrypt-hashed passwords
- 16 clients, 15 services, and 15 events with registrations (enough to test sorting and paging)

It is safe to run more than once: records are matched by a fixed key, so nothing is duplicated and nothing existing is deleted. It prints a summary such as `Seed complete: { users: 2, clients: 16, services: 15, events: 15 }`.

> `seed:dev` is the Sprint 2 stand-in. Sprint 3 (D1) replaces it with `npm run db:init`.

## Production build (D2)

```powershell
cd frontend
npm install
npm run build      # outputs static files to frontend/dist
npm run preview    # serves dist at http://localhost:4173
```

- `npm run build` must exit with code 0. CI runs it on every pull request.
- `npm run preview` (or the older alias `npm run serve`) serves the **production** build, not the dev server. Use it for demos.
- The backend must be running (and `CORS_ORIGIN` must allow the preview's origin) for the preview to load data.

## Tests (bonus)

```powershell
cd frontend
npm install
npm test           # runs once: 15 unit tests for useApi and the API error interceptor
npm run test:watch # re-runs on file changes while developing
```

- Tests use [Vitest](https://vitest.dev/) and live in `frontend/tests/`.
- The interceptor tests start a small fake HTTP server inside the test file, so **they never touch the team's backend or database**.
- CI runs `npm test` on every pull request, after the build.

## Deployment

`frontend/dist` is a static site and can be hosted on any static host (Netlify, Cloudflare Pages, Render static site, Apache, nginx, and so on).

1. Set `VITE_ROOT_API` to the **deployed backend URL** in the host's build settings (or in `frontend/.env`), then build with `npm run build`. Publish the `dist` folder.
2. Set the backend's `CORS_ORIGIN` to the **deployed frontend URL** so the browser is allowed to call the API.

### SPA fallback (required)

The app uses HTML5 history routing (`/clientdetails/123`, not `/#/clientdetails/123`). Those paths only exist inside the Vue app, so the host must answer **every unknown path with `index.html`**. Otherwise refreshing a page like `/clientdetails/123` returns 404.

- **Netlify / Cloudflare Pages:** already handled. `frontend/public/_redirects` (`/* /index.html 200`) is copied into `dist` on every build.
- **`npm run preview`:** handled automatically by Vite.
- **nginx:** `try_files $uri $uri/ /index.html;`
- **Apache:** `FallbackResource /index.html`
- **Render static site:** add a rewrite rule from `/*` to `/index.html`.

To verify: open the deployed (or previewed) site, go to a client's details page, and press F5. The same page should load.

## Development workflow

- Never push to `main`. Create a branch per task (`feature/f3-datatable`, `fix/...`), open a pull request, and include `Closes #<issue>` in the description.
- Every PR needs a green CI check (frontend build + unit tests + backend syntax check) and one teammate's approval.
- Merge with a regular **merge commit** so each person's commits stay in the history.
- Run `git switch main` and `git pull` before starting new work each day.

## Known limitations

- **Vite 3 and Vitest 0.25 advisories.** Dependabot reports advisories in Vite 3, its `launch-editor` helper, and Vitest's UI server. They affect only the local dev server (`npm run dev`) and the Vitest UI (`vitest --ui`, which this project never runs; tests use `vitest run`). The production build in `dist` is not affected. Don't expose the dev server with `--host`, and stop it when not in use. Upgrading Vite and Vitest (major-version changes) is planned for Sprint 3.
- **Backend authorization and organization isolation are not enforced yet.** Role checks and `withOrg` scoping are Sprint 3 work (S1); until then, editor-only rules are enforced in the UI only.
- **CORS still allows any origin** (`*`) until S1 locks it to `CORS_ORIGIN`.
- **The seed script is temporary** until D1 (`npm run db:init`).
- **Unused `uuid` dependency** in the backend has an open Dependabot advisory; it is not imported anywhere and will be removed.
- **Viewers can type into form fields on details pages,** but Update, Delete, and Register are disabled, so nothing is saved. Locking the fields themselves is a planned polish item.
- **Environment files are not in the repository.** Because the repo is public, `backend/.env` and `frontend/.env` are kept out of version control (`.gitignore`) and submitted via Canvas for grading instead. `.env.example` templates document the required variables. The credentials used earlier in the project (and still present in older git history) were rotated after the repo was made public, so the historical values no longer work. Safeguards remain in place: a dedicated course-only Atlas cluster, a least-privilege database user (`readWrite` on `dataplatform` only — no user/network/cluster management), and `npm run seed:dev` to restore data if needed. `main` is protected (pull request + passing CI required; no direct pushes or force-pushes).