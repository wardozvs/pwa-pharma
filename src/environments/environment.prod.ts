// Environment configuration for production
export const environment = {
  production: true,
  supabase: {
    url: process.env['SUPABASE_URL'] || '',
    anonKey: process.env['SUPABASE_ANON_KEY'] || ''
  },
  vapid: {
    publicKey: process.env['VAPID_PUBLIC_KEY'] || ''
  }
};
