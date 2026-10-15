# Product Requirements Document (PRD)
**Project Name:** Nomi -Personal Finance Web Tracker  
**Target Audience:** Personal use (with separate isolated accounts for partner)  
**Platform:** Web Application (Responsive/Desktop-first)  

## 1. Product Overview
A web-based personal finance application designed to solve the accessibility limitations of mobile-only money managers. It allows users to track daily transactions, manage multi-pocket wallets, monitor budgeting limits, and automate savings interest tracking via a lightweight, fast-loading web interface.

## 2. Tech Stack
*   **Frontend:** React (SPA), Vite, Tailwind CSS
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth (Email/Password)
*   **Automation:** Supabase pg_cron (Database Cron Jobs)

## 3. Core Features & Requirements

### 3.1. Authentication & Security
*   **User Login/Register:** Standard email authentication.
*   **Data Isolation:** Strict 100% data separation between users using Row Level Security (RLS). Users cannot view or access data belonging to other accounts.

### 3.2. Dashboard & Analytics
*   **Single-Line KPI Cards:** High-level metrics at the top (e.g., Total Balance, Total Expenses This Month, Remaining Total Budget).
*   **Data Visualizations:** 
    *   Pie chart for Expenses per Category.
    *   Monthly trend line/bar chart.
*   **Budget Progress Bars:** Visual indicators for category limits (Category Name, Monthly Limit, Progress Bar, Remaining/Overbudget info).
*   **Recent Transactions:** List of latest transactions with inline dropdown filters (e.g., This Month, Last Month).

### 3.3. Wallet (Kantong) Management
*   **Multi-Wallet Support:** Categories include Cash, Bank, E-Wallet, and Savings.
*   **Savings Automation:** Support for defining an Annual Percentage Rate (APR) for savings accounts (e.g., Bank Jago). 
*   **Interest Projection:** Frontend displays the accumulated daily interest projection.
*   **Interest Realization:** Backend cron job automatically generates an "Income" transaction for the accrued interest at the end of each month.

### 3.4. Transaction Management
*   **Quick Input Form:** Modal or distinct UI block utilizing segmented controls to switch between `Income`, `Expense`, and `Transfer`.
*   **Data Fields:** Date, Amount, Category, Wallet Source, Destination Wallet (for Transfers), and Notes.

## 4. Database Schema Structure
*   **`users`:** Handled by Supabase Auth.
*   **`wallets`:** `id`, `name`, `type`, `balance`, `annual_interest_rate`.
*   **`categories`:** `id`, `name`, `type`, `monthly_limit`.
*   **`transactions`:** `id`, `type`, `amount`, `transaction_date`, `wallet_id`, `category_id`, `to_wallet_id`, `note`.