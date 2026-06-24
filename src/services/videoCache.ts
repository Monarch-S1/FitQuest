import { Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use the new Paths API (SDK 56+): Paths.document is a Directory object
const CACHE_DIR = `${Paths.document.uri}exercise-videos/`;
const CACHE_INDEX_KEY = "@arch_video_cache_index";

interface CacheEntry {
  exerciseId: string;
  uri: string;
  size: number;
  cachedAt: number;
}

type CacheIndex = Record<string, CacheEntry>;

/**
 * Video caching service for exercise demos.
 * Downloads MP4 files to local storage for offline playback.
 */
export const videoCache = {
  /**
   * Initialize the cache directory.
   */
  async init(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  },

  /**
   * Check if a video is cached locally.
   */
  async isCached(exerciseId: string): Promise<boolean> {
    try {
      const index = await this.getIndex();
      const entry = index[exerciseId];
      if (!entry) return false;

      const fileInfo = await FileSystem.getInfoAsync(entry.uri);
      return fileInfo.exists;
    } catch {
      return false;
    }
  },

  /**
   * Get the local URI of a cached video.
   * Returns null if not cached.
   */
  async getCachedUri(exerciseId: string): Promise<string | null> {
    try {
      const index = await this.getIndex();
      const entry = index[exerciseId];
      if (!entry) return null;

      const fileInfo = await FileSystem.getInfoAsync(entry.uri);
      if (fileInfo.exists) {
        return entry.uri;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Download and cache a video for offline playback.
   * Returns the local URI on success, null on failure.
   */
  async download(
    exerciseId: string,
    url: string,
    onProgress?: (progress: number) => void,
  ): Promise<string | null> {
    try {
      await this.init();

      const fileName = `${exerciseId.replace(/[^a-z0-9]/gi, "_")}.mp4`;
      const localUri = `${CACHE_DIR}${fileName}`;

      // Check if already cached
      const existing = await this.getCachedUri(exerciseId);
      if (existing) return existing;

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.(progress);
        },
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) return null;

      // Update cache index
      const index = await this.getIndex();
      index[exerciseId] = {
        exerciseId,
        uri: result.uri,
        size: result.headers?.["content-length"]
          ? parseInt(result.headers["content-length"], 10)
          : 0,
        cachedAt: Date.now(),
      };
      await this.setIndex(index);

      return result.uri;
    } catch (error) {
      console.warn(`[VideoCache] Failed to download ${exerciseId}:`, error);
      return null;
    }
  },

  /**
   * Remove a cached video.
   */
  async remove(exerciseId: string): Promise<void> {
    try {
      const index = await this.getIndex();
      const entry = index[exerciseId];
      if (entry) {
        await FileSystem.deleteAsync(entry.uri, { idempotent: true });
        delete index[exerciseId];
        await this.setIndex(index);
      }
    } catch (error) {
      console.warn(`[VideoCache] Failed to remove ${exerciseId}:`, error);
    }
  },

  /**
   * Get all cached videos.
   */
  async getCachedIds(): Promise<string[]> {
    const index = await this.getIndex();
    return Object.keys(index);
  },

  /**
   * Get total cache size in bytes.
   */
  async getCacheSize(): Promise<number> {
    const index = await this.getIndex();
    return Object.values(index).reduce((sum, entry) => sum + entry.size, 0);
  },

  /**
   * Clear all cached videos.
   */
  async clearAll(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      }
      await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    } catch (error) {
      console.warn("[VideoCache] Failed to clear cache:", error);
    }
  },

  // ── Internal helpers ──

  async getIndex(): Promise<CacheIndex> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  async setIndex(index: CacheIndex): Promise<void> {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  },
};
