# CashTracker

A personal financial transaction tracker: a Spring Boot backend backed by SQLite, serving an
Angular single-page frontend as static resources from the same jar.

## Stack

- **Backend**: Java 21, Spring Boot 4.1 (Web, Data JPA, Flyway), SQLite via the `xerial` JDBC
  driver + Hibernate's community SQLite dialect.
- **Frontend**: Angular 21, served through `HttpClient` against `/api/*`.
- **Build**: Maven drives the whole pipeline — `frontend-maven-plugin` installs Node/npm and runs
  `ng build`, then `maven-resources-plugin` copies the Angular output into
  `src/main/resources/static` so Spring Boot serves it directly.

## Running

```bash
mvn spring-boot:run
```

This builds the frontend and starts the backend on `http://localhost:8090`.

For frontend-only development with hot reload, run the Angular dev server separately; it proxies
`/api` requests to the backend (see `frontend/proxy.conf.json`):

```bash
cd frontend
npm start
```

The backend must be running separately (`mvn spring-boot:run`) for the proxy to have something to
talk to.

## Database

SQLite database file lives at `~/.cashtracker/cashtracker.db` and is created/migrated
automatically by Flyway on startup (migrations in `src/main/resources/db/migration`).

## Legacy data import

A one-off `import-legacy` Spring profile loads a legacy CashCounter JSON export, replacing all
existing category/daily-balance/transaction/correction data:

```bash
java -jar target/cashtracker-0.0.1-SNAPSHOT.jar --spring.profiles.active=import-legacy --legacy.import.path="C:\path\to\export.json"
```

The existing database file is backed up (timestamped `.bak-*` copy) before the import runs.
