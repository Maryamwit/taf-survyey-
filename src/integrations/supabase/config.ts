export function isSupabaseConfigured(): boolean {
  const serverEnv = typeof process === "undefined" ? undefined : process.env;
  const url = import.meta.env["VITE_SUPABASE_URL"] || serverEnv?.["SUPABASE_URL"];
  const key =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || serverEnv?.["SUPABASE_PUBLISHABLE_KEY"];

  return Boolean(url && key);
}
