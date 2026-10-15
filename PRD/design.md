# Nomi: Design System & UI Guidelines

## 1. Design Concept: "Minimalist Aurora Glass"

The core aesthetic combines a very clean, minimalist light-mode background with vibrant, fluid gradient accents (like the northern lights/aurora) and "liquid glass" (glassmorphism) elements. The UI should feel airy, premium, and futuristic but highly readable.

**Reference:** `image_d5a881.jpg`

## 2. Color Palette (Tailwind CSS based)

* **App Background:** Very soft, cool off-white. `bg-slate-50` or `bg-[#F8FAFC]`.

* **Text Colors:**

  * Primary text: `text-slate-900`

  * Secondary text: `text-slate-500`

* **Brand/Accent (Dark Blue):** `bg-[#1A2C4C]` or `bg-slate-900` for solid primary buttons and active states.

* **Transaction Indicators:**

  * Income/Positive: Mint/Emerald green (`text-emerald-500`, `bg-emerald-50`).

  * Expense/Negative: Soft red (`text-rose-500`, `bg-rose-50`).

* **Aurora Gradients (For Wallet Cards & Hero Elements):**

  * Use complex gradients mixing deep blue, purple, and cyan.

  * Example: `bg-gradient-to-br from-[#1E293B] via-[#312E81] to-[#06B6D4]`

## 3. The "Liquid Glass" Effect (Glassmorphism)

This is a signature element of the app, to be used on navigation bars, modals, floating action buttons, and overlapping card elements.

* **Tailwind Recipe:** `bg-white/60` (or `bg-white/40`), `backdrop-blur-lg` or `backdrop-blur-md`, `border border-white/40`, `shadow-sm`.

* **Dark Glass Recipe (for overlays on Aurora backgrounds):** `bg-black/20`, `backdrop-blur-md`, `border border-white/10`.

## 4. Typography

* **Font Family:** Clean sans-serif. Primary: **Plus Jakarta Sans**.

* **Hierarchy:**

  * Use bold, large typography for numbers (Balances, Amounts). e.g., `text-4xl font-bold tracking-tight`.

  * Use small, muted text for labels and dates to maintain minimalism.

## 5. UI Components & Shapes

* **Border Radius:** Highly rounded corners. Use `rounded-2xl` or `rounded-3xl` for main cards and modals. Use `rounded-full` for icon buttons.

* **Wallet Cards (Featured):** Must use the Aurora gradient with white text. Include a subtle glassmorphic overlay inside the card for the balance or account number.

* **Quick Action Buttons:** Circular buttons with a light blue/gray background and dark blue icons.

* **Transaction List:** Clean layout. Left side: Circular icon/logo with category name and date. Right side: Amount (colored green or dark gray/red based on type).

* **Desktop Adaptation:** Since this is a web app, adapt the mobile "bottom glass nav" into a **Glassmorphic Sidebar** or **Floating Top Navigation Bar**.

## 6. Spacing & Layout System (CRITICAL)

To maintain the airy, premium feel of the reference image, the AI must strictly follow these spacing rules. **Never make elements cramped.**

* **Section Gaps:** Use `space-y-8` or `gap-8` between major sections (e.g., between the KPI cards and the transaction list).
* **Card Padding:** Inner padding for cards and modals must be generous. Use `p-6` or `p-8` (never smaller than `p-4`).
* **Component Gaps:** Distance between elements inside a flex container (like icon and text) should be `gap-3` or `gap-4`.
* **Page Margins:** The main content area must have breathing room from the screen edges. Use `p-6 md:p-10`.
* **Lists:** Items within the transaction list should have vertical padding (`py-4`) and be separated by a very subtle border (`border-b border-slate-100`) or just generous spacing.

## 7. Development Rules for AI Agent

* Always use Tailwind utility classes to achieve these effects.
* Prioritize `backdrop-blur` and semi-transparent backgrounds (`bg-opacity`) to create depth.
* Do not clutter the screen with heavy borders; rely on white space, soft shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`), and the strict layout spacing defined in Section 6.