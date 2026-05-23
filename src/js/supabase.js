// src/js/supabase.js
// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================

// ⚠️ IMPORTANT: Replace these with your actual Supabase project credentials
// In production, use environment variables or a secure config injection method.
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Storage Base URL for constructing image paths
export const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public`;

let supabaseClient = null;

/**
 * Initializes and returns the Supabase client instance.
 * Uses a singleton pattern to prevent multiple initializations.
 * @returns {object} Supabase Client
 */
export const getSupabase = () => {
  if (supabaseClient) return supabaseClient;

  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK not loaded. Please include the CDN script in index.html.');
    return null;
  }

  // Check for placeholder keys to prevent runtime errors
  if (SUPABASE_URL.includes('YOUR_PROJECT_ID') || SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')) {
    console.warn('⚠️ Supabase keys are not configured. App will run in DEMO mode with mock data if available.');
    // Fallback or Mock Logic could go here if needed, but for now we just return null or throw
    // For this build, we assume the user will configure it before deployment.
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: { 'x-app-name': 'uttarbanga-swasthya-setu' }
      }
    });
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return null;
  }
};

/**
 * Helper to get full public URL for storage assets
 * @param {string} bucket - Bucket name (e.g., 'doctor-photos')
 * @param {string} path - File path relative to bucket
 * @returns {string} Full URL
 */
export const getPublicUrl = (bucket, path) => {
  if (!path) return null;
  // If path is already a full URL (legacy data), return as is
  if (path.startsWith('http')) return path;
  return `${STORAGE_BASE_URL}/${bucket}/${path}`;
};
