// js/supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xasbpjtbwttgguhidoek.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhc2JwanRid3R0Z2d1aGlkb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzM4NTgsImV4cCI6MjA3NDE0OTg1OH0.rU1K36EV6ly3ikx_1BDUl5V0ok-FCzitDyDP0-0bJyk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ also attach to window so other scripts can use it
window.supabase = supabase;
