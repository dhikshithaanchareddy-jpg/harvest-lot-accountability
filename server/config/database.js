// server/config/database.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const localStore = require('../db/localStore');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id') && !supabaseKey.includes('your-anon-key')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isConfigured = true;
    console.log('[Database] Supabase client initialized with URL:', supabaseUrl);
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client:', err.message);
    isConfigured = false;
  }
} else {
  console.log('[Database] Supabase credentials not configured in .env. Operating in local PostgreSQL-mirroring store mode.');
}

module.exports = {
  supabase,
  isConfigured,
  localStore
};
