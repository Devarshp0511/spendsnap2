<div align="center">

<img src="assets/icon.png" width="96" alt="SpendSnap icon" />

# SpendSnap

**An AI-powered expense tracker that logs your spending for you.**

Snap a receipt, paste a bank SMS, or just ask: *"Where did my money go this week?"*

![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_Postgres-3ECF8E?logo=supabase&logoColor=white)
![Claude](https://img.shields.io/badge/AI-Claude_Sonnet-D97757)
![Platforms](https://img.shields.io/badge/platforms-Android%20%7C%20iOS-lightgrey)

</div>

---

## Why SpendSnap

Most expense apps fail for one reason: **logging is tedious**, so people stop. SpendSnap removes the typing. It captures expenses from the sources they already exist in (paper receipts and bank or UPI SMS alerts), categorises them automatically, and puts an AI finance assistant on top of your real data so you can ask questions in plain language.

## Features

### AI and automation
| Feature | How it works |
|---|---|
| **AI finance assistant** | Chat tab powered by **Claude Sonnet**. Every request carries a structured context built from *your* data: today, week and month totals, top 5 categories, the 10 most recent transactions and your daily budget. Answers use your actual numbers instead of generic advice. |
| **Receipt scanning (OCR)** | Take a photo or pick one from the gallery. OCR (OCR.space, Engine 2, tuned for receipts) reads the text, then a parser extracts the **total**, **merchant** and **category** and gives a high, medium or low confidence score. |
| **Bank and UPI SMS parsing** | Paste one or more transaction SMS messages. The parser detects **debit or credit**, the **amount** (₹, Rs, INR), the **merchant or UPI handle** and the **bank** (HDFC, SBI, ICICI, Axis, Kotak, PhonePe, GPay, Paytm). |
| **Auto-categorisation** | A keyword model sorts each expense into one of 7 categories (Food, Transport, Shopping, Bills, Health, Entertainment, Other). It is tuned for Indian merchants such as Swiggy, Zomato, Ola, Rapido, IRCTC, DMart and Jio. |
| **Spend forecasting and insights** | Projects your month-end spend from your current run rate, and shows your biggest category, its share of the total, and your largest single expense. |

### Core app
- **Three ways to log:** manual entry, receipt scan or SMS paste
- **Budgets and smart notifications:** daily budget, an alert at 80% of budget, and scheduled daily digests
- **Reports:** share summaries for today, this week or this month straight from the app
- **Cloud sync:** Supabase Auth (email and password), with expenses synced to Postgres
- **Secure sessions:** auth tokens are stored in the device keychain or keystore via `expo-secure-store`
- **Polished UX:** onboarding flow, haptics, gradient UI, SVG spend charts and an expense detail screen

## Tech stack

| Layer | Tech |
|---|---|
| App | Expo SDK 54, React Native 0.81, React 19, expo-router 6 |
| Language | TypeScript |
| State | Zustand |
| Backend | Supabase (Auth, Postgres) |
| AI and ML | Claude Sonnet (Anthropic API), OCR.space, rule-based NLP parsers |
| Device APIs | expo-camera, image-picker, notifications, secure-store, haptics, sharing |
| UI | react-native-svg charts, expo-linear-gradient, Reanimated |
| Builds | EAS Build (APK for preview, AAB for production) |

## Project structure

```
app/
  (tabs)/            index · insights · ai · reports · settings
  add.tsx            manual, scan or SMS capture
  expense/[id].tsx   expense detail
  onboarding.tsx · login.tsx · splash.tsx · notifications.tsx
src/
  components/        SpendChart, ExpenseRow, shared UI
  constants/         theme, categories, types
  store/             useStore (expenses, settings), useAuthStore (session)
  utils/             ocr.ts · smsParser.ts · notifications.ts · supabase.ts · helpers.ts
```

## Getting started

```bash
git clone https://github.com/Devarshp0511/spendsnap.git
cd spendsnap
npm install
cp .env.example .env     # add your own keys
npx expo start
```

| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_OCR_SPACE_API_KEY` | ocr.space/ocrapi (free tier) |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | console.anthropic.com (local development only) |

> ⚠️ `EXPO_PUBLIC_*` variables are bundled into the app. For production, move the Claude call to a Supabase Edge Function so the key never ships to devices.

### Database (Supabase SQL editor)
```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, currency text, currency_symbol text,
  daily_budget numeric, phone text, updated_at timestamptz default now()
);
create table expenses (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null, label text, category text, merchant text, note text,
  capture_method text, created_at timestamptz default now()
);
alter table profiles enable row level security;
alter table expenses enable row level security;
create policy "own profile"  on profiles for all using (auth.uid() = id);
create policy "own expenses" on expenses for all using (auth.uid() = user_id);
```

## Roadmap
- [ ] Claude calls through a Supabase Edge Function (server-side key, rate limiting)
- [ ] Automatic SMS reading on Android, with user consent
- [ ] ML categoriser trained on user corrections
- [ ] Anomaly detection and recurring-bill detection
- [ ] Voice capture ("spent 250 on lunch")

## Author

**Devarsh Patel**, AI/ML and backend engineer · [GitHub](https://github.com/Devarshp0511) · [LinkedIn](https://www.linkedin.com/in/devarsh-patel-6461332b8/)
