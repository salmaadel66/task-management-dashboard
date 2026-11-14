# Task Management Dashboard

A task management dashboard built with **Angular 22**. It uses standalone components, Signals, the new `httpResource` API, Angular Material and a JSON Server mock backend.

**Live Demo:** https://salmaadel66.github.io/task-management-dashboard/

> The live demo has no backend server. A mock HTTP interceptor answers the API requests in the browser. See [Live Demo Backend](#live-demo-backend) for everything we tried and why.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Setup and Installation](#3-setup-and-installation)
4. [Environment Configuration](#4-environment-configuration)
5. [Available Scripts and Commands](#5-available-scripts-and-commands)
6. [Design Patterns and State Management](#6-design-patterns-and-state-management)
7. [Performance Optimization Techniques](#7-performance-optimization-techniques)
8. [Known Limitations and Future Improvements](#8-known-limitations-and-future-improvements)

---

## 1. Project Overview

The app lets a team create, organize and track tasks on a Kanban-style board, and see an overview of the workload.

### Features

**Task management**

- Create and edit tasks in a modal: title, description, priority, status, due date, assignee and tags.
- Delete tasks after a confirmation dialog.
- Filter by status (To Do / In Progress / Done), priority and assignee.
- Real-time search across titles and descriptions from the header. The search term is kept in the URL (`?search=`).
- Drag and drop to reorder tasks and move them between status columns.

**Dashboard**

- Statistics cards: total, completed, in progress and overdue tasks, with a loading spinner.
- Analytics page: donut charts of tasks by status and by priority, and a recent activity feed.
- Team page: list of users with their task counts, plus a shortcut to assign a new task to a user.

**Cross-cutting**

- English and Arabic, with full RTL support.
- Responsive layout from mobile to desktop, using the desktop design as the base.
- Loading, error and retry states on every page.
- Accessibility fixes from a Lighthouse and WCAG 2.1 AA audit.

### Tech Stack

| Concern       | Choice                       | Reason                                                                      |
| ------------- | ---------------------------- | --------------------------------------------------------------------------- |
| Framework     | Angular 22                   | Standalone APIs, Signals, `httpResource`, built-in control flow             |
| UI components | Angular Material + CDK       | Accessible widgets with focus trap and ARIA; CDK covers drag & drop and RTL |
| Layout grid   | Bootstrap 5 (CSS only)       | Grid and spacing utilities, no Bootstrap JavaScript                         |
| Charts        | ApexCharts (`ng-apexcharts`) | Responsive donut charts with legends out of the box                         |
| i18n          | ngx-translate                | Switches language at runtime with one build                                 |
| Mock backend  | JSON Server                  | Real REST endpoints (`POST`, `PUT`, `DELETE`) persisted to `moks/db.json`   |
| Unit tests    | Vitest + jsdom               | Default runner of the Angular CLI; fast, Jest-compatible API                |
| Formatting    | Prettier                     | One formatting standard, with the Angular HTML parser                       |

---

## 2. Architecture Decisions

### Folder Structure

```
src/
├── app/
│   ├── core/                       # Singletons with no UI
│   │   ├── environments/           # environment.ts
│   │   ├── interceptors/           # cache.interceptor.ts, retry.interceptor.ts
│   │   ├── interfaces/             # Task, User, Statistic
│   │   └── services/               # language.service.ts
│   ├── layout/                     # App shell: layout, header, sidebar
│   ├── pages/                      # One lazy-loaded folder per route
│   │   ├── dashboard/              #   + services/statistics.service.ts
│   │   ├── tasks/                  #   + services/tasks.service.ts, task-form/, task-card/
│   │   ├── analytics/
│   │   └── team/
│   ├── shared/                     # Feature-agnostic UI (confirmation-dialog)
│   ├── app.config.ts               # Root providers
│   └── app.routes.ts               # Lazy routes
├── styles/                         # Global SCSS (ITCSS layers)
└── styles.scss                     # Global styles entry point
moks/db.json                        # JSON Server database
public/assets/i18n/                 # en.json, ar.json
```

Dependencies go in one direction: `pages` → `shared` → `core`. `core` doesn't import anything from features, and `shared` doesn't know about tasks or users. A service sits inside the page folder that owns it (for example `pages/tasks/services/`). It moves to `core` only when it becomes app-wide, like `LanguageService`.

### Key Decisions

**1. Standalone components and lazy routes**
No `NgModule`s. Each page is loaded with `loadComponent`, so every route becomes its own JavaScript chunk.
_Trade-off:_ each component lists its own `imports`, which is more verbose but shows its dependencies explicitly.

**2. Signals instead of a state library (NgRx)**
The state is small: one task list, one statistics list and a few filters. `signal` and `computed` handle it without actions, reducers or effects.
_Trade-off:_ there are no Redux DevTools or time-travel debugging. If the app grows to many features sharing complex state, a Signal Store would be the next step.

**3. `httpResource` for reads, `HttpClient` for writes**
`httpResource` exposes `value()`, `isLoading()`, `error()` and `reload()` as signals, so loading, error and retry UI are simple template branches. It is designed for reading data. Create, update and delete use `HttpClient`, and then call `reload()` on the resource.

**4. One shared resource per entity**
`TasksService.tasks` is a single resource provided in root. Dashboard, Tasks, Analytics and Team all read the same instance, so a change made on one page shows up everywhere.

**5. Caching and retry as functional interceptors**
Caching and retry logic live in the HTTP layer, so services stay simple and every request gets the same behavior. See [6.5 HTTP Layer](#65-http-layer).

**6. The URL as the source of truth for search**
The header writes `?search=` and the Tasks page reads it with `toSignal(route.queryParams)`. Search survives a page refresh, can be shared as a link, and the header and the board don't need a shared service.

**7. Runtime i18n with ngx-translate**
`@angular/localize` needs a separate build per language. ngx-translate switches language instantly from JSON files. `LanguageService` also sets `<html lang dir>` and the CDK `Directionality`, so Material menus, dialogs and drag & drop flip correctly in RTL.

**8. Styling: Angular Material + an ITCSS SCSS architecture**
Material provides behavior and accessibility. The visual design comes from CSS custom properties in `styles/theme/` (colors, fonts, sizes, motion). Global SCSS is split into ITCSS-style folders (settings, tools, generic, elements, packages, components, theme, utilities) with BEM naming (`c-button`, `u-visually-hidden`, `is-*` states). Component-specific styles stay in each component's own `.scss` file. All spacing uses logical properties (`margin-inline-start`, `padding-block`), which is what makes RTL work with no extra CSS.

---

## 3. Setup and Installation

### Prerequisites

- Node.js **22.22+**, **24.15+** or **26+** (required by Angular 22)
- npm **11+**

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the mock API on http://localhost:3000
npm run server

# 3. In a second terminal, start the app on http://localhost:4200
npm start
```

On Windows, `npm run dev` runs both in one command.

> The app needs the mock API to load data. If the API isn't running, each page shows an error message with a **Retry** button.

---

## 4. Environment Configuration

The configuration is in `src/app/core/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

- `apiUrl` is the only place the backend address is defined. Every service builds its URLs from it, so pointing the app at another backend means changing this one value.
- JSON Server serves `moks/db.json` on port `3000`. It writes changes back to that file, so created and edited tasks stay after a restart. To reset the data, restore the file from git: `git checkout moks/db.json`.
- The Angular dev server runs on port `4200`.

### Live Demo Backend

GitHub Pages hosts static files only, so the live demo needs its API from somewhere else. Locally the app uses JSON Server, which has no free and reliable hosted equivalent. These are the options we tried and the ones we looked at, in order.

#### What we tried

1. **My JSON Server** (`my-json-server.typicode.com`)
   - This was the first choice because it serves `db.json` straight from the GitHub repo, with no account and no server to run.
   - We set `apiUrl` to `https://my-json-server.typicode.com/salmaadel66/task-management-dashboard` and added a minified `db.json` at the repo root (the service only reads that file and limits it to 10 KB).
   - **Result: not working.** Every request returns `HTTP 530` with Cloudflare `error code: 1016` (origin DNS error). This includes typicode's own demo (`/typicode/demo/posts`) and the service home page, so the outage is on the service side, not in this project. There is no official notice about when, or whether, it will come back.
   - It also never saved writes: `POST`, `PUT` and `DELETE` get a response but the data does not change.

2. **JSON Server on Render**
   - We added a `start:api` script (`json-server moks/db.json --host 0.0.0.0`) and a `render.yaml` Blueprint, and switched updates from `PATCH` to `PUT`. We tested every method and CORS locally against a copy of the data.
   - Creating the service from the Blueprint asked for payment details straight away.
   - Creating a plain Web Service on the **Free** plan ($0/month) also asked for a card when we clicked Deploy. Render places a temporary $1 authorization to verify the card.
   - **Result: not working.** The card was declined, so the service was never created. Even if it had been, the free plan sleeps after 15 minutes without traffic (about a minute to wake up) and has no persistent disk, so all changes would be lost on every restart. The paid Starter plan ($7/month) only removes the sleep; saved data would still need an extra paid disk.

3. **Returning the data with RxJS `of()` from the services**
   - This means replacing the HTTP calls in `TasksService` and `StatisticsService` with `of(data)`.
   - **Result: rejected**, because the requirements ask for the data to be loaded over HTTP. It would also remove `httpResource`, the cache and retry interceptors, and the real loading and error states, and every component that calls `.reload()`, `.hasValue()` or `.error()` would have to change.

#### Options we looked at but did not use

| Option                                            | Why not                                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Vercel** (JSON Server as a serverless function) | Needs an extra account and extra files. Like Render's free plan, writes are not saved.                    |
| **MockAPI.io**                                    | Needs an account and has free-plan limits. It generates its own ids, so ids like `task-001` would change. |
| **FakeAPI, Reqres, JSONPlaceholder**              | No account needed, but they do not save writes, which is the same problem as My JSON Server.              |
| **angular-in-memory-web-api**                     | Not well maintained, and not confirmed to work with Angular 22.                                           |

#### The solution: a mock HTTP interceptor

Since none of the hosted options worked, the demo uses `mock-backend.interceptor.ts`, which is registered only in production builds (`environment.production`):

- The services still use `HttpClient` and `httpResource`, so the app keeps loading its data over HTTP. Every request still goes through the cache and retry interceptors.
- The mock interceptor is last in the chain. It answers `GET`, `POST`, `PUT`, `PATCH` and `DELETE` on `/tasks` and `/statistics` from the data in `moks/db.json`, and returns `404` for unknown items. A short delay keeps the loading states visible.
- Every change is saved to `localStorage`, so created, edited and deleted tasks stay after a reload. To reset the demo, clear the site data in the browser or run `localStorage.removeItem('mock-db')` in the console.
- In development nothing changes: the interceptor is not registered, and the app talks to JSON Server on `http://localhost:3000`.
- To move the demo to a real backend later, set `apiUrl` in `environment.prod.ts` and stop registering the interceptor. No service or component needs to change.

---

## 5. Available Scripts and Commands

| Command                | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `npm start`            | Starts the Angular dev server on `http://localhost:4200`          |
| `npm run server`       | Starts JSON Server on `http://localhost:3000` (watches `db.json`) |
| `npm run dev`          | Starts the API and the app together (Windows only)                |
| `npm run build`        | Production build into `dist/`                                     |
| `npm run watch`        | Development build that rebuilds on file changes                   |
| `npm test`             | Runs the unit tests with Vitest                                   |
| `npm run format`       | Formats `src/**/*.{ts,html,scss}` with Prettier                   |
| `npm run format:check` | Checks formatting without changing files                          |

---

## 6. Design Patterns and State Management

### 6.1 Smart and Presentational Components

**Smart components** are the pages (`TasksComponent`, `DashboardComponent`, `AnalyticsComponent`, `TeamComponent`). They inject services, hold state, open dialogs and handle API calls.

**Presentational components** only receive data and emit events. They don't inject any feature service:

- `TaskCardComponent` renders one task. Inputs: `task`, `overdue`. Outputs: `edit`, `delete`.
- `ConfirmationDialogComponent` receives a title, a message and a button label, and closes with `true` or `false`. It's reused for any confirmation, not only tasks.

```ts
export class TaskCardComponent {
  task = input.required<Task>();
  overdue = input(false);

  edit = output<Task>();
  delete = output<Task>();
}
```

```html
<app-task-card
  [task]="task"
  [overdue]="isOverdue(task)"
  (edit)="editTask($event)"
  (delete)="deleteTask($event)"
/>
```

Because the card has no dependencies, it can be tested with plain inputs, and changing the API never touches it.

### 6.2 Dependency Injection

- Every dependency uses the `inject()` function. There are no constructor parameters.
- Services use `providedIn: 'root'`, so they're tree-shakable singletons.
- Dialogs receive their data through the `MAT_DIALOG_DATA` token instead of a shared service.
- Components depend on services, not on `HttpClient` directly. Tests can replace a service with `{ provide: TasksService, useValue: mock }`.

### 6.3 State Management

All state is built with Angular Signals, in four kinds:

| Kind of state | API                           | Examples                                             |
| ------------- | ----------------------------- | ---------------------------------------------------- |
| Server state  | `httpResource`                | `TasksService.tasks`, `StatisticsService.statistics` |
| UI state      | `signal`                      | `activeTab`, `selectedPriority`, `selectedAssignee`  |
| Derived state | `computed`                    | `filteredTasks`, `statusCounts`, `recentActivity`    |
| URL state     | `toSignal(route.queryParams)` | `search`, `new` (opens the "Add task" dialog)        |

**Read flow.** `TasksService.tasks` is the single source of truth. Each page derives what it needs with `computed`: the board filters it, the dashboard counts it, analytics groups it and the team page groups it by user. Nothing is copied, so the views can't drift apart.

```
                 TasksService.tasks  (httpResource<Task[]>)
                           │
       ┌──────────────┬────┴─────────┬──────────────┐
       ▼              ▼              ▼              ▼
   Dashboard        Tasks        Analytics        Team
   computed:      computed:      computed:      computed:
   stat values    filteredTasks  chart series   team members
```

**Write flow.**

1. The user saves, deletes or drops a task.
2. `TasksService` sends `POST`, `PATCH` or `DELETE` with `HttpClient`.
3. `cacheInterceptor` sees a non-`GET` request and clears the cache.
4. The page calls `tasksResource.reload()`. Fresh data arrives and every `computed` value updates.

**Optimistic update (drag and drop).** When a card is dropped, the board is updated right away with `tasksResource.set(...)`, and then the `PATCH` is sent. If the request fails, an error is shown and `reload()` restores the server state.

**Side effects.** `effect()` is used only where a reaction is needed. For example, opening the "Add task" dialog when the URL has `?new=true` and the tasks have finished loading. The dialog call is wrapped in `untracked()` so it doesn't become a dependency of the effect.

### 6.4 Reactive Forms

The task form is a typed `FormGroup` inside a Material dialog.

- **Custom validators**
  - `notBlank` rejects titles made of only spaces.
  - `notPastDate` rejects due dates before today. It's added only when **creating** a task, so existing tasks with past dates can still be edited.
- **Dynamic controls:** `tags` is a `FormArray`. Users add and remove tag inputs with `addTag()` and `removeTag(index)`.
- **Form state:** `isLoading` and `saveError` signals. The submit button is disabled while the form is invalid or saving, and `Escape` doesn't close the dialog during a save. The button label changes to "Saving…".
- **Error display:** each field shows a translated `mat-error` once it's touched. `onSubmit()` also guards with `markAllAsTouched()`. A failed save shows an error and keeps the dialog open with the user's input.

### 6.5 HTTP Layer

Interceptors are registered in this order:

```ts
provideHttpClient(withInterceptors([cacheInterceptor, retryInterceptor]));
```

**`cacheInterceptor`**

- `GET`: returns the cached response for the same URL and parameters if there is one. Otherwise it sends the request and caches a successful response.
- Any other method: clears the whole cache, so the next read gets fresh data.

**`retryInterceptor`**

- Retries only `GET` requests. Retrying a `POST` could create duplicate tasks.
- Retries only temporary failures: network error (`0`), `408`, `429`, `500`, `502`, `503`, `504`. Errors like `404` fail immediately.
- Up to 3 retries with exponential backoff: 500 ms, 1 s, 2 s.

**Error handling in the UI**

- Read errors show a message and a **Retry** button that calls `reload()`.
- During a reload after an edit or delete, the board stays on screen instead of switching back to a spinner.
- Failed writes show an inline alert next to the action that failed.

---

## 7. Performance Optimization Techniques

- **OnPush change detection on every component.** Components re-render only when an input or a signal they read changes.
- **Lazy loading and code splitting.** Each page is a separate chunk loaded with `loadComponent`. The first load only contains the shell.
- **Signals and `computed`.** Derived values (filters, statistics, chart data) are memoized and recalculated only when their sources change.
- **`track` in every `@for`.** Lists are tracked by a stable key (`id` for tasks, users and statistics), so Angular updates only the items that changed instead of re-creating the list.
- **HTTP caching.** Moving between pages reuses cached `GET` responses instead of fetching the same data again.
- **No memory leaks.** Long-lived subscriptions (router events, dialog results) use `takeUntilDestroyed()`. Dialog keyboard listeners end when the dialog closes. Route parameters are read with `toSignal()`, which unsubscribes automatically. One-shot HTTP calls complete on their own.
- **Optimistic UI.** Drag and drop updates the screen before the server responds.
- **Light animations.** Animations use CSS only (`opacity`, `translate`, `scale`) and turn off when the user enables `prefers-reduced-motion`.
- **Lighthouse.** The audit findings for performance, accessibility and best practices were fixed.

---

## 8. Known Limitations and Future Improvements

### Known Limitations

- **Unit tests aren't written yet.**
- **ESLint and Husky are not set up yet.** Only Prettier enforces code style today.
- **Users come from the tasks.** There's no `/users` endpoint, so a user with no tasks can't appear in the list.
- **Drag and drop order isn't saved.** Moving a card to another column is saved; reordering inside a column is lost after a reload, because tasks have no `order` field.
- **Recent activity is derived from `updatedAt`**, not from a real history log. Only the latest change per task is shown.
- **The cache has no expiry.** It's cleared on every write, but data changed by another user won't show until a write or a full page reload.
- **`npm run dev` works only on Windows**, because it uses the `start` command.
- **There's only one environment file**, with no production configuration.

### Future Improvements

1. Write unit tests and add a coverage threshold to the test configuration.
2. Add `angular-eslint`, plus Husky with lint-staged to run ESLint and Prettier before each commit.
3. Add JSDoc to the complex logic: interceptors, drag and drop, and the form validators.
4. Add a GitHub Actions workflow that runs lint, tests and the build on every pull request.
5. Add a Dockerfile and `docker-compose.yml` that run the app and JSON Server together.
6. Add a `/users` endpoint and a `UsersService`.
7. Add an `order` field to tasks and save the position after drag and drop.
8. Add an `/activities` endpoint that records every change.
9. Add a time-to-live to the HTTP cache.
10. Use `concurrently` for a cross-platform `dev` script, and add `environment.prod.ts` with `fileReplacements`.
