# Changelog

All notable changes to FitQuest will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.2.0-beta] — 2026-06-11

### 🎯 Core Features

#### Goal-Based Workout Programming
- **Workout programs now adapt to your fitness goal.** Selecting Strength, Muscle Gain, Endurance, or General Fitness during onboarding now produces distinctly different training sessions.
- **Strength program:** Lower rep ranges (55% of base), more sets (133%), longer rest (200%), explosive tempo.
- **Muscle Gain (Hypertrophy) program:** Moderate rep ranges (85%), more sets (115%), controlled tempo.
- **Endurance program:** Higher rep ranges (160%), fewer sets (75%), shorter rest (50%), fast tempo.
- **General Fitness program:** Passes through the balanced base program unchanged.
- Goal-specific transformations apply across all screens: Train tab, Home dashboard, Workout Player, and Workout Preview.
- Recommendation engine now includes goal-aware reasoning text explaining why a workout was selected.

#### Goal & Level Editing in Profile
- **Change your training goal or fitness level from the Profile screen.** Tap the Goal or Level badges to switch.
- Changing your goal updates the workout program (rep ranges, sets, rest times) but preserves XP, streak, and workout history.
- Changing your level adjusts exercise difficulty targets.
- Confirmation dialog warns before any change is applied.

#### Email/Password Authentication
- Email/password sign-in and registration are fully functional via Supabase.
- Google Sign-In buttons are hidden for this beta (email/password only).
- Auth state persists across app sessions.

### 🎨 Design & UI

#### Glossy Finish System
- New `GlossyOverlay` component provides a consistent glossy depth effect across the entire app.
- Subtle top-edge highlight (linear gradient from white→transparent) simulates light catching the surface.
- Optional diagonal reflection overlay for larger cards.
- Configurable opacity, highlight height, reflection toggle, and border radius.
- Applied to **all** card and panel elements across the app:
  - **Home screen:** Workout cards, stat modules, exercise library card, program structure panel.
  - **Train screen:** Workout cards, program structure panel.
  - **Profile screen:** Goal & Level badges, stat modules, segmented panels.
  - **History screen:** Empty state card, chart panels, stat modules.
  - **Body Map:** View toggle (Front/Back).
  - **Onboarding:** Goal cards, level cards, rep counter tip cards.
  - **Workout Player:** Timer badge, segmented panels.
  - **Workout Preview:** Exercise cards, overview panel, target muscles panel.
  - **Completion Animation:** XP breakdown card, level-up indicator.

#### UI Polish
- All card components now use `overflow: "hidden"` for proper gradient clipping within rounded corners.
- GlossyOverlay accepts a `borderRadius` prop for flexibility across different card sizes.
- Opacity levels are calibrated per element size (smaller elements get higher opacity for visibility).

### 🛠 Technical Improvements

#### Goal-Based Workout System (`src/data/goalWorkouts.ts`)
- New transformation layer that adjusts rep ranges, sets, rest intervals, and tempo per goal.
- Uses multiplier-based transformation on existing exercise data (no duplicate workout definitions).
- Exports `getWorkoutsForGoal(goal)` and `getWorkoutByIdForGoal(id, goal)`.
- Base workout data preserved in `src/data/exercises.ts` for utilities (progression, muscle XP, skill tree).

#### Dependency Updates
- All Expo SDK 56 packages updated to latest patch versions (11 packages updated).
- `expo-linear-gradient` installed for the glossy overlay system.
- Full `expo doctor` validation: 21/21 checks passing.

#### Auth Configuration
- Supabase auth credentials verified in `.env`.
- Email/password provider confirmed enabled in Supabase dashboard.
- Google OAuth deferred to post-beta.

### 📱 Beta Distribution

- EAS Build configured for APK generation via `preview` profile.
- APK format for direct installation (no Play Store account required).
- Internal testing build submitted to EAS cloud.

### 🐛 Bug Fixes

- **Onboarding goal selection now affects workout plans.** Previously, selecting a goal during onboarding had no effect on the workout program. This is now fully wired.

---

## [0.1.0-alpha] — 2026-06-08

### Initial Setup
- Project bootstrapped with Expo SDK 56, React Native 0.85.3, TypeScript 6.0.3.
- Expo Router for file-based navigation.
- NativeWind + Tailwind CSS for styling.
- Zustand for state management.
- Supabase client configured for auth and future cloud sync.
- Sentry integrated for crash reporting.

### Core Features
- 4-day rotating workout program (A/B/C/D) with bodyweight exercises.
- Exercise catalog with muscle group targeting, unilateral indicators, and progression data.
- Workout player with set tracking, rest timer, tempo visualization, and auto-rep counter.
- Home dashboard with recommended workout, streak display, and recovery status.
- Body map with interactive muscle selection (front/back views, 15 muscle zones).
- Skill tree system with node progression and XP-based unlocking.
- History screen with volume, XP, and duration charts, streak calendar, and weekday distribution.
- Profile with achievements, rank system, and XP progress bar.

### Gamification
- XP system with workout completion, streak bonuses, and all-exercises-complete bonus.
- Level progression with rank titles (Recruit → Operative → Veteran → Elite → Commander).
- Streak tracking with calendar visualization.
- Achievement system with milestone badges.
- Muscle XP tracking per muscle group.

### Design System
- Dark military/HUD theme with amber/green accent palette.
- Modular token system (colors, typography, spacing, themes).
- Theme switcher with dark/light/auto modes.
- Custom fonts: Bebas Neue (headings), Inter (body).
- Consistent component library: Button, StatModule, SegmentedPanel, XpBar, HUDModule, WorkoutCard, LevelBadge.

### Technical
- 150 unit tests across 11 test suites.
- Full TypeScript strict mode.
- Jest configured with Expo preset.
- ESLint + Prettier configured.
- EAS Build profiles: development, preview, production.
