# DeezLink - PRD (Product Requirements Document)

## Original Problem Statement
Build a full-stack e-commerce web app called "DeezLink" inspired by Deezer's visual theme. The platform sells promotional Deezer Premium activation links. Base price: 5€ for 1 link. Activation links are **guaranteed minimum 1 month** but can last much longer.

## Key Requirements
- OxaPay crypto integration for checkout
- i18n via IP detection (French, English, Arabic)
- Dynamic, gamified bulk pricing (degressive tiers)
- Admin dashboard
- Fast UX and instant link delivery
- Magic Link authentication for users
- Admin auto-login tied to IP `5.49.128.70`
- **NEW** Loyalty/Fidelity system with 5 tiers

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

## Loyalty System (NEW - 2026-04-01)
| Tier     | Min Points | Discount |
|----------|------------|----------|
| Bronze   | 0          | 0%       |
| Silver   | 50         | 5%       |
| Gold     | 150        | 10%      |
| Platinum | 500        | 15%      |
| Diamond  | 1000       | 20%      |

**Points**: 1 point per 1€ spent. Discounts apply to all future orders.

## Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion + Shadcn UI + react-i18next
- **Backend**: FastAPI + Motor (MongoDB) + JWT Auth
- **DB**: MongoDB (users, orders, links, magic_tokens collections)
- **Payment**: OxaPay Crypto Gateway (Production mode)
- **GeoIP**: ip-api.com (free)
- **SMTP**: fauvette.o2switch.net:465 (SSL)

## What's Been Implemented
- [x] Full-stack React + FastAPI + MongoDB setup
- [x] Deezer-inspired dark UI with lime/rose accents, noise overlay, glass-morphism
- [x] OxaPay crypto checkout flow (production mode with key)
- [x] i18n via IP detection (FR, EN, AR) with react-i18next
- [x] IP-based admin auto-login (5.49.128.70)
- [x] Passwordless Magic Link auth with SMTP email sending
- [x] SMTP Integration (fauvette.o2switch.net:465)
- [x] Exactly 3 pricing options (Single, Famille, Custom 1-1000)
- [x] Degressive pricing tiers with real-time calculation
- [x] Product description: "Minimum 1 month guaranteed"
- [x] Guarantee badges on Offers page cards
- [x] Admin dashboard with stats, order management, link import
- [x] Order history by email
- [x] Landing page with trending artists, FAQ, stats, how-it-works
- [x] Footer with proper i18n translations
- [x] Responsive mobile design
- [x] **NEW** Loyalty system with 5 tiers and automatic discounts
- [x] **NEW** Order confirmation emails with links

## Implementation History
- **2026-04-01**: Initial clone from GitHub repo
- **2026-04-01**: Added loyalty/fidelity system (5 tiers)
- **2026-04-01**: Integrated SMTP for magic link emails
- **2026-04-01**: Fixed IP detection with multiple header fallbacks
- **2026-04-01**: Configured OxaPay with production API key
- **2026-04-01**: Added order confirmation emails

## Upcoming Tasks (Backlog)
- [ ] **P1**: Add referral/parrainage system for viral growth
- [ ] **P2**: Backend Refactoring: Split server.py (~700 lines) into APIRouters

## 3rd Party Integrations
- OxaPay (Payments) — Production mode configured
- ip-api.com (GeoIP) — Free public API
- SMTP (Email) — fauvette.o2switch.net:465 configured

## User Personas
1. **Casual User**: Wants 1-5 Deezer Premium links for personal use
2. **Reseller**: Buys in bulk (50-500 links) for resale
3. **Admin**: Manages links inventory, views stats, processes orders
