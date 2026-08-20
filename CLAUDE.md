# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Backend (run from repo root):
- `mvn spring-boot:run` — build the Angular frontend, copy it into Spring Boot static resources,
  and start the app on `http://localhost:8090`.
- `mvn test` — run backend tests (JUnit via `spring-boot-starter-test`); `src/test/java/...`
  mirrors `src/main/java/...`. Spring Boot 4 moved the old `@DataJpaTest`/`@WebMvcTest` slices out
  of `spring-boot-test-autoconfigure` into per-technology modules, so those annotations come from
  the extra `spring-boot-starter-data-jpa-test` / `spring-boot-starter-webmvc-test` test-scope
  dependencies and live in new packages (`org.springframework.boot.data.jpa.test.autoconfigure`,
  `org.springframework.boot.webmvc.test.autoconfigure`, …).
- `mvn test -Dtest=ClassName` — run a single test class.
- `mvn package` — full build producing `target/cashtracker-0.0.1-SNAPSHOT.jar` (runs the frontend
  build as part of `generate-resources`).

Frontend (run from `frontend/`):
- `npm start` — Angular dev server on `http://localhost:4200` with `/api` proxied to `:8090`
  (`proxy.conf.json`). Requires the backend running separately.
- `npm run build` — production build to `frontend/dist/frontend/browser`.
- `npm test` — unit tests via Vitest (Angular CLI's `ng test`).
- `npx ng test --watch=false path/to/some.spec.ts` — run a single spec file.

Legacy data import (one-off, wipes and replaces all category/daily-balance/transaction/correction
data):
```bash
java -jar target/cashtracker-0.0.1-SNAPSHOT.jar --spring.profiles.active=import-legacy --legacy.import.path="C:\path\to\export.json"
```

## Architecture

**Build pipeline**: Maven is the single entry point. `frontend-maven-plugin` installs a
project-local Node/npm and runs `ng build` during Maven's `generate-resources` phase; immediately
after (same phase, later plugin declaration — order matters), `maven-resources-plugin` copies
`frontend/dist/frontend/browser` into `target/classes/static`. The result is one jar containing
both the API and the compiled SPA. `src/main/resources/static/` in source control only holds a
`.gitkeep` — the real content is generated, never edited directly.

**Package-by-feature backend**: each package under `com.cashtracker` is a vertical slice
(`transaction`, `category`, `dailybalance`, `correction`, `legacyimport`), not a horizontal
layer. `transaction` and `dailybalance` expose a REST controller/service; the others are
entity+repository pairs consumed internally (by `legacyimport`, and by `dailybalance` for the
day detail view, which reads the transaction and correction repositories to assemble
`DayDetailsDto`). Follow this package-per-feature shape rather than introducing
`controller`/`service`/`repository` packages.

Per-day lookups of transactions and corrections go through `daily_balance_id`, not the day's
date, so those queries never have to compare SQLite's text-stored date column (see below).

**Domain model**: `DailyBalance` is the anchor of the schema — every `Transaction` and
`Correction` belongs to exactly one `DailyBalance` (one row per calendar day, holding that day's
end-of-day balance and whether it was predicted/manually set/reviewed). A `Correction` represents
a manual balance adjustment that can optionally be paired with a `Transaction`
(`pairedTransactionId`) to mark it as a re-categorization of that transaction rather than a new
amount. `Category` has a one-to-many set of `CategoryMatchingRule` keywords, used to auto-suggest
a category for a transaction/correction. All monetary amounts are `long` — whole-unit currency
(HUF), no decimal/cents handling.

**SQLite via JPA — non-obvious constraints** (see comments in
[application.yml](src/main/resources/application.yml) and
[V1__create_schema.sql](src/main/resources/db/migration/V1__create_schema.sql) for the full
reasoning):
- The datasource URL pins `?date_class=TEXT`; without it, temporal columns round-trip as epoch
  millis, which Hibernate's community `SQLiteDialect` cannot parse back.
- Hand-written SQL date/datetime literals (seed data, manual fixes) must use full
  `YYYY-MM-DD HH:MM:SS.ffffff` text, not a bare date — inserts through JPA entities already handle
  this correctly.
- For the same reason, date columns are compared as text. Range queries should use a half-open
  bound (`date >= :from AND date < :toExclusive`, i.e. Spring Data
  `…GreaterThanEqualAnd…LessThan`) rather than `BETWEEN`: a closed upper bound is only correct if
  the bound parameter is rendered with the same time suffix as the stored value, whereas a
  half-open one is right either way. See `DailyBalanceRepository`.
- SQLite has limited `ALTER TABLE` support. Schema changes to existing columns should use the
  create-new-table/copy/drop/rename pattern instead of `ALTER TABLE ... MODIFY/DROP COLUMN`.
- `sqlite-jdbc` and `hibernate-community-dialects` are both pinned explicitly (not managed by
  Spring Boot's BOM) — their versions must stay in sync; check
  `mvn dependency:tree -Dincludes=org.hibernate.orm` before bumping either.
- `TomcatConnectorConfig` forces the NIO2 (`Http11Nio2Protocol`) connector because Tomcat's default
  NIO connector fails to open its wakeup selector on some Windows VPN/EDR setups.

**Legacy import**: `LegacyImportRunner` (a `CommandLineRunner`, active only under the
`import-legacy` Spring profile) reads a legacy CashCounter JSON export
(`LegacyExportJson`/Jackson) and hands it to `LegacyImportService`, which wipes all existing
category/daily-balance/transaction/correction data and reloads it inside one `@Transactional`
call. Source transaction IDs are not globally unique across days, so correction-to-transaction
pairing is resolved with a per-day ID map, not a global one.

**Frontend**: the UI is Hungarian-only. `LOCALE_ID` is pinned to `hu` in
[locale.ts](frontend/src/app/locale.ts), so `DatePipe`/`CurrencyPipe` already produce Hungarian
month names, a non-breaking space as the thousands separator and a trailing `Ft` — don't
hand-format any of that. All user-visible strings are written in Hungarian directly in the
templates (no i18n extraction), and the shared `FORMATS` constant in the same file holds the
display formats (`yyyy MMM dd` for dates, `yyyy MMMM` for month headings, whole-forint currency)
so they cannot drift between templates.

The day detail modal is a native `<dialog>`; jsdom parses the element but implements none of its
behaviour, so [test-setup.ts](frontend/src/test-setup.ts) stands in `showModal`/`close` under test.
It is wired in through the unit-test builder's `setupFiles` in
[angular.json](frontend/angular.json).

Standalone Angular components (no NgModules), calling `/api/*` through injected
`HttpClient` services (`inject()`-style DI, e.g.
[transaction.service.ts](frontend/src/app/transactions/transaction.service.ts)). `ng serve` proxies
`/api` to the backend per `frontend/proxy.conf.json`; in production the same paths are served by
Spring Boot from the same origin, so no CORS configuration exists or is needed.
