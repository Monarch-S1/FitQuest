# ARCH Beta Launch Spec

**Date:** June 12, 2026  
**Status:** Planning  
**Timeline:** Within 1 month (quality first, no hard deadline)  
**Platform:** Android only  
**Distribution:** APK via EAS Build → shared download link  
**Testers:** 2–5 people (internal testing, small group)

---

## 1. Executive Summary

ARCH is a calisthenics training app built with Expo/React Native. The goal is to ship a beta to 2–5 internal testers on Android. Two critical blockers must be resolved first: **authentication is not functional**, and **onboarding goal selection does not affect the workout program**. This spec covers everything needed to go from current state to a ship-ready beta.

---

## 2. Critical Blockers (Must Fix Before Beta)

### 2.1 — Authentication Is Not Functional

**Problem:** Auth (Google Sign-In + Email/Password) is coded but not working end-to-end. The user has a Supabase project but is unsure if auth providers are properly configured.

**What needs to happen:**

1. **Verify Supabase project configuration:**
   - Confirm email/password auth is enabled in Supabase Dashboard → Authentication → Providers
   - Confirm Google OAuth is configured (Client ID from Google Cloud Console)
   - Verify the redirect URI is correctly set in Supabase (`arch://auth/callback`)

2. **Set environment variables:**
   - Ensure `.env` contains valid `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Restart Metro with `-c` flag to clear cache

3. **End-to-end auth flow to verify:**
   - [ ] New user can sign up with email/password → redirected to onboarding
   - [ ] Existing user can sign in with email/password → redirected to tabs
   - [ ] Google Sign-In opens OAuth flow → returns to app → authenticated
   - [ ] Auth state persists across app restarts (AsyncStorage + Supabase session)
   - [ ] Sign out works → returns to login screen → data preserved locally

4. **Edge cases to handle:**
   - [ ] User signs up with Google, then tries email/password with same email → graceful error
   - [ ] Network failure during auth → fallback or clear error message
   - [ ] Expired session → auto-refresh or redirect to login

**Files involved:**
- `src/services/supabase.ts` — auth methods (already implemented, needs config)
- `app/(auth)/login.tsx` — login screen (already implemented)
- `app/(auth)/register.tsx` — registration screen (already implemented)
- `app/index.tsx` — auth gate/routing (already implemented)

---

### 2.2 — Onboarding Goal Selection Does Not Affect Workouts

**Problem:** During onboarding, users select a fitness goal (strength, muscle gain, endurance, general) but the 4 workout programs (A–D) remain identical regardless of selection. The goal is stored but never used to modify programming.

**Decision:** Create **separate workout programs per goal** using evidence-based calisthenics programming principles.

**Programming variables to adjust per goal:**

| Variable | Strength | Muscle Gain (Hypertrophy) | Endurance | General |
|---|---|---|---|---|
| Rep ranges | 3–5 reps (hard variations) | 8–12 reps (moderate) | 15–25 reps (easier variations) | 8–15 reps (balanced) |
| Sets | 4–6 sets | 3–4 sets | 2–3 sets | 3 sets |
| Rest periods | 180s (3 min) | 90s (90 sec) | 45s (45 sec) | 90s (balanced) |
| Tempo | Explosive concentric, slow eccentric | Controlled (3-0-2-0) | Steady/rhythmic, minimal pause | Standard (3-1-1-0) |
| Exercise difficulty | Hardest progressions (archer push-up, Nordic curl) | Moderate (push-up, pull-up) | Easiest variations (incline push-up, band pull) | Moderate (standard) |
| Total volume | High (more sets) | Moderate | Lower per set, higher total reps | Moderate |

**Implementation approach:**

1. **Extend the `Exercise` type** to support goal-based variants OR create a goal-based workout generator
2. **Create 4 goal-specific workout sets** (Strength A–D, Hypertrophy A–D, Endurance A–D, General A–D) — or generate them programmatically from the existing exercise library
3. **Update `getRecommendation()`** to factor in the user's selected goal
4. **Update the Train screen** to show the goal-appropriate workouts
5. **Update the Home screen** recommendation card to reference the user's goal

**Key design decision:** The user chose "Create separate workout programs" over "adjust existing workouts." This means each goal gets its own set of workout definitions with different rep ranges, sets, rest, and potentially different exercise variations.

**Files involved:**
- `src/data/exercises.ts` — workout definitions (major changes needed)
- `src/utils/recommendations.ts` — recommendation logic
- `app/(tabs)/train.tsx` — train screen (references workout data)
- `app/(tabs)/index.tsx` — home screen (references workout data)
- `src/stores/useUserStore.ts` — goal is stored but not used

---

## 3. Feature Requirements

### 3.1 — Goal Changeable in Profile (with Warning)

**Requirement:** Users can change their fitness goal and level in Profile settings after onboarding.

**Behavior:**
- Add a "Change Goal" and "Change Level" option in Profile → Identity section
- When user changes goal, show a warning dialog:
  > "Changing your goal will update your workout program. Your current progress (XP, streak, workout history) will be preserved, but the exercises and rep ranges in your workouts will change to match your new goal. Continue?"
- Confirm → update goal in store → workout data refreshes on next navigation
- Cancel → no change

**Files involved:**
- `app/(tabs)/profile.tsx` — add goal/level editing UI

---

### 3.2 — Feedback/Bug Report Button

**Requirement:** Beta testers need a way to report issues directly from the app.

**Implementation:**
- Add a "Send Feedback" / "Report a Bug" button in Profile screen
- Opens a modal or action sheet with:
  - Text input for describing the issue
  - Option to attach a screenshot (expo-image-picker)
  - "Send" button → opens email composer (expo-mail-composer) or sends to a feedback endpoint
- Simplest approach: `mailto:` link pre-filled with subject `[ARCH Beta] Bug Report` and the user's description

**Files involved:**
- `app/(tabs)/profile.tsx` — add feedback button
- New: `src/components/ui/FeedbackModal.tsx` (or inline)

---

## 4. Data & Infrastructure

### 4.1 — Cloud Data Sync via Supabase

**Requirement:** Workout data should sync to Supabase so it's backed up and not lost if the user reinstalls.

**Current state:** All workout data is stored locally via AsyncStorage (Zustand persist). No server sync exists.

**Implementation plan:**
1. Create Supabase tables:
   - `workout_sessions` — mirrors `WorkoutSession` type
   - `user_profiles` — mirrors onboarding data (goal, level, display name)
2. On workout completion → write session to Supabase
3. On app launch (after auth) → fetch and merge remote data with local
4. Handle conflict resolution (local wins for recent, remote wins for older)

**Scope note:** This is a significant feature. For the beta, consider a simpler approach:
- **Option A:** Full real-time sync (complex, more time)
- **Option B:** Manual backup/restore button (simpler, still useful)
- **Option C:** Defer to post-beta — keep local-only for now

**Recommendation for beta:** Option C (local-only). Full sync adds complexity and can be added after auth and workouts are solid. The user chose "Cloud sync via Supabase" but given the timeline and other priorities, deferring sync is pragmatic.

---

### 4.2 — Sentry Crash Reporting

**Requirement:** Sentry is already configured. User confirmed it's already set up.

**Action needed:**
- Verify `EXPO_PUBLIC_SENTRY_DSN` is in `.env`
- Test that crashes are captured in Sentry dashboard
- Ensure `enabled: !__DEV__` guard works (only reports in production builds)

**Files involved:**
- `src/services/sentry.ts` — already implemented
- `.env` — verify DSN is set

---

## 5. EAS Build Distribution

### 5.1 — Build Pipeline

**Current state:**
- `eas.json` has `development` (APK), `preview` (APK), and `production` (AAB) profiles
- Development build is already queued on Expo cloud

**For beta distribution:**
1. Build a `preview` profile APK: `npx eas build --profile preview --platform android`
2. Download the APK from Expo dashboard
3. Share the APK download link with testers (or host on a shared drive)

**Tester onboarding:**
- Testers need to enable "Install from unknown sources" on Android
- No Google Play Developer account needed for direct APK sharing
- Each new build → upload new APK → share updated link

---

## 6. Testing Checklist

### Auth Flow
- [ ] Email/password sign up works
- [ ] Email/password sign in works
- [ ] Google Sign-In works
- [ ] Auth state persists on restart
- [ ] Sign out works
- [ ] Error messages are clear for invalid credentials

### Onboarding
- [ ] Goal selection saves correctly
- [ ] Level selection saves correctly
- [ ] Name input works
- [ ] Rep counter tutorial displays
- [ ] Onboarding redirects to tabs correctly

### Workout System (per goal)
- [ ] Strength goal shows low-rep, high-set workouts
- [ ] Muscle gain goal shows moderate-rep, moderate-set workouts
- [ ] Endurance goal shows high-rep, low-set workouts
- [ ] General goal shows balanced workouts
- [ ] Workout player functions correctly (timer, reps, rest, completion)
- [ ] XP is calculated and awarded correctly
- [ ] Streak updates after workout completion

### Profile
- [ ] Display name shows correctly
- [ ] Goal badge reflects selected goal
- [ ] Level badge reflects current level
- [ ] Change goal/level works with warning
- [ ] Sign out button works
- [ ] Feedback button works

### Home Screen
- [ ] Recommendation reflects user's goal
- [ ] Streak display works
- [ ] Recovery status works
- [ ] Daily mission shows correctly

---

## 7. Out of Scope (Post-Beta)

These features are NOT required for beta launch:

- [ ] Cloud data sync (defer to post-beta)
- [ ] Push notifications refinement
- [ ] iOS build
- [ ] Public beta / open testing
- [ ] Google Play Store listing
- [ ] Advanced analytics dashboard
- [ ] Social features
- [ ] In-app purchases

---

## 8. Implementation Priority

| Priority | Task | Estimated Effort |
|---|---|---|
| **P0** | Fix/configure Supabase auth | 1–2 hours |
| **P0** | Verify auth flow end-to-end | 1 hour |
| **P0** | Create goal-specific workout programs | 4–6 hours |
| **P0** | Wire goal to workout recommendation | 1–2 hours |
| **P1** | Add goal change in profile with warning | 1–2 hours |
| **P1** | Add feedback/bug report button | 1–2 hours |
| **P1** | Build and distribute APK via EAS | 30 min |
| **P2** | Verify Sentry is working | 30 min |
| **P2** | End-to-end testing on physical Android device | 2–3 hours |

**Total estimated effort:** 12–18 hours of focused development

---

## 9. Success Criteria

The beta is ready to ship when:

1. ✅ Auth works end-to-end (Google + Email/password)
2. ✅ Onboarding saves goal correctly and workouts reflect the selected goal
3. ✅ Workout player is stable (no crashes, correct timing, correct XP)
4. ✅ Profile shows correct user data and allows goal changes
5. ✅ APK builds and installs successfully on Android
6. ✅ Sentry captures any crashes that occur
7. ✅ Feedback mechanism is available for testers

---

## 10. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Supabase auth misconfigured | Blocks all auth | Verify config before starting; have local fallback |
| Goal-based workouts too complex | Delays timeline | Start with rep/set/rest adjustments, not full program rewrites |
| APK doesn't install on testers' devices | Blocks testing | Test on multiple Android versions; use EAS build profiles |
| AsyncStorage data loss on reinstall | User frustration | Implement Supabase sync post-beta; warn users |
| Google OAuth redirect fails | Blocks Google sign-in | Test with Expo Go first; verify redirect URI |

---

## Appendix A: Current Codebase State

**Key files and their status:**

| File | Status | Notes |
|---|---|---|
| `src/services/supabase.ts` | ✅ Implemented | Auth methods coded, needs Supabase config |
| `app/(auth)/login.tsx` | ✅ Implemented | Email + Google login UI |
| `app/(auth)/register.tsx` | ✅ Implemented | Email + Google signup UI |
| `app/index.tsx` | ✅ Implemented | Auth gate with routing |
| `src/stores/useUserStore.ts` | ✅ Implemented | Goal stored, not used for workouts |
| `src/data/exercises.ts` | ⚠️ Partial | 4 workouts defined, no goal variants |
| `src/utils/recommendations.ts` | ⚠️ Partial | Rotation logic exists, no goal factor |
| `app/(tabs)/profile.tsx` | ✅ Implemented | No goal editing UI yet |
| `src/services/sentry.ts` | ✅ Implemented | Needs DSN verification |
| `eas.json` | ✅ Configured | Build profiles ready |
| `app.json` | ✅ Configured | Project ID, updates URL set |
