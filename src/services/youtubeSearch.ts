/**
 * YouTube Search Service
 *
 * Provides a fallback video search for exercises without curated video IDs.
 * - Calls the Supabase Edge Function (youtube-search) to find the top video
 * - Caches results in AsyncStorage so subsequent lookups are instant
 * - Falls back to opening YouTube in the browser if the API fails
 *
 * ── Prerequisites ───────────────────────────────────────────────────────
 * 1. Get a YouTube Data API v3 key from https://console.cloud.google.com
 * 2. Deploy the Edge Function:
 *      supabase secrets set YOUTUBE_SEARCH_API_KEY=<your-key>
 *      supabase functions deploy youtube-search
 * 3. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 *    are set in your environment (required for supabase.functions.invoke)
 *
 * Without the API key configured, all fallback searches will gracefully
 * degrade to opening YouTube in the browser.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const SEARCH_CACHE_KEY = "@fitquest_youtube_search_cache";

interface SearchCache {
  [exerciseId: string]: {
    videoId: string;
    title: string;
    channel: string;
    cachedAt: number;
  };
}

interface SearchResult {
  videoId: string | null;
  title: string | null;
  channel: string | null;
  fromCache: boolean;
}

/**
 * Search for a YouTube video for an exercise.
 * Checks cache first, then calls the Edge Function.
 */
export async function searchExerciseVideo(
  exerciseId: string,
  exerciseName: string,
): Promise<SearchResult> {
  // 1. Check local cache
  const cached = await getCachedResult(exerciseId);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // 2. Call Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke("youtube-search", {
      body: { query: exerciseName },
    });

    if (error || !data?.videoId) {
      console.warn("[YouTubeSearch] Edge Function error:", error?.message || "No video found");
      return { videoId: null, title: null, channel: null, fromCache: false };
    }

    // 3. Cache the result
    await cacheResult(exerciseId, {
      videoId: data.videoId,
      title: data.title || null,
      channel: data.channel || null,
    });

    return {
      videoId: data.videoId,
      title: data.title || null,
      channel: data.channel || null,
      fromCache: false,
    };
  } catch (e) {
    console.warn("[YouTubeSearch] Failed to call Edge Function:", e);
    return { videoId: null, title: null, channel: null, fromCache: false };
  }
}

/**
 * Check if a search result is cached for an exercise.
 */
export async function hasCachedSearchResult(exerciseId: string): Promise<boolean> {
  const cache = await getCache();
  return exerciseId in cache;
}

/**
 * Get a cached search result, or null if not found.
 */
async function getCachedResult(exerciseId: string): Promise<SearchResult | null> {
  try {
    const cache = await getCache();
    const entry = cache[exerciseId];
    if (!entry) return null;
    return {
      videoId: entry.videoId,
      title: entry.title,
      channel: entry.channel,
      fromCache: true,
    };
  } catch {
    return null;
  }
}

/**
 * Store a search result in the cache.
 */
async function cacheResult(
  exerciseId: string,
  result: { videoId: string; title: string | null; channel: string | null },
): Promise<void> {
  try {
    const cache = await getCache();
    cache[exerciseId] = {
      videoId: result.videoId,
      title: result.title || "",
      channel: result.channel || "",
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("[YouTubeSearch] Failed to cache result:", e);
  }
}

/**
 * Get the full search cache from AsyncStorage.
 */
async function getCache(): Promise<SearchCache> {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Clear the search cache (e.g., if results become stale).
 */
export async function clearSearchCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SEARCH_CACHE_KEY);
  } catch (e) {
    console.warn("[YouTubeSearch] Failed to clear cache:", e);
  }
}
