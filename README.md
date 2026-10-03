# Telegram B2C Mini App — E-Commerce

A full-featured B2C e-commerce Telegram Mini App built with modern web technologies.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Bot | Grammy (Telegram Bot framework) |
| State | Zustand |
| Styling | Vanilla CSS with custom properties |

## Project Structure

```
catalog-tgbot/
├── server/          # Express backend
│   ├── prisma/      # Database schema & migrations
│   ├── src/
│   │   ├── bot/     # Telegram bot
│   │   ├── config/  # Configuration
│   │   ├── middleware/ # Auth, error handling, uploads
│   │   ├── routes/  # API routes
│   │   └── utils/   # Utilities
│   └── uploads/     # Image storage
├── client/          # React frontend (Telegram Mini App)
│   └── src/
│       ├── api/     # API client
│       ├── components/ # Reusable UI components
│       ├── hooks/   # Custom hooks
│       ├── i18n/    # Localization (uz/ru/en)
│       ├── pages/   # Customer & admin pages
│       ├── store/   # Zustand state
│       └── styles/  # CSS files
└── .env.example     # Environment template
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup
```bash
createdb catalog_tgbot
```

### 2. Server Setup
```bash
cd server
cp .env .env  # Edit with your values
npm install
npx prisma db push
npx prisma db seed  # Optional: load sample data
npm run dev
```

### 3. Client Setup
```bash
cd client
npm install
npm run dev
```

### 4. Environment Variables
Copy `.env.example` to `server/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot token from @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID for admin notifications |
| `TELEGRAM_MINI_APP_URL` | URL where the Mini App is hosted |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT tokens |

## Features

### Customer App
- 🏠 Home with banners, categories, products, news
- 🔍 Product search (multilingual)
- 📦 Category browsing
- ❤️ Favorites
- 🛒 Basket with quantity management
- 📋 Order placement & history
- 💳 Bank account payment info
- 👤 Profile with delivery info
- 🌐 3 languages (Uzbek, Russian, English)
- 🎨 Light/Dark theme

### Admin Panel
- 📊 Dashboard with statistics
- 🏷️ Product management
- 📂 Category management
- 📏 Unit management
- 📦 Order management with status updates
- 👥 User management
- 📰 News management
- 🖼️ Banner management
- 🏦 Bank account management
- 📱 Telegram order notifications

## Localization
The app supports three languages:
- 🇺🇿 O'zbekcha (Uzbek)
- 🇷🇺 Русский (Russian)
- 🇬🇧 English

All UI strings and database content (product names, descriptions, categories, etc.) are localized.

## Security
- Telegram WebApp initData validation (HMAC-SHA256)
- JWT authentication
- Role-based access control (Customer/Admin/Super Admin)
- Backend price validation
- Input sanitization
- Secure file uploads
