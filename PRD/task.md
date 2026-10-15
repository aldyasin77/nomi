# Task Tracker (task.md)

## Phase 1: Backend Setup (Supabase)
- [x] Create Supabase Project and obtain API Keys (`URL`, `anon key`).
- [x] Execute SQL schema in Supabase SQL Editor (Create `wallets`, `categories`, `transactions`).
- [x] Enable Row Level Security (RLS) policies for 100% data isolation.
- [x] Create database trigger `update_wallet_balance` on `transactions` table.
- [x] Configure `pg_cron` in Supabase for monthly savings interest auto-generation.

## Phase 2: Frontend Initialization
- [x] Initialize React + Vite project (`npm create vite@latest`).
- [x] Install dependencies: `tailwindcss`, `@tailwindcss/vite`, `@supabase/supabase-js`, `lucide-react`, `recharts`, `react-router-dom`, `react-hot-toast`.
- [x] Configure Tailwind CSS and setup global styles with Plus Jakarta Sans & Minimalist Aurora Glass theme.
- [x] Create `.env.local` and connect Supabase client instance with graceful fallback.

## Phase 3: Authentication & Routing
- [x] Build Authentication context/provider (Supabase Auth + Demo Mode support).
- [x] Create Login and Registration views.
- [x] Implement Protected Routes (redirect unauthorized users to `/login`).
- [x] Build basic app layout (Glassmorphic Sidebar, Mobile top bar, Main Content Area).

## Phase 4: Core Features Development
- [x] **Data Fetching Hooks:** Create reusable functions to fetch/subscribe to wallets, categories, and transactions data.
- [x] **Transaction Modal:** Build the UI for transaction entry using segmented controls (Income, Expense, Transfer).
- [x] **Wallet Management:** Create CRUD UI for adding/editing wallets (including APR input for savings).
- [x] **Category Management:** Create CRUD UI for adding/editing categories and setting monthly limits.

## Phase 5: Dashboard & Analytics UI
- [x] Develop Single-line KPI Cards component (Total Balance, Income, Expenses, Budget Remaining).
- [x] Integrate `recharts` to build the Expense Pie Chart.
- [x] Integrate `recharts` to build the Monthly Trend chart.
- [x] Build Budget Progress Bar components (Calculate total expenses per category vs monthly limit).
- [x] Build Recent Transactions list component with filtering capabilities.

## Phase 6: Testing & Refinement
- [x] Test RLS logic (verified with live user account sinsyourbae@gmail.com with isolated data).
- [x] Test transaction math (verified wallet balance updates on Expense, Income, and Transfer).
- [x] Polish UI/UX (loading states, toast notifications for success/error, responsive design, animations).