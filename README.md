# ARCH

> Your personal calisthenics training system. Track workouts, build strength, and level up — one rep at a time.

**Built by Monarch Training Systems**

---

## Features

### 🏋️ Goal-Based Workout Programming
- **4 distinct training programs** — Strength, Muscle Gain, Endurance, and General Fitness
- Same exercises, different rep ranges, sets, rest intervals, and tempo per goal
- Programs adapt automatically when you change your goal in Profile

### 📊 Smart Training Intelligence
- **Workout recommendations** based on recovery status, streak, and recent activity
- **Training insights** — deload warnings, progression suggestions, consistency nudges
- **Recovery tracking** — optimal, moderate, or caution status based on recent sessions

### 🎮 Gamification & Progression
- **XP system** — earn experience for every workout, with streak bonuses
- **Level progression** — Recruit → Operative → Veteran → Elite → Commander
- **Streak tracking** with calendar visualization
- **Achievement system** with milestone badges
- **Muscle XP** tracking per muscle group

### 🗺️ Interactive Body Map
- **Front/back muscle visualization** with 15 muscle zones
- Color-coded development levels (active, developed, untracked)
- Tap any muscle to see exercises targeting it

### 🌳 Skill Tree
- Progressive exercise unlocking based on skill level
- Difficulty tiers: Beginner → Intermediate → Advanced
- Form checkpoints and biomechanical notes

### 📈 Analytics Dashboard
- Volume, XP, and duration charts with 7D/30D/all filters
- Streak calendar visualization
- Weekday distribution analysis
- Exercise progression tracking with double progression method

### 🔄 Cloud Sync
- **Bidirectional sync** between local storage and Supabase
- Automatic sync on login, after workouts, and on profile changes
- Live sync status indicator on Home, Profile, and History screens
- Row Level Security policies protect your data

### 🎨 Design System
- **Military/HUD dark theme** with amber/emerald/cyan/rose accent options
- **Glossy finish** across all screens for visual depth
- **Light/dark mode** support
- Custom fonts: Bebas Neue (headings), Inter (body)

### 🧠 Auto Rep Counter
- Motion sensor-based rep detection using phone accelerometer
- Manual override with +/- controls
- Calibration for different exercise types

### 🔔 Smart Notifications
- Rest timer alerts between sets
- Background timer support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 56) |
| Language | TypeScript 6.0 |
| Navigation | Expo Router |
| State | Zustand + AsyncStorage |
| Styling | NativeWind + Tailwind CSS |
| Database | Supabase (PostgreSQL + Auth) |
| Animations | Moti + Reanimated |
| Charts | react-native-chart-kit |
| Sensors | expo-sensors |
| Crash Reporting | Sentry |
| CI/CD | EAS Build + EAS Update |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/Monarch-S1/ARCH.git
cd ARCH

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
# EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Start the development server
npx expo start
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for crash reporting | No |

### Running on Device

```bash
# Android (requires Android Studio or physical device)
npx expo run:android

# iOS (requires Xcode and macOS)
npx expo run:ios

# Web
npx expo start --web
```

---

## Building for Distribution

### Development Build
```bash
npx eas build --profile development --platform android
```

### Preview Build (Beta Testing)
```bash
npx eas build --profile preview --platform android
```

### OTA Update
```bash
npx eas update --platform android --channel preview --message "Your update message"
```

---

## Project Structure

```
ARCH/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login, Register
│   ├── (tabs)/            # Home, Train, Body Map, History, Profile
│   ├── exercises/         # Exercise catalog
│   ├── onboarding/        # User onboarding flow
│   └── workout/           # Workout player and preview
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── home/          # Home screen widgets
│   │   ├── skill-tree/    # Skill tree components
│   │   ├── ui/            # Core UI components
│   │   └── workout/       # Workout-specific components
│   ├── data/              # Exercise and workout data
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Supabase, Sentry, cloud sync
│   ├── stores/            # Zustand state management
│   ├── tokens/            # Design tokens (colors, typography, spacing)
│   ├── utils/             # Utility functions
│   └── __tests__/         # Unit tests
├── supabase/
│   └── migrations/        # Database migrations (RLS policies)
└── assets/                # Fonts, icons, images
```

---

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type check
npx tsc --noEmit
```

---

## Security

- `.env` file is gitignored — never committed to version control
- Supabase Row Level Security (RLS) ensures users can only access their own data
- All auth flows use Supabase Auth with email/password
- Sentry DSN is safe to expose (only sends error reports)

---

## License

MIT License — Copyright (c) 2026 ARCH — Monarch Training Systems

---

## Support

For bug reports and feedback, use the in-app feedback button or open an issue on GitHub.
