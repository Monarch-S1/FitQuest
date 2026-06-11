/**
 * Maps exercise IDs to YouTube video IDs for inline video demos.
 * Each video is a form guide from a reputable fitness channel.
 */
export const exerciseVideoIds: Record<string, string> = {
  // Workout A — Anterior Chain & Horizontal Pulling
  "bulgarian-split-squat": "hiLF_pF3EJM",
  "doorway-row": "g8wWFlr2gQU",
  "decline-push-up": "SKPab2YC8BE",
  "sliding-hamstring-curl": "GBtdRxwdQEk",
  "floor-tricep-extension": "PXGFHB9toh8",
  "hollow-body-hold": "HAfUt2Cco74",

  // Workout B — Posterior Chain & Vertical Pressing
  "nordic-hamstring-curl": "_e9vFU9-tkc",
  "decline-pike-push-up": "OQAZoUPoPUw",
  "one-arm-towel-row": "JB7m_nda9Go",
  "prone-swimmers": "q8kPDJcfmlA",
  "sliding-chest-fly": "NgN6vJWMepc",
  "dragon-flag-progression": "pvz7k5gO-DE",

  // Workout C — Pull & Core
  "doorframe-pull-up-negative": "vGAK2-_kn1U",
  "towel-bicep-curl": "p8z4fhUWhP4",
  "glute-bridge-march": "c_4Y0I8vgzY",
  "reverse-plank": "uUEKLhpJd1Q",
  "table-row": "FKKZRwBJDxE",
  "dead-bug": "g_BYB0R-4Ws",

  // Workout D — Dynamic & Mobility
  "jump-squat": "DeTBwEL4m7s",
  "archer-push-up-progression": "A0r8ploEnZY",
  "cossack-squat": "d4IPCXI8GQc",
  "scapular-push-up": "59BPdBnDjLY",
  "single-leg-glute-bridge": "VUl8R0kn6v4",
  "l-sit-progression": "jWyD_Ri93YE",
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
