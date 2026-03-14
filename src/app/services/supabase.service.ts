import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

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

    const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your Supabase URL
    const supabaseAnonKey = 'your-anon-key'; // Replace with your Supabase anon key

    // Only initialize if we have valid URLs (not placeholders)
    if (
      supabaseUrl &&
      supabaseUrl !== 'https://your-project.supabase.co' &&
      supabaseAnonKey &&
      supabaseAnonKey !== 'your-anon-key'
    ) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
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
