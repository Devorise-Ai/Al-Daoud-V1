# Al-Daoud Court Booking System 

An AI-driven automation platform for football court reservations and event bookings, featuring WhatsApp integration and a management dashboard.

## 🚀 Features
- **AI Booking Agent**: Automated WhatsApp conversations for court bookings.
- **Voice Redirection**: Intercepts phone calls and redirects leads to WhatsApp.
- **Live Availability**: Calendar engine with conflict prevention.
- **Event Support**: Specialized packages for birthdays and tournaments.
- **Management Dashboard**: Full administrative control over courts, pricing, and rules.

## 🛠️ Tech Stack
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Environment**: Docker & Docker Compose
- **Logic**: TypeScript / Node.js

## 📦 Getting Started

### 1. Prerequisites
Ensure you have Docker and Node.js installed on your system.

### 2. Setup Database
Spin up the PostgreSQL instance using Docker:
```bash
docker-compose up -d
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Apply Schema & Seed
Sync your database with the Prisma schema and populate it with authentic Jordanian data:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

## 📊 Database Schema
The system uses 8 core tables:
- `courts`: Physical court locations and features.
- `customers`: Profiles and behavior segmentation.
- `bookings`: Central reservation records.
- `event_packages`: Pre-defined event types (Birthday, etc.).
- `event_extras`: Specific details for event bookings.
- `pricing_rules`: Dynamic pricing for peak hours.
- `conversations`: Logs of AI-customer interactions.
- `admin_users`: Manage the platform.

## 📍 Locations (Jordan)
- Abdoun Arena
- 7th Circle Stadium
- Zarqa Sport City
- Khalda Football Court
