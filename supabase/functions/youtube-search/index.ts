/**
 * YouTube Search Edge Function
 *
 * Proxies YouTube Data API v3 search requests so the API key
 * stays server-side. Called when an exercise has no curated video ID.
 *
 * Usage:
 *   POST /functions/v1/youtube-search
 *   { "query": "Standard Push-up exercise form" }
 *
 * Response:
 *   { "videoId": "NwdwAYDxC30", "title": "...", "channel": "..." }
 *   or { "error": "..." }
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_SEARCH_API_KEY") || "";

interface SearchRequest {
  query: string;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { default: { url: string } };
  };
}

interface YouTubeApiResponse {
  items?: YouTubeSearchItem[];
  error?: { message: string };
}

serve(async (req: Request) => {
  // CORS headers for mobile app
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  // Validate API key is configured
  if (!YOUTUBE_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "YouTube Search API key not configured. Set YOUTUBE_SEARCH_API_KEY in Edge Function secrets.",
      }),
      { status: 503, headers },
    );
  }

  try {
    // Parse request body
    const body: SearchRequest = await req.json();

    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Missing or empty 'query' field" }), {
        status: 400,
        headers,
      });
    }

    // Build YouTube Data API v3 search URL
    const searchQuery = encodeURIComponent(`${body.query.trim()} exercise form`);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=3&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`;

    // Fetch from YouTube API
    const youtubeResponse = await fetch(searchUrl);
    const data: YouTubeApiResponse = await youtubeResponse.json();

    if (!youtubeResponse.ok) {
      console.error("YouTube API error:", data.error?.message || youtubeResponse.statusText);
      return new Response(
        JSON.stringify({
          error: data.error?.message || "YouTube API request failed",
        }),
        { status: youtubeResponse.status, headers },
      );
    }

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No results found",
          videoId: null,
        }),
        { status: 200, headers },
      );
    }

    // Return the top result
    const top = data.items[0];
    const result = {
      videoId: top.id.videoId,
      title: top.snippet.title,
      channel: top.snippet.channelTitle,
      thumbnail: top.snippet.thumbnails?.default?.url || null,
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});
