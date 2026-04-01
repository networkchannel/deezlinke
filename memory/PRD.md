# DeezLink - PRD (Product Requirements Document)

## Original Problem Statement
Build a full-stack e-commerce web app called "DeezLink" inspired by Deezer's visual theme. The platform sells promotional Deezer Premium activation links. Base price: 5€ for 1 link. Activation links are **guaranteed minimum 1 month** but can last much longer.

## Key Requirements
- OxaPay crypto integration for checkout (Sandbox mode active)
- i18n via IP detection (French, English, Arabic)
- Dynamic, gamified bulk pricing (degressive tiers)
- Admin dashboard
- Fast UX and instant link delivery
- Magic Link authentication for users
- Admin auto-login tied to IP `5.49.128.70`

## Pricing Structure (3 Options Only)
1. **Le Single**: 1 link = 5€
2. **Le Pack Famille**: 5 links = 20€ (4€/link, -20%)
3. **Custom Pack**: Slider 1-1000 links with degressive pricing:
   - 1-2: 5.00€/link
   - 3-4: 4.33€/link
   - 5-9: 4.00€/link
   - 10-24: 3.50€/link
   - 25-49: 3.00€/link
   - 50-99: 2.50€/link
   - 100-249: 2.00€/link
   - 250-499: 1.80€/link
   - 500+: 1.50€/link (up to 70% savings)

## Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion + Shadcn UI + react-i18next
- **Backend**: FastAPI + Motor (MongoDB) + JWT Auth
- **DB**: MongoDB (users, orders, links collections)
- **Payment**: OxaPay Crypto Gateway (Sandbox)
- **GeoIP**: ip-api.com (free)

## What's Been Implemented
- [x] Full-stack React + FastAPI + MongoDB setup
- [x] Deezer-inspired dark UI with lime/rose accents, noise overlay, glass-morphism
- [x] OxaPay crypto checkout flow (sandbox mode)
- [x] i18n via IP detection (FR, EN, AR) with react-i18next
- [x] IP-based admin auto-login (5.49.128.70)
- [x] Passwordless Magic Link auth (logic in place, SMTP not connected)
- [x] Exactly 3 pricing options (Single, Famille, Custom 1-1000)
- [x] Degressive pricing tiers with real-time calculation
- [x] Product description: "Minimum 1 month guaranteed" (updated from 3 months)
- [x] Guarantee badges on Offers page cards
- [x] Admin dashboard with stats, order management, link import
- [x] Order history by email
- [x] Landing page with trending artists, FAQ, stats, how-it-works
- [x] Footer with proper i18n translations
- [x] Responsive mobile design

## Installation Date
- 2026-04-01: Cloned from GitHub, installed dependencies, configured environment

## Upcoming Tasks (Backlog)
- [ ] **P0 - SMTP Integration for Magic Link**: User mentioned they'll add SMTP later for actual email delivery
- [ ] **P1 - OxaPay Production Mode**: Switch from sandbox to live when ready
- [ ] **P2 - Backend Refactoring**: Split server.py (~670 lines) into APIRouters if complexity grows

## 3rd Party Integrations
- OxaPay (Payments) — Sandbox mode, requires user API key for production
- ip-api.com (GeoIP) — Free public API
- SMTP (Email) — Not yet integrated, user will configure later
