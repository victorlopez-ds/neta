# Product Requirements Document (PRD) & Technical Prompt for Software Engineer

## Project Overview
We are developing a high-performance personal finance mobile application. The core objective is to allow users to track income, expenses, and investments (specifically DCA) seamlessly. The app must feature ultra-fluid, instant navigation with zero-latency screen transitions. A UI prototype already exists, so your main focus will be adapting that design to the architecture, database schema, automation logic, and caching strategies described below.

---

## 1. Technical Stack & Core Architecture

*   **Backend & Database:** Supabase (PostgreSQL) for Authentication, Data Storage, and Real-time syncing capabilities.
*   **Frontend/Mobile:** Cross-platform framework (Flutter / React Native) or Native (Swift/Kotlin). *[Developer note: Adapt to the pre-existing UI prototype stack]*.
*   **Caching Strategy (Offline-First / High-Performance):** 
    *   To guarantee instant UI transitions without loading spinners, the app must implement a **Local Cache + Background Sync** pattern (using libraries like TanStack Query / WatermelonDB / Isar / Hive depending on the frontend stack).
    *   **Reads:** The UI must always read from the local cache instantly.
    *   **Writes (Optimistic Updates):** When adding a transaction or updating a goal, the UI must update *immediately* in local memory, while sending the API request to Supabase asynchronously in the background. If the request fails, roll back the UI and show a non-blocking toast notification.

---

## 2. Database Schema (Supabase / PostgreSQL)

The database must support relational data for users, categorized transactions, templates for automations, and savings goals.

### `profiles`
*   `id` (UUID, Primary Key, references `auth.users`)
*   `display_name` (Text)
*   `currency` (Text, default: 'EUR')
*   `created_at` (Timestamp)

### `categories`
*   `id` (BigInt, Primary Key, Auto-increment)
*   `name` (Text, e.g., "Supermarket", "Rent", "DCA Index Funds")
*   `type` (Enum: `'income_fixed'`, `'income_variable'`, `'expense_essential'`, `'expense_personal'`, `'expense_leisure'`, `'investment'`)

### `movements`
*   `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
*   `user_id` (UUID, Foreign Key to `profiles.id`)
*   `category_id` (BigInt, Foreign Key to `categories.id`)
*   `concept` (Text)
*   `amount` (Numeric/Decimal)
*   `date` (Date)
*   `is_recurring` (Boolean, default: false)
*   `created_at` (Timestamp)

### `recurring_templates`
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Foreign Key)
*   `category_id` (BigInt, Foreign Key)
*   `concept` (Text)
*   `amount` (Numeric/Decimal)
*   `frequency` (Enum: `'weekly'`, `'monthly'`, `'yearly'`)
*   `billing_day` (Integer, 1-31)
*   `last_executed_date` (Date, Nullable)

### `financial_goals`
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Foreign Key)
*   `title` (Text, e.g., "Emergency Fund")
*   `target_amount` (Numeric)
*   `current_amount` (Numeric, default: 0)
*   `target_date` (Date)
*   `status` (Enum: `'active'`, `'achieved'`, `'paused'`)

---

## 3. Core Features & Business Logic

### A. Monthly Registry & Advanced Categorization
*   **The "+" Action:** A quick-entry form to record movements. Minimal friction: Amount input field, Category selector (large icons), Concept text, and Date (defaults to today).
*   **The 5-Tier Classification Model:** Based on strict budgeting rules, every movement must belong to a category type:
    1.  *Income Fixed* (e.g., Salary)
    2.  *Income Variable* (e.g., Freelance, Gifts)
    3.  *Essential Expenses* (e.g., Rent, Bills, Groceries)
    4.  *Personal Expenses* (e.g., Clothes, Subscriptions)
    5.  *Leisure Expenses* (e.g., Restaurants, Parties, Travel)
*   **Tags System:** Allow users to add arbitrary tags to transactions (e.g., Category: "Leisure", Tag: "Paris Trip 2026") for deep-dive filtering.

### B. Recurring Movements & DCA Automation Engine
*   **DCA (Dollar Cost Averaging) & Subscriptions:** Subscriptions (Netflix, Spotify) and constant investments (Monthly ETF/Crypto allocations) share the same underlying logic via the `recurring_templates` table.
*   **Automation Trigger:** Implement a background routine to instantiate real entries in `movements` when a recurring date is hit. 
    *   *Preferred Approach:* A Supabase Edge Function triggered daily via PostgreSQL `pg_cron` that checks if `current_date` matches the `billing_day` and if `last_executed_date` belongs to a previous period. Alternatively, handle this on client app boot via a local check sync routine.
*   **Investment Logic:** Financial health metrics must NOT treat type `'investment'` (DCA) as a standard dead-weight loss expense. It is a net-worth relocation.

### C. Dashboard, Analytics & Financial Health
*   **Real-time Balance:** Monthly net formula: $\text{Total Income} - \text{Total Expenses (Essential + Personal + Leisure)}$.
*   **Visualizations:** 
    *   A Pie Chart breakdown of expenses grouped by the 5 primary types.
    *   A Monthly Progress Bar indicating burn-rate (e.g., moving from Green $\rightarrow$ Yellow $\rightarrow$ Red as spending approaches custom-defined monthly limits).
*   **Annual Historical View:** A line chart showing the multi-month trajectory of Income vs. Expenses.
*   **Financial Health Index:** An automated score calculation based on the Savings Rate:
    $$\text{Savings Rate} = \frac{\text{Total Income} - \text{Total Expenses}}{\text{Total Income}} \times 100$$
    *Note: Investments (DCA) are counted as savings here, rewarding the user's health score.*

### D. Financial Goals (Gamification)
*   Users can set Short, Medium, and Long-term goals (3, 6, 12+ months).
*   Visual cards showing a percentage-based progress bar (`current_amount` / `target_amount`).
*   Allow manual "funding" of a goal by transferring unspent monthly balance into a specific goal entity.

---

## 4. Non-Functional Requirements & Performance Goals
*   **Latency:** Screen transitions must be $<50\text{ms}$. Network calls to Supabase should never block UI threads or navigation.
*   **Data Consistency:** Local storage states must automatically sync back up with Supabase when internet connectivity changes from offline to online.
*   **Security:** Row-Level Security (RLS) policies must be explicitly enabled on Supabase for all tables so that `user_id = auth.uid()` ensures total data privacy.