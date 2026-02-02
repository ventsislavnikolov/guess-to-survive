# Guess to Survive - Design Document

**Date:** 2026-02-02
**Status:** Approved
**Version:** 1.0

---

## Table of Contents

1. [Overview & Core Concepts](#1-overview--core-concepts)
2. [User Roles & Authentication](#2-user-roles--authentication)
3. [Game Creation & Settings](#3-game-creation--settings)
4. [Gameplay & Rounds](#4-gameplay--rounds)
5. [Payments & Prizes](#5-payments--prizes)
6. [Notifications](#6-notifications)
7. [Data & Football API](#7-data--football-api)
8. [UI/UX & Design](#8-uiux--design)
9. [Leaderboards & Stats](#9-leaderboards--stats)
10. [Social & Sharing](#10-social--sharing)
11. [Technical Architecture](#11-technical-architecture)
12. [Database Schema](#12-database-schema)
13. [API & Key Operations](#13-api--key-operations)
14. [Responsible Gaming & Legal](#14-responsible-gaming--legal)
15. [Landing Page & Onboarding](#15-landing-page--onboarding)
16. [Implementation Phases](#16-implementation-phases)

---

## 1. Overview & Core Concepts

**Guess to Survive** is a football prediction survival game where players pick one team to win each round. Correct pick = advance. Loss or draw = eliminated. Each team can only be picked once per game. Last survivor wins the prize pool.

**Target Market:** Football fans who enjoy prediction games, fantasy sports players, friend groups wanting competitive fun.

**Platform:** Mobile-responsive web app (PWA-style). No native apps for v1.

### Core Game Rules

- Rounds follow real EPL fixture schedule
- Only teams playing that round are available to pick
- Round locks at first match kickoff
- Unpicked players get auto-assigned (alphabetical, first unused team)
- Elimination on loss OR draw
- Single survivor takes prize pool
- Multiple survivors at season end split pool

### Game Types

- **Paid** - Entry fee (€1-€100), winner takes pool minus Stripe fees
- **Free** - No entry, no prize (practice/casual)

### Wipeout Handling (configurable per game)

- **Split mode** - Pool splits among last-round survivors
- **Rebuy mode** - 24h rebuy window. 2+ rebuyers = game continues. 0-1 = split among last survivors, single rebuyer refunded. Non-rebuyers forfeit entry.

---

## 2. User Roles & Authentication

### Authentication Methods

- Email/password with verification
- Google OAuth
- Future: Apple Sign-In

### Email Verification

- Required to join paid games
- Optional for free games (low friction trial)

### User Roles (v1)

- **User** - Default role. Can play, create games, join games.
- **Game Manager** - Automatic for game creator. Can kick players, view all picks after deadline, edit game settings before start.

### Future Admin Role (planned, not v1)

- Global admin can manage all games, users, payments
- Admin dashboard for platform management
- Role assigned via database (schema ready for it)

### Profile

- Unique username (3-20 chars, alphanumeric + underscores, profanity filter)
- Avatar (upload or preset selection)
- Stats: games played, games won, win rate, total winnings, longest survival streak
- Spending history visible
- Future: bio, favorite team, social links

### Account Management

- Self-service account deletion (GDPR compliant)
- Soft-delete with anonymization, hard-delete after grace period
- Self-exclusion option (block from paid games for X days)

### Fraud Prevention (v1)

- One account per email
- Rate limit signups per IP
- Flag suspicious patterns
- Manual review for large payouts
- Future: phone verification, ID check for high-value payouts

---

## 3. Game Creation & Settings

### Game Settings (set by manager at creation)

| Setting | Options | Default |
|---------|---------|---------|
| Name | Free text | Required |
| Visibility | Public / Private | Public |
| Entry Fee | €0 (free) or €1-€100 | €0 |
| Currency | EUR / GBP / USD | EUR |
| Starting Round | Any upcoming EPL round | Next round |
| Min Players | 2-unlimited | 2 |
| Max Players | Optional cap or unlimited | Unlimited |
| Wipeout Mode | Split / Rebuy | Split |
| Pick Visibility | Hidden until deadline / Visible immediately | Hidden |

### Private Games

- Invite via shareable link (unique URL with game token)
- Invite via code (short alphanumeric, displayed in UI)
- Only invited users can join
- Manager can kick players (kicked = refunded)

### Public Games

- Visible in game browser
- Anyone can join (if not full)
- Spectators can view without joining

### Game States

- `pending` - Accepting players, before starting round
- `active` - Game in progress
- `completed` - Winner(s) determined, payouts processed
- `cancelled` - Didn't meet minimum players by first kickoff, all entries refunded

### Manager Tools

- View all players and their status
- Kick player (with reason, triggers refund)
- View all picks after round deadline
- Edit game settings (only before game starts)

---

## 4. Gameplay & Rounds

### Round Lifecycle

1. **Round Opens** - Fixtures synced from football-data.org, players see available teams
2. **Players Pick** - Select one team to win (unlimited changes allowed)
3. **Round Locks** - At first match kickoff, no more changes
4. **Auto-Assign** - Unpicked players assigned first available team alphabetically (skipping already-used teams)
5. **Matches Play** - Real matches occur
6. **Results Sync** - System pulls results after all matches complete
7. **Elimination** - Players whose team lost or drew are eliminated
8. **Next Round** - Survivors continue, repeat until winner

### Pick Rules

- One team per round
- Can only pick teams playing that round
- Cannot reuse a team already picked in this game
- Unlimited changes before deadline
- Pick visibility: hidden or visible (game setting)

### Postponed Matches

- If picked team's match is postponed after selection: pick voided
- Player notified via email + in-app notification
- Must repick before deadline (or get auto-assigned)

### Auto-Assign Logic

```
1. Get list of teams playing this round
2. Sort alphabetically (A-Z)
3. Find first team player hasn't used
4. Assign that team
5. If all teams used → player eliminated (edge case)
```

### Elimination

- Team loses → eliminated
- Team draws → eliminated
- Team wins → survives to next round

---

## 5. Payments & Prizes

### Payment Flow (Joining Paid Game)

1. User clicks "Join Game"
2. Checkout shows: Entry fee + Stripe processing fee
3. User pays via Stripe (cards, Apple Pay, Google Pay, PayPal)
4. On success: user added to game
5. On failure: user not added, can retry

### Fee Structure

- Entry fee: €1-€100 (set by manager)
- Stripe fees: ~2.9% + €0.25 (paid by user)
- Example: €10 entry → €10.54 total at checkout

### Currencies

- EUR, GBP, USD
- Manager selects currency when creating game
- All transactions in game's currency
- Stripe handles card currency conversion

### Prize Pool

- Pool = sum of all entry fees (Stripe fees not included in pool)
- Single survivor: wins entire pool
- Multiple survivors (season end): split pool equally
- Game cancelled (min players not met): full refunds

### Rebuy Mode Payouts

- Non-rebuyers forfeit entry (stays in pool)
- Rebuyers pay entry fee again
- New pool = original entries + rebuy entries + forfeited entries
- If <2 rebuy: game ends, last-round survivors split, single rebuyer refunded

### Payouts via Stripe Connect

- Winners onboard to Stripe Connect (link bank/card)
- Platform triggers payout after game completes
- Stripe handles identity verification, tax compliance
- Winner receives funds directly

### Refund Scenarios

- Game cancelled (min players not met)
- Player kicked by manager
- Single rebuyer when <2 total rebuy

---

## 6. Notifications

### Notification Channels

- **Email** - Time-sensitive, external reach
- **In-App** - Bell icon with notification center, unread count, mark as read

### Email Notifications

| Event | Timing | Content |
|-------|--------|---------|
| Round Reminder | 24h before first kickoff | "Round X opens, make your pick" |
| Pick Confirmed | Immediately | "You picked [Team] for Round X" |
| Pick Voided (postponement) | Immediately | "Your pick was voided, repick required" |
| Round Results | After all matches complete | "Round X complete. [Team] [won/lost/drew]. You [advance/are eliminated]" |
| Game Won | After game ends | "Congratulations! You won [Game]. Prize: €X" |
| Elimination | After round results | "You've been eliminated from [Game] in Round X" |
| Kicked from Game | Immediately | "You were removed from [Game]. Reason: [reason]. Entry refunded." |
| Payout Sent | After payout processed | "Your winnings (€X) have been sent" |

### In-App Notifications (additional)

- Player joined your game
- Player eliminated (for managers)
- Game starting soon
- Game cancelled

### Notification Preferences (future)

- Toggle email notifications on/off
- For v1: all notifications enabled, no granular control

---

## 7. Data & Football API

### Data Source

- football-data.org (free tier)
- EPL coverage included
- Rate limit: 10 calls/minute

### Sync Strategy (scheduled, not on-demand)

| Data | Frequency | Trigger |
|------|-----------|---------|
| Season fixtures | Once at season start, then weekly | Cron job |
| Upcoming round fixtures | Daily | Cron job |
| Match results | After matchday (when all matches done) | Cron job or manual |
| Team data | Once at season start | Manual/cron |

### Data Stored Locally

- Leagues (id, name, code, season)
- Teams (id, name, short_name, crest_url, league_id)
- Fixtures (id, round, home_team, away_team, kickoff_time, status, score)
- Results derived from fixtures

### Sync Process

1. Cron job triggers at scheduled time
2. Fetch data from football-data.org
3. Upsert into Supabase PostgreSQL
4. Update game states if results affect eliminations

### Fallback (API down)

- Show "Results pending" in UI
- Admin manually enters results via Supabase dashboard
- Sync resumes when API recovers

### Round Detection

- API provides matchday/round number
- System groups fixtures by round
- Round opens when fixtures available, locks at first kickoff

---

## 8. UI/UX & Design

### Platform

- Mobile-responsive web app
- PWA capabilities (installable, offline-aware)
- No native apps for v1

### Tech Stack (Frontend)

- React + Vite
- TanStack Router, Query, Table
- Tailwind CSS + Shadcn/ui components
- Hosting: Vercel

### Theming

- Auto-detect system preference (light/dark)
- Manual toggle in settings (light/dark/system)

### Key Pages

| Page | Purpose |
|------|---------|
| Landing | Hero, how it works, featured games, CTA |
| How It Works | 4-5 step explainer with visuals |
| Sign Up / Login | Auth forms |
| Game Browser | Public games list with filters |
| Game Detail | Leaderboard, picks, status, join CTA |
| Make Pick | Team selection for current round |
| My Games | User's active and past games |
| Create Game | Game settings form |
| Profile | Stats, avatar, settings |
| Notifications | In-app notification center |

### Game Browser Filters

- Free / Paid
- Entry fee range
- Status (pending / active)
- Sort: newest, most players, starting soonest

### Error Handling

- Toast notifications for transient errors
- Inline validation for forms
- Non-blocking, dismissible

### Accessibility

- WCAG 2.1 AA basics
- Proper contrast, keyboard nav, semantic HTML
- Screen reader labels, focus states
- Shadcn/Radix provides foundation

---

## 9. Leaderboards & Stats

### Per-Game Leaderboard

| Column | Description |
|--------|-------------|
| Rank | Position (by rounds survived) |
| Player | Username + avatar |
| Status | Alive / Eliminated |
| Rounds Survived | Count |
| Current Pick | Team (shown after deadline, or if visibility = immediate) |
| Teams Used | List of previously picked teams |

### Sorting

- Alive players first, then eliminated
- Within each group: by rounds survived (desc)
- Ties: alphabetical by username

### Visibility Rules

- Picks hidden until deadline (default) or visible immediately (game setting)
- Eliminated players' full pick history always visible
- Alive players' past picks visible, current pick depends on setting

### Global Profile Stats

| Stat | Description |
|------|-------------|
| Games Played | Total games joined |
| Games Won | Games where user was sole/shared winner |
| Win Rate | Games Won / Games Played |
| Total Winnings | Sum of prize money received |
| Longest Streak | Most consecutive rounds survived (across all games) |
| Current Games | Active games count |

### Public vs Private

- Profile stats visible to other users
- Spending history private (only visible to account owner)
- Game history visible (which games played, results)

---

## 10. Social & Sharing

### Shareable Content

**1. Game Invites:**
- Unique URL: `guesstosurvive.com/game/[code]`
- Short code for verbal sharing: `ABC123`
- Open Graph preview card includes:
  - Game name
  - Entry fee (or "Free")
  - Player count
  - Starting round
  - Platform branding

**2. Personal Results:**
- Shareable result card after elimination/win
- Includes: game name, rounds survived, final pick, outcome
- Format: "I survived 8 rounds in [Game]!"
- Share to: Twitter/X, Facebook, WhatsApp, copy link

### Spectator Mode

- Public games viewable by anyone (no login required)
- Can see: leaderboard, picks (after deadline), results
- Cannot see: private game details
- CTA: "Join this game" or "Sign up to play"

### Social Features NOT in v1

- Friends list
- Follow players
- Direct messaging
- Activity feed
- Achievements/badges

### Viral Hooks

- Easy invite sharing
- Result cards designed for social media
- "X players remaining" tension updates
- Winner announcements

---

## 11. Technical Architecture

### Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite, TanStack (Router, Query, Table), Tailwind, Shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) |
| Payments | Stripe (Checkout, Connect) |
| Football Data | football-data.org API |
| Hosting | Vercel (frontend), Supabase Cloud (backend) |
| Analytics | PostHog or OpenPanel |
| Email | Supabase + Resend (or similar) |

### Supabase Services Used

- **PostgreSQL** - All data storage
- **Auth** - Email/password + Google OAuth
- **Edge Functions** - Scheduled jobs, Stripe webhooks, complex logic
- **Row Level Security (RLS)** - Data access control
- **Realtime** - Live leaderboard updates (optional)

### Key Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| sync-fixtures | Cron (daily) | Fetch fixtures from football-data.org |
| sync-results | Cron (post-matchday) | Fetch results, process eliminations |
| process-round | After results sync | Auto-assign, eliminate players, update game state |
| stripe-webhook | Stripe events | Handle payments, refunds, payouts |
| send-notifications | Various | Trigger emails and in-app notifications |

### Security

- RLS policies on all tables
- Verified email required for paid games
- Stripe handles payment security (PCI compliant)
- Rate limiting on auth and API endpoints

---

## 12. Database Schema

### Core Tables

```sql
-- Users table
users
├── id (uuid, PK)
├── email (unique)
├── username (unique)
├── avatar_url
├── email_verified (boolean)
├── role (enum: user, admin) -- for future admin
├── self_excluded_until (timestamp, nullable)
├── created_at
└── updated_at

-- Leagues table
leagues
├── id (PK)
├── name ("Premier League")
├── code ("PL")
├── country
└── current_season

-- Teams table
teams
├── id (PK)
├── league_id (FK)
├── name
├── short_name
├── crest_url
└── external_id (football-data.org ID)

-- Fixtures table
fixtures
├── id (PK)
├── league_id (FK)
├── round (int)
├── home_team_id (FK)
├── away_team_id (FK)
├── kickoff_time (timestamp)
├── status (scheduled, live, finished, postponed)
├── home_score (nullable)
├── away_score (nullable)
└── external_id

-- Games table
games
├── id (uuid, PK)
├── name
├── code (unique, short invite code)
├── manager_id (FK users)
├── visibility (public, private)
├── entry_fee (decimal)
├── currency (EUR, GBP, USD)
├── starting_round (int)
├── current_round (int)
├── min_players (int)
├── max_players (int, nullable)
├── wipeout_mode (split, rebuy)
├── pick_visibility (hidden, visible)
├── status (pending, active, completed, cancelled)
├── prize_pool (decimal)
├── rebuy_deadline (timestamp, nullable)
├── created_at
└── updated_at

-- Game Players table
game_players
├── id (PK)
├── game_id (FK)
├── user_id (FK)
├── status (alive, eliminated, kicked)
├── eliminated_round (nullable)
├── kick_reason (nullable)
├── joined_at
├── is_rebuy (boolean)
└── stripe_payment_id

-- Picks table
picks
├── id (PK)
├── game_id (FK)
├── user_id (FK)
├── round (int)
├── team_id (FK)
├── auto_assigned (boolean)
├── result (pending, won, lost, draw, voided)
└── created_at

-- Notifications table
notifications
├── id (PK)
├── user_id (FK)
├── type (enum)
├── title
├── body
├── data (jsonb)
├── read (boolean)
└── created_at

-- Payouts table
payouts
├── id (PK)
├── game_id (FK)
├── user_id (FK)
├── amount (decimal)
├── currency
├── status (pending, processing, completed, failed)
├── stripe_transfer_id
└── created_at
```

---

## 13. API & Key Operations

### Authentication

- `POST /auth/signup` - Email/password registration
- `POST /auth/login` - Email/password login
- `POST /auth/oauth/google` - Google OAuth
- `POST /auth/verify-email` - Verify email token
- `POST /auth/forgot-password` - Request reset
- `POST /auth/reset-password` - Reset with token

### Games

- `GET /games` - List public games (with filters)
- `GET /games/:id` - Game details + leaderboard
- `POST /games` - Create game
- `PATCH /games/:id` - Update game (manager, before start)
- `POST /games/:id/join` - Join game (triggers Stripe for paid)
- `POST /games/:id/leave` - Leave game (before start only)
- `POST /games/:id/kick/:userId` - Kick player (manager)
- `POST /games/:id/rebuy` - Rebuy after wipeout

### Picks

- `GET /games/:id/picks` - Get user's picks for game
- `GET /games/:id/picks/available` - Teams available this round
- `POST /games/:id/picks` - Make/update pick
- `GET /games/:id/leaderboard` - All players, picks, status

### Users

- `GET /users/me` - Current user profile + stats
- `PATCH /users/me` - Update profile (username, avatar)
- `DELETE /users/me` - Delete account
- `POST /users/me/self-exclude` - Self-exclusion

### Notifications

- `GET /notifications` - User's notifications
- `PATCH /notifications/:id/read` - Mark as read
- `POST /notifications/read-all` - Mark all read

### Webhooks (internal)

- `POST /webhooks/stripe` - Payment events
- `POST /webhooks/cron/sync-fixtures` - Scheduled sync
- `POST /webhooks/cron/sync-results` - Scheduled sync
- `POST /webhooks/cron/process-rounds` - Auto-assign, eliminations

---

## 14. Responsible Gaming & Legal

### Responsible Gaming Features (v1)

| Feature | Description |
|---------|-------------|
| Spending History | Visible in profile - all paid game entries |
| Self-Exclusion | User can block themselves from paid games for X days |
| Entry Fee Limits | Platform-enforced €1-€100 cap |
| Clear T&Cs | Game rules, skill-based nature, no guaranteed returns |

### Future Enhancements

- Phone verification for large payouts
- ID verification for high-value games
- Cooling-off periods
- Reality checks during play
- Deposit limits

### Legal Considerations

| Area | Approach |
|------|----------|
| Skill vs Gambling | Position as skill-based prediction game (user knowledge matters) |
| Terms of Service | Required acceptance at signup |
| Privacy Policy | GDPR-compliant, data usage transparency |
| Age Verification | 18+ required (self-declared at signup, future: verification) |
| Geographic Restrictions | May need to block certain jurisdictions |

### GDPR Compliance

- Self-service account deletion
- Data export on request (future)
- Clear consent for marketing emails
- Anonymization of deleted accounts (preserve game integrity)
- Data retention policy documented

### Disclaimer (shown at signup)

- "Guess to Survive is a game of skill. Past performance does not guarantee future results."
- "You must be 18+ to play paid games."
- "Only play with money you can afford to lose."

---

## 15. Landing Page & Onboarding

### Landing Page Structure

```
┌─────────────────────────────────────┐
│ Nav: Logo | How It Works | Login    │
├─────────────────────────────────────┤
│ HERO                                │
│ "Survive. Predict. Win."            │
│ Tagline + CTA: "Start Playing"      │
├─────────────────────────────────────┤
│ HOW IT WORKS (3-4 steps)            │
│ 1. Pick a team to win               │
│ 2. Win = advance, lose = out        │
│ 3. Each team only once              │
│ 4. Last one standing wins           │
├─────────────────────────────────────┤
│ FEATURED PUBLIC GAMES               │
│ [Game cards with join CTAs]         │
├─────────────────────────────────────┤
│ SOCIAL PROOF (future)               │
│ Testimonials, player count          │
├─────────────────────────────────────┤
│ FINAL CTA                           │
│ "Create your first game"            │
├─────────────────────────────────────┤
│ Footer: Links, legal, socials       │
└─────────────────────────────────────┘
```

### How It Works Page

- Expanded 4-5 step visual guide
- Example gameplay walkthrough
- FAQ section
- Link to full rules/T&Cs

### Onboarding Flow

1. User signs up (email/Google)
2. Redirect to "How It Works" (first time only)
3. Prompt to join a free public game or create one
4. In-game: subtle hints on first pick ("Pick wisely - you can't use this team again")

**No interactive tutorial** - rules are simple enough for a static explainer.

---

## 16. Implementation Phases

### Phase 1: Foundation (Week 1-2)

- Project setup (Vite, TanStack, Tailwind, Shadcn)
- Supabase setup (project, database, auth)
- Auth flows (email, Google, verification)
- Base UI components and layout
- User profile (username, avatar)

### Phase 2: Core Game (Week 3-4)

- Database schema implementation
- Football data sync (fixtures, teams, results)
- Game CRUD (create, list, detail, join)
- Pick system (select team, change, lock)
- Auto-assign logic
- Elimination processing
- Per-game leaderboard
- Game browser with filters

### Phase 3: Payments (Week 5)

- Stripe integration (Checkout)
- Paid game entry flow
- Stripe Connect for payouts
- Refund handling (cancellation, kicks)
- Fee calculation and display

### Phase 4: Polish (Week 6)

- Email notifications (Resend)
- In-app notification center
- Global profile stats
- Social sharing (OG cards, result sharing)
- Responsible gaming features
- Dark mode
- Error handling refinement

### Phase 5: Launch Prep (Week 7)

- Landing page
- How it works page
- Legal pages (T&Cs, Privacy)
- Analytics setup (PostHog/OpenPanel)
- Testing (manual + key flows)
- Beta users
- Production deployment

### Post-Launch (Future)

- Admin dashboard
- Full profiles (bio, favorite team)
- Strict verification (phone, ID)
- Additional leagues
- Native apps

---

## Appendix: Decisions Summary

| Decision | Choice |
|----------|--------|
| League | EPL only (v1) |
| Game types | Paid + Free |
| Auth | Email + Google |
| Payment model | Direct payment (no tokens) |
| Wipeout handling | Configurable (split or rebuy) |
| Rebuy rules | Min 2 players to continue |
| User roles | Game-level (future: global admin) |
| Auto-assign | Alphabetical, skip used teams |
| Private invites | Link + code |
| Data sync | Scheduled |
| Notifications | Email + in-app center |
| Payouts | Stripe Connect |
| Leaderboards | Per-game + global profile stats |
| Concurrent games | Unlimited |
| Min players | Manager sets (floor of 2) |
| Round lock | First match kickoff |
| Platform | Web only, mobile-responsive |
| Game start | Any upcoming round |
| Manager kick | Refunded |
| Pick changes | Unlimited before deadline |
| Postponed matches | Void + repick |
| Stripe fees | User pays |
| Entry fee limits | €1-€100 |
| Game browser | List + filters |
| Spectator mode | Public games viewable |
| Pick visibility | Configurable per game |
| Profile | Username + avatar |
| Username rules | Unique, validated |
| Round reminder | 24h before |
| Result notifications | After all matches complete |
| Responsible gaming | Basic safeguards |
| Currency | EUR/GBP/USD (manager picks) |
| Manager tools | Essential only |
| Social sharing | Invites + results |
| API fallback | Manual |
| Onboarding | Explainer page |
| Max players | Manager sets optional cap |
| Account deletion | Self-service (GDPR) |
| Email verification | Required for paid games |
| Fraud prevention | Basic (future: strict) |
| Landing page | Conversion-focused |
| Dark mode | System + manual toggle |
| Accessibility | WCAG 2.1 AA basics |
| Analytics | PostHog or OpenPanel |
| Error handling | Toasts + inline errors |

---

*Document generated: 2026-02-02*
