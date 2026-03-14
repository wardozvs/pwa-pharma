import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * SupabaseService manages connection to Supabase for database operations
 * Configured with environment variables and lazy-loaded only in browser
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase?: SupabaseClient;
  private authSubject = new BehaviorSubject<{ user: any } | null>(null);
  public auth$ = this.authSubject.asObservable();

  constructor() {
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client only if URL is valid (prevents build failures with placeholders)
   */
  private initializeSupabase(): void {
    // Guard browser-only API
    if (typeof window === 'undefined') {
      return;
    }

    // Get environment variables from environment config
    const supabaseUrl = environment.supabase.url;
    const supabaseAnonKey = environment.supabase.anonKey;

    // Only initialize if we have valid URLs (not placeholders or empty)
    if (
      supabaseUrl &&
      supabaseUrl.trim().length > 0 &&
      supabaseUrl.startsWith('https://') &&
      supabaseAnonKey &&
      supabaseAnonKey.trim().length > 20
    ) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✓ Supabase initialized successfully');
      } catch (error) {
        console.error('✗ Failed to initialize Supabase:', error);
      }
    } else {
      console.log('⚠ Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      console.log('  App will work offline with localStorage.');
    }
  }

  /**
   * Check if Supabase is initialized
   */
  isInitialized(): boolean {
    return !!this.supabase;
  }

  /**
   * Get Supabase client
   */
  getClient(): SupabaseClient | undefined {
    return this.supabase;
  }

  /**
   * Sign up user
   */
  async signUp(email: string, password: string): Promise<any> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<any> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.auth.signOut();
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  /**
   * Get auth session
   */
  async getSession(): Promise<any> {
    if (!this.supabase) return null;
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  /**
   * Execute a Supabase query (generic method)
   */
  query(table: string): any {
    if (!this.supabase) return null;
    return this.supabase.from(table);
  }
}
