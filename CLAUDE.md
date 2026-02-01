# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm build          # Build TypeScript (tsc --build)
pnpm lint           # Run ESLint with strict TypeScript checks
pnpm format         # Format code with Prettier
pnpm format:check   # Check formatting without writing
```

Vitest is installed but no test files exist yet. When tests are added, run with `pnpm vitest`.

## Testing with Couchbase

Integration tests require a real Couchbase instance. Tests must be runnable in GitHub Actions using Couchbase in Docker:

```bash
docker run -d --name couchbase -p 8091-8096:8091-8096 -p 11210-11211:11210-11211 couchbase:latest
```

Access the web console at http://localhost:8091 to set up a cluster, bucket, and credentials.

## Architecture

This is an Object-Document Mapper (ODM) for Couchbase using Zod v4 for schema validation.

**Core pattern:** Result-based error handling (using `typescript-result`) instead of exceptions. All operations return `Result<T, Error>` types.

**Two operation modes:**
- **Collection operations** - Direct CRUD via `CollectionModel` and `CollectionDocument`
- **Transaction operations** - Multi-document ACID via `TransactionModel` and `TransactionDocument`

**Key classes:**
- `ZodCouchbase` / `createZodCouchbase()` - Main entry point, wraps Couchbase cluster
- `ModelConfig` / `createModelConfig()` - Defines document schema with configurable field names (id, type, createdAt, updatedAt)
- `ZCCollection`, `ZCScope`, `ZCBucket`, `ZCCluster` - Type-safe Couchbase wrappers
- Custom errors: `ZCDocumentNotFoundError`, `ZCDocumentExistsError`, `ZCCasMismatchError`, `ZCTransactionFailedError`

**Type utilities in `util.ts`:** Advanced generics (`Flatten`, `DistributiveOmit`, `Field`, `Output`, `ModelReplaceOutput`) for compile-time type safety.

## Code Style

- Follow [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) by default
- Never use type casts (`as`, `<Type>`) - type errors indicate incorrect code, not a need for casting
- ES Modules with `.js` extensions in imports (compiled from TypeScript)
- Strict TypeScript with `@tsconfig/strictest`
- ESLint enforces: `curly`, `object-shorthand`, `@typescript-eslint/return-await` (always)

## Workflow

- Create PRs rather than modifying code directly
- Keep commits and PRs incremental, small, and descriptive
