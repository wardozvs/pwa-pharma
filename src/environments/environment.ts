// Environment configuration for development
export const environment = {
  production: false,
  supabase: {
    url: process.env['SUPABASE_URL'] || '',
    anonKey: process.env['SUPABASE_ANON_KEY'] || ''
  },
  vapid: {
    publicKey: process.env['VAPID_PUBLIC_KEY'] || ''
  }
};
