
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lorfsjwndboeenamgwpq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcmZzanduZGJvZWVuYW1nd3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDk5MzUsImV4cCI6MjA1OTQyNTkzNX0.EKztybh6VG1cfxXS2rCz9zgxaotRrBXIZLTBH56MjEQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'vivaas-auth-token',
  }
});

// Helper function to check if there's an active session
export const checkActiveSession = async () => {
  try {
    console.log('Checking active session...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error checking session:", error);
      return false;
    }
    console.log("Session check result:", data.session ? "Authenticated" : "Not authenticated");
    return !!data.session;
  } catch (e) {
    console.error("Error checking session:", e);
    return false;
  }
};

// Helper to debug authentication status - use this for troubleshooting
export const debugAuthStatus = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log("Auth status:", { 
      hasSession: !!data.session, 
      error: error ? error.message : null,
      userId: data.session?.user.id || 'not logged in',
      expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null
    });
    return {
      isAuthenticated: !!data.session,
      userId: data.session?.user.id,
      error: error ? error.message : null
    };
  } catch (e) {
    console.error("Error checking auth status:", e);
    return { isAuthenticated: false, error: e };
  }
};

// Helper to force manual refresh of session tokens
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    console.log("Session refresh result:", {
      success: !!data.session,
      error: error ? error.message : null
    });
    return !!data.session;
  } catch (e) {
    console.error("Error refreshing session:", e);
    return false;
  }
};
