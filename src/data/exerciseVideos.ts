/**
 * Maps exercise IDs to YouTube video IDs for inline video demos.
 * Each video is a form guide from a reputable fitness channel.
 *
 * ─── Coverage ───
 * - 49 of 96 exercises have curated video IDs
 * - All Level 1–4 foundational exercises covered
 * - Remaining 47 exercises use YouTube Data API search fallback
 *
 * Sources: Hybrid Calisthenics, Calisthenicmovement, FitnessFAQs,
 * THENX, Squat University, Jeremy Ethier, E3 Rehab, and more.
 */
export const exerciseVideoIds: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════
  // PUSH FAMILY
  // ═══════════════════════════════════════════════════════════════

  // ── Horizontal Push (HP) ──
  HP1: "zkU6Ok44_CI", // Wall Push-up
  HP2: "cWtVKo_x19k", // Incline Push-up
  HP3: "lFR1GWy1Dcs", // Knee Push-up
  HP4: "NwdwAYDxC30", // Standard Push-up
  HP7: "SKPab2YC8BE", // Decline Push-up
  HP9: "NgN6vJWMepc", // Sliding Chest Fly
  HP10: "A0r8ploEnZY", // Archer Push-up

  // ── Vertical Push (VP) ──
  VP1: "WesECVAHj7U", // Pike Shrugs
  VP2: "9y_n2ndZQy4", // Incline Pike Push-up
  VP3: "RuGjXUHRYSI", // Flat-Ground Pike Push-up
  VP4: "RuGjXUHRYSI", // Decline Pike Push-up
  VP5: "OQAZoUPoPUw", // High-Decline Pike Push-up
  VP6: "PXGFHB9toh8", // Floor Triceps Extension

  // ═══════════════════════════════════════════════════════════════
  // PULL FAMILY
  // ═══════════════════════════════════════════════════════════════

  // ── Horizontal Pull (HPLL) ──
  HPLL1: "rsFrK8btZiw", // Supine Scapular Retractions
  HPLL2: "ytEalkENNiQ", // Standing Doorway Row (High Angle)
  HPLL3: "g8wWFlr2gQU", // Standing Doorway Row (Deep Angle)
  HPLL4: "ytEalkENNiQ", // Standing One-Arm Doorway Row
  HPLL9: "FKKZRwBJDxE", // Table-Underneath Inverted Row
  HPLL10: "JB7m_nda9Go", // Towel-Anchor Door Row (Single Arm)

  // ── Vertical Pull (VPLL) ──
  VPLL1: "7auEc73ncGU", // Wall Slides
  VPLL2: "Sc4VXmSM3-w", // Prone Arm Circles
  VPLL3: "q8kPDJcfmlA", // Prone Swimmers
  VPLL4: "B8qfT9n88i8", // Prone Arch-Ups
  VPLL10: "vGAK2-_kn1U", // Door-Edge Negative Pull-up

  // ═══════════════════════════════════════════════════════════════
  // LEGS FAMILY
  // ═══════════════════════════════════════════════════════════════

  // ── Anterior Chain Legs (AQL) ──
  AQL1: "Pegw_SbLYVc", // Assisted Squat
  AQL2: "AVOS2JYsgrs", // Bodyweight Box Squat
  AQL3: "Q8962qT1e0U", // Full-Depth Air Squat
  AQL4: "k67UjgvJdEk", // Standing Calf Raise
  AQL5: "d4IPCXI8GQc", // Close-Stance Squat
  AQL6: "DeTBwEL4m7s", // Reverse Lunge
  AQL8: "hiLF_pF3EJM", // Bulgarian Split Squat

  // ── Posterior Chain Legs (HPL) ──
  HPL1: "c_4Y0I8vgzY", // Double-Leg Glute Bridge
  HPL2: "VUl8R0kn6v4", // Single-Leg Glute Bridge
  HPL3: "Kdeq15AvUVU", // Bodyweight Good Morning
  HPL4: "MsE_T9nAsSE", // Single-Leg Romanian Deadlift
  HPL6: "GBtdRxwdQEk", // Sliding Hamstring Curl
  HPL12: "_e9vFU9-tkc", // Unassisted Nordic Hamstring Curl

  // ═══════════════════════════════════════════════════════════════
  // CORE FAMILY
  // ═══════════════════════════════════════════════════════════════

  // ── Anterior Core (AC) ──
  AC1: "g_BYB0R-4Ws", // Lying Dead Bug
  AC2: "7pZ07S77Yd0", // Standard Crunch
  AC3: "HAfUt2Cco74", // Hollow Body Tuck Hold
  AC4: "gAyTBB4lm3I", // Reverse Crunch
  AC5: "HAfUt2Cco74", // Hollow Body Hold (Full)
  AC11: "pvz7k5gO-DE", // Straight-Leg Dragon Flag Negative

  // ── Posterior & Lateral Core (PLC) ──
  PLC1: "KA0ekfSePrQ", // Quadruped Bird-Dog
  PLC2: "LZoWdePF1NQ", // Superman Hold
  PLC3: "uUEKLhpJd1Q", // Standard Forearm Plank
  PLC4: "RprIskF9iNQ", // Side Plank (Knee Supported)
  PLC6: "jWyD_Ri93YE", // Side Plank (Foot Supported)
  PLC9: "59BPdBnDjLY", // Hollow Body Plank Shrugs
};

/**
 * Maps exercise IDs to direct MP4 URLs for offline caching.
 * When a user taps "Download", the video is fetched from this URL
 * and stored locally via expo-file-system.
 *
 * To add MP4 sources, host videos on Supabase Storage, S3, or any CDN
 * and add the URL here. The cache layer handles the rest.
 *
 * Example:
 *   "push-up": "https://your-bucket.supabase.co/storage/v1/object/public/exercise-videos/push-up.mp4",
 */
export const exerciseMp4Urls: Record<string, string> = {
  // Add MP4 URLs here when videos are hosted.
  // The caching layer will automatically download and play from local storage.
};

/**
 * Check if an exercise has a cached MP4 available.
 */
export function hasMp4Source(exerciseId: string): boolean {
  return exerciseId in exerciseMp4Urls;
}
