---
id: building-restful-apis-typescript
title: "Building Production-Ready REST APIs with TypeScript"
description: "A deep dive into designing and building REST APIs with TypeScript, covering routing, validation, error handling, and deployment patterns used in real production systems."
tags: [typescript, api, rest, nodejs, backend, express]
category: engineering
modified_date: 2026-06-20
thumbnail:
draft: false
external_links:
  - label: "TypeScript Docs"
    url: "https://www.typescriptlang.org/docs/"
  - label: "Express.js Guide"
    url: "https://expressjs.com/en/guide/routing.html"
---

# Building Production-Ready REST APIs with TypeScript

Building REST APIs is one of the most common tasks in backend engineering. But building them *well* — with proper typing, validation, error handling, and observability — requires intentional design choices from day one.

## Why TypeScript for APIs?

TypeScript catches entire categories of bugs at compile time rather than runtime:

- **Type-safe request/response shapes** — no more `Cannot read property 'x' of undefined` in production
- **Refactor confidence** — changing a type propagates errors immediately
- **IDE intelligence** — autocomplete on request bodies, query params, headers

## Project Structure

```
src/
├── routes/       # Express routers
├── controllers/  # Request handlers
├── services/     # Business logic
├── middleware/   # Auth, validation, error handling
├── types/        # Shared TypeScript interfaces
└── lib/          # Utility helpers
```

## Request Validation

Use `zod` for runtime validation that matches your TypeScript types:

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user']).default('user'),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

This gives you both compile-time types AND runtime validation with a single source of truth.

## Error Handling

Centralize errors through a single Express error middleware:

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }
  // Unexpected errors — log and return 500
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
});
```

## Consistent Response Format

Standardize your API responses so clients have a predictable contract:

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## Performance Checklist

- Enable `gzip` compression (`compression` middleware)
- Use database connection pooling, not per-request connections
- Add `Cache-Control` headers for read-heavy endpoints
- Return only fields the client needs (avoid `SELECT *`)
- Use pagination for list endpoints — never return unbounded datasets

## Deployment

The cleanest TypeScript API deployment flow:

1. Build: `tsc --noEmit` for type check, `tsup src/index.ts` for production bundle
2. Docker: multi-stage build (builder → runner) keeps image under 150MB
3. Health check endpoint at `GET /health` — returns 200 with uptime/version

## Conclusion

The key to maintainable APIs is consistency: consistent error shapes, consistent validation patterns, consistent response formats. TypeScript makes enforcing that consistency much cheaper than code review alone.
