# Ember & Wheel — Food Truck Ordering System (Supabase edition)

Customer ordering, kitchen display and back office in **one app**, backed by a shared **Supabase** database.
A customer's order now reaches the kitchen screen instantly, on any device.

```
Customer phone ──place_order()──▶  Supabase (Postgres + Auth + Realtime)  ──live──▶ Kitchen tablet / Admin
      ▲                                      │
      └────────── get_orders() (status) ◀────┘
```

## Opening each part (one website, different addresses)

It is **one app on one website**. What changes is the address you open. Replace `yourtruck.com` with your real address (or `http://localhost:5173` while testing on your computer).

| Part | Address | Who / which device |
|---|---|---|
| **Customer ordering** | `https://yourtruck.com/` (cashier QR) and `https://yourtruck.com/t/tbl-03` (table QR) | Customers' own phones — no login |
| **Staff sign-in** | `https://yourtruck.com/staff/login` | Everyone on staff |
| **Admin / cashier / waiter panel** | `https://yourtruck.com/admin` | Cashier computer or tablet, waiter phone — sign in with a **Manager** (or Admin) account |
| **Kitchen panel** | `https://yourtruck.com/kitchen` | Kitchen tablet — sign in with a **Kitchen** account |

Tip: open each address once on its device and **Add to Home Screen / bookmark** it. Customers never see links to `/admin` or `/kitchen`, and typing them in just shows the staff sign-in page.

## The order process, step by step

1. **Customer scans the QR.** Table QR → opens the menu already set to *Dine-in, Table 3*. Cashier QR → asks *Dine-in or Takeaway* (dine-in: scan/enter table number; takeaway: name + mobile number).
2. **Customer orders** from the menu and taps **Place order**. There is no online payment: they choose *Cash* or *Card* and pay **at the cashier**. Their phone shows the order number and "Waiting for approval — pay at the cashier".
3. **Admin panel (cashier)** gets the new order instantly (chime + badge on *Orders* + "Needs attention" list). The customer comes to the cashier and pays. The cashier taps **Paid & approve** (or **Approve order**, then **Mark paid** later). Reject is available (e.g. item ran out).
4. **Kitchen panel** now receives the approved order in the **To cook** column (with chime). Kitchen taps **Start preparing**, then **Mark ready**. Kitchen never sees unapproved orders.
5. **Admin panel** shows the order as **Ready** (and the customer's phone says *Ready to collect* / *On its way to you*).
6. **Waiter** takes it: dine-in → serves it at the table, takeaway → hands it over. Then taps **Served** / **Collected** in the admin panel, and the order is completed.

Roles: **Kitchen** accounts can only do step 4. **Manager** accounts (use these for the cashier and waiters) can do steps 3 and 6 plus the whole back office. **Admin** accounts can do everything, including Settings and creating staff logins.

---

## Setup (about 15 minutes)

### 1. Create the Supabase project
1. Go to <https://supabase.com> → **New project** (pick a region near your customers).
2. When it's ready: **Project Settings → API**. Copy the **Project URL** and the **anon public** key.

### 2. Create the database
1. **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, click **Run**.
   (Creates the tables, security rules, order functions and realtime. Safe to run again.)

### 3. Lock down sign-ups
**Authentication → Sign In / Providers** → turn **OFF** "Allow new users to sign up".
Staff accounts are created by an admin only.

### 4. Create your first admin
1. **Authentication → Users → Add user → Create new user** — enter an email and a strong password, tick **Auto Confirm User**.
2. **SQL Editor**, run (use the same email):
   ```sql
   insert into public.staff_profiles (user_id, email, name, role)
   select id, email, 'Owner', 'admin' from auth.users where email = 'owner@example.com';
   ```

### 5. Deploy the staff-management function
This lets admins add kitchen/manager logins from inside the app (it needs a secret key that must stay on the server).
```bash
npm install -g supabase            # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy staff-admin
```

### 6. Run the app
```bash
cp .env.example .env     # then paste your Project URL and anon key
npm install
npm run dev
```
Open `/staff/login`, sign in with the admin you created, then:
- **Admin → Settings → Sample data → Load sample menu** (or build your own menu under **Menu**)
- **Admin → Staff access** → add your kitchen and manager logins
- **Admin → Tables & QR** → print the table QR codes and the cashier QR

### 7. Put it online
Deploy to Netlify, Vercel or Cloudflare Pages (build command `npm run build`, output `dist`). Add the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as environment variables. `public/_redirects` (Netlify/Cloudflare) and `vercel.json` make deep links like `/t/tbl-03` work.
Use the real public address when printing QR codes (Tables & QR page), or set `VITE_CUSTOMER_URL`.

> Only the **anon** key ever goes in `.env`. Never put the `service_role` key in the app.

---

## How an order flows
1. Customer scans a table QR (`/t/tbl-03` → table pre-selected) or the cashier QR (`/` → dine-in or takeaway).
2. Checkout calls the database function `place_order()`. **The server re-prices every item, add-on, promo, tax and fee from the live menu** (the browser can't change prices), checks the truck is open and items are in stock, generates the order number (`EW-1001…`), records the order as **unpaid / waiting for approval**, and marks a dine-in table occupied.
3. The admin/cashier screen receives it instantly (Realtime) with a chime. After the cashier approves, the kitchen tablet receives it with a chime, showing table number or takeaway, items and notes.
4. Every status change → the customer's tracking page updates within ~5 seconds.
5. Customers only see their order number's status, items and first name — never phone numbers.

## Good to know
- **Payment happens at the cashier**, not in the app. Orders always start *Unpaid*; only staff can mark them *Paid* (the database enforces this), so customers can't fake a payment. Online card payments are not included — add a provider such as Stripe later if you want them.
- **Kitchen tablet:** keep `/kitchen` open; tap the screen once after loading so the browser allows the chime. A red banner appears if the connection drops, and it catches up automatically on reconnect.
- **Order history** loaded for staff is the last 200 days (covers the 6-month report).
- **Supabase free plan** pauses projects after about a week of inactivity — use a paid plan for a live business.
- **Backups/rate limits:** consider enabling Supabase backups and CAPTCHA/rate limiting if the public menu gets abused.

## Project layout (new/changed)
```
supabase/schema.sql                    database, security rules, place_order(), realtime
supabase/functions/staff-admin/        Edge Function: create/remove staff logins
src/lib/{supabase,db,mappers}.ts       all database access
src/contexts/StoreContext.tsx          shared store (same useStore() hook, now live)
src/contexts/StaffAuthContext.tsx      Supabase Auth for staff + roles
src/hooks/useTrackedOrder.ts           customer order tracking
src/pages/staff/StaffLogin.tsx         staff sign-in
src/pages/admin/Staff.tsx              manage staff logins (admin)
```
