# Transition Plan: Supabase to MongoDB (NoSQL)

This document outlines the strategy and necessary changes to migrate the **FinOpenPOS** project from Supabase to a MongoDB-based architecture.

## 1. Overview
The goal is to replace Supabase (PostgreSQL + Auth) with MongoDB (NoSQL) using Mongoose for data modeling and NextAuth.js (Auth.js) for authentication.

## 2. Current Stack Analysis
- **Database**: PostgreSQL hosted on Supabase.
- **ORM/Client**: Supabase JS Client (`@supabase/supabase-js`).
- **Authentication**: Supabase Auth (Email/Password).
- **Session Management**: Supabase SSR Middleware.

## 3. Proposed Stack
- **Database**: MongoDB (Atlas or Local).
- **ORM**: Mongoose.
- **Authentication**: NextAuth.js (v5/beta or v4) with MongoDB Adapter.
- **State Management**: Server-side sessions via NextAuth.

## 4. Action Plan

### Phase 1: Setup & Environment
1.  **Dependencies**:
    - Remove `@supabase/supabase-js`, `@supabase/ssr`, `supabase`.
    - Install `mongodb`, `mongoose`, `next-auth@beta`, `@auth/mongodb-adapter`.
2.  **Environment Variables**:
    - Add `MONGODB_URI`.
    - Add `AUTH_SECRET` (for NextAuth).
    - Remove `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Phase 2: Database Layer
1.  **Connection Utility**: Create `src/lib/mongodb.ts` for Mongoose connection pooling.
2.  **Data Modeling**: Create Mongoose schemas in `src/models/`:
    - `User` (for NextAuth).
    - `Product`: Map from `products` table.
    - `Customer`: Map from `customers` table.
    - `Order`: Map from `orders` table + embed `order_items`.
    - `Transaction`: Map from `transactions` table.
    - `PaymentMethod`: Map from `payment_methods` table (or use an enum).

### Phase 3: Authentication Migration
1.  **NextAuth Setup**:
    - Create `src/auth.ts` to configure NextAuth with MongoDB Adapter and Credentials Provider.
    - Create `src/app/api/auth/[...nextauth]/route.ts`.
2.  **Login/Signup Actions**:
    - Rewrite `src/app/login/actions.ts` to use NextAuth's `signIn` and custom user creation logic in MongoDB.
3.  **Middleware**:
    - Replace `src/lib/supabase/middleware.ts` logic with NextAuth middleware or session checks in `src/middleware.ts`.

### Phase 4: API & Data Migration
1.  **API Routes**: Update all files in `src/app/api/` to use Mongoose models instead of Supabase queries.
    - *Note*: Ensure `user_uid` mapping is consistent. MongoDB `_id` will be used as the primary identifier.
2.  **Data Migration**: (If applicable) Script to export data from Supabase and import into MongoDB, converting UUIDs if necessary.

## 5. Required Changes (File-by-File)

| File Path | Change Required |
|-----------|-----------------|
| `package.json` | Swap Supabase deps for MongoDB/Mongoose/NextAuth. |
| `src/middleware.ts` | Replace Supabase session check with NextAuth session check. |
| `src/lib/supabase/*` | **Delete** entire directory. |
| `src/lib/mongodb.ts` | **Create** MongoDB connection utility. |
| `src/models/*.ts` | **Create** Mongoose schemas for all entities. |
| `src/app/api/**/*` | Rewrite all CRUD operations to use Mongoose. |
| `src/app/login/actions.ts` | Update login/signup to use NextAuth. |
| `src/app/layout.tsx` | Wrap with `SessionProvider` (if client-side session access is needed). |
| `src/app/admin/layout.tsx` | Ensure server-side session check. |

## 6. Data Mapping Strategy

| SQL Table | MongoDB Collection | Notes |
|-----------|--------------------|-------|
| `products` | `products` | Standard collection. |
| `customers` | `customers` | Standard collection. |
| `orders` | `orders` | **Embed** `order_items` as an array within the document. |
| `order_items` | N/A | Embedded in `orders`. |
| `payment_methods` | `payment_methods` | Or keep as a static list/enum. |
| `transactions` | `transactions` | Reference `order_id` and `payment_method_id`. |
| `auth.users` | `users` | Managed by NextAuth. |

## 7. Risk Assessment
- **ID Types**: Supabase uses Serial/UUID, MongoDB uses ObjectId. Relational IDs in `orders` and `transactions` must be carefully mapped.
- **Atomic Operations**: PostgreSQL handles relations with foreign keys. In MongoDB, we must manually ensure data integrity or use Transactions if embedding isn't enough.
- **Auth Flow**: Supabase handles email confirmation automatically. NextAuth requires more configuration for this.

## 8. Change Log
- [2026-02-18] Initial transition plan created.
