# IRL — It's Real Love

Investor MVP for the IRL dating app. Built with Expo React Native + TypeScript.

## Quick Start

```bash
cd MyApp
npm install
npx expo start -c
```

Then press **i** for iOS Simulator or scan QR with **Expo Go** on your iPhone.

## Logo Setup

Place your logo at the project root:

```
MyApp/IRL_pastel_logo_transparent_1024.png
```

Then run:

```bash
cp IRL_pastel_logo_transparent_1024.png assets/images/logo.png
cp IRL_pastel_logo_transparent_1024.png assets/images/icon.png
```

The app will use placeholder assets until the real logo is in place.

---

## Investor Demo Script

### 1. Login
- Open app → see the IRL welcome screen with pastel gradient
- Tap **Continue with Apple** → enters the app

### 2. Browse & Like (Match Tab)
- Scroll through a Hinge-style profile feed (photos, prompts, info)
- Tap the **heart** on any module → "Send a note" modal appears
- Type a note or tap **Skip** → profile advances
- If it's a mutual like → **"It's a match!"** toast appears and a new chat is created

### 3. Filters
- Tap the **funnel icon** (top right of Match screen)
- Adjust distance, age range, height range
- Toggle ethnicity/religion chips
- Tap **Apply** → profile feed updates immediately

### 4. Refer to a Friend
- On a profile, tap the **people icon** (bottom right)
- Select a friend from your Connections list
- Tap **Send** → toast: "Sent to Sarah — she'll see this profile at the top of her stack"
- Next time the friend opens their stack, referred profiles appear first (pink banner)

### 5. Group Chat
- Go to **Chats tab** → see DM threads and group chat threads
- Open a **group chat** → 4 participants, natural icebreaker conversation
- Messages reference IRL deals and venue meetups

### 6. Venues & Deals (Venues Tab)
- See **Manhattan map** with color-coded venue markers
- Scroll the **Highlights carousel** → tap a deal card
- Map pans to venue → detail sheet slides up
- Tap **Unlock Deal** → "Deal unlocked!" toast
- Tap **Add to Plan** to save
- Filter by **vibe tags** or **category** (Restaurants, Bars, Clubs, Activities)

### 7. Missed Connections (Chats Tab → Connections)
- Switch to **Connections** segment
- See your friends list (limited view for privacy)
- Scroll to **Missed Connections** section
- Toggle **"Last 24 hours (demo)"**
- See profiles with venue & mutual count
- Tap **Add** → "Connection request sent"

### 8. Settings & Pitch
- **Settings tab** → profile card, account options
- **Unlock Premium** → beautiful gradient upsell with 7 real-world perks
- **About IRL** → investor pitch: story, growth engine, revenue model, GTM, expansion

---

## Project Structure

```
MyApp/
├── App.tsx                          # Entry point
├── app.json                         # Expo config (IRL branding)
├── assets/
│   ├── images/
│   │   ├── logo.png                 # Brand logo
│   │   └── icon.png                 # App icon
│   └── icons/
├── src/
│   ├── theme/index.ts               # Design tokens
│   ├── types/index.ts               # TypeScript interfaces
│   ├── store/index.ts               # Zustand state management
│   ├── data/
│   │   ├── profiles.ts              # 22 mock profiles
│   │   ├── venues.ts                # 12 NYC venues
│   │   └── chats.ts                 # Chat threads, connections, missed connections
│   ├── components/
│   │   ├── Avatar.tsx               # Avatar + AvatarStack
│   │   ├── Button.tsx               # Multi-variant button
│   │   ├── Card.tsx                 # Elevated/outlined card
│   │   ├── Chip.tsx                 # Selectable chip/tag
│   │   ├── SectionHeader.tsx        # Section title + action
│   │   ├── SegmentedControl.tsx     # iOS-style segment toggle
│   │   └── Toast.tsx                # Animated toast notifications
│   ├── screens/
│   │   ├── WelcomeScreen.tsx        # Login/auth (mock)
│   │   ├── MatchScreen.tsx          # Hinge-style profile browsing
│   │   ├── FiltersScreen.tsx        # Filter modal
│   │   ├── ReferScreen.tsx          # Refer to friend modal
│   │   ├── VenuesScreen.tsx         # Map + deals + venue detail
│   │   ├── ChatsScreen.tsx          # Matches + Connections tabs
│   │   ├── ChatDetailScreen.tsx     # Chat messages + input
│   │   ├── SettingsScreen.tsx       # Settings list
│   │   ├── AboutScreen.tsx          # Investor pitch copy
│   │   └── PremiumScreen.tsx        # Premium upsell
│   └── navigation/
│       └── index.tsx                # Tab + stack navigation
└── package.json
```

## QA Checklist

- [ ] App launches without crash on Expo Go
- [ ] Welcome screen shows logo/brand + 3 auth buttons
- [ ] Tapping any auth button enters the app
- [ ] Match screen loads first profile with photos + prompts
- [ ] Like + note modal works, advances to next profile
- [ ] Pass (X) advances to next profile
- [ ] Mutual like creates DM chat in Matches list
- [ ] Filters screen opens as modal, chips/steppers work
- [ ] Apply filters updates profile feed
- [ ] Refer button opens connection picker, sends referral
- [ ] Referred profile shows pink banner
- [ ] Chats tab: Matches shows DM + group threads
- [ ] Chats tab: Connections toggle stays visible
- [ ] Chat detail shows messages, send works
- [ ] Venues map renders with markers
- [ ] Highlights carousel pans map on tap
- [ ] Venue detail modal shows deal + unlock CTA
- [ ] Tag/category filters work on venue list
- [ ] Connections: friends list renders
- [ ] Missed Connections: grid with mutuals, Add button works
- [ ] Settings: all rows render, Premium/About navigate
- [ ] Premium screen shows gradient hero + perks + pricing
- [ ] About screen shows investor pitch sections
- [ ] Log Out returns to Welcome screen
- [ ] Floating tab bar renders correctly
- [ ] Toast notifications appear and auto-dismiss
- [ ] No JS errors or yellow warnings in Expo Go
