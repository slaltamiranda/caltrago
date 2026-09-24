import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eppdjjwsakdmtkugrwfk.supabase.co";
const supabaseAnonKey = "sb_publishable_SRCYY46i_GYw16PrfFYy9Q_j0uP5jTm";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);