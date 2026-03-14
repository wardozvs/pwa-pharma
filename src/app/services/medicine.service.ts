import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { Medicine, MedicineNotification } from '../models/medicine.model';
import { SupabaseService } from './supabase.service';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * MedicineService manages pharmaceutical data with local storage fallback
 * Syncs with Supabase but works offline using localStorage
 */
@Injectable({
  providedIn: 'root'
})
export class MedicineService {
  private readonly STORAGE_KEY = 'medicines';
  private medicinesSubject = new BehaviorSubject<Medicine[]>([]);
  public medicines$ = this.medicinesSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<MedicineNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private isOnlineSubject = new BehaviorSubject<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : false);
  public isOnline$ = this.isOnlineSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.initializeService();
    this.setupNetworkListener();
  }

  /**
   * Initialize the service by loading medicines from localStorage
   */
  private initializeService(): void {
    // Guard browser-only APIs
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const medicines = JSON.parse(stored);
        this.medicinesSubject.next(medicines);
        this.checkExpirations(medicines);
      } catch (e) {
        console.error('Error loading medicines from storage:', e);
      }
    }

    // Try to sync with Supabase if available
    this.syncWithSupabase();
  }

  /**
   * Setup network listener to detect connectivity changes
   */
  private setupNetworkListener(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', () => {
      this.isOnlineSubject.next(true);
      this.syncWithSupabase();
    });

    window.addEventListener('offline', () => {
      this.isOnlineSubject.next(false);
    });
  }

  /**
   * Add a new medicine
   */
  addMedicine(medicine: Medicine): Observable<Medicine> {
    return new Observable(observer => {
      try {
        const medicines = this.medicinesSubject.value;
        const newMedicine: Medicine = {
          ...medicine,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const updated = [...medicines, newMedicine];
        this.medicinesSubject.next(updated);
        this.saveMedicinesToStorage(updated);

        // Sync with Supabase if online
        if (this.isOnlineSubject.value && this.supabaseService.isInitialized()) {
          this.syncAddToSupabase(newMedicine);
        }

        this.checkExpirations(updated);
        observer.next(newMedicine);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Update existing medicine
   */
  updateMedicine(medicine: Medicine): Observable<Medicine> {
    return new Observable(observer => {
      try {
        const medicines = this.medicinesSubject.value;
        const index = medicines.findIndex(m => m.id === medicine.id);

        if (index === -1) {
          observer.error(new Error('Medicine not found'));
          return;
        }

        const updated = [...medicines];
        updated[index] = { ...medicine, updatedAt: new Date() };
        this.medicinesSubject.next(updated);
        this.saveMedicinesToStorage(updated);

        // Sync with Supabase if online
        if (this.isOnlineSubject.value && this.supabaseService.isInitialized()) {
          this.syncUpdateToSupabase(updated[index]);
        }

        this.checkExpirations(updated);
        observer.next(updated[index]);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Delete medicine
   */
  deleteMedicine(medicineId: string): Observable<void> {
    return new Observable(observer => {
      try {
        const medicines = this.medicinesSubject.value.filter(m => m.id !== medicineId);
        this.medicinesSubject.next(medicines);
        this.saveMedicinesToStorage(medicines);

        // Sync with Supabase if online
        if (this.isOnlineSubject.value && this.supabaseService.isInitialized()) {
          this.syncDeleteToSupabase(medicineId);
        }

        observer.next();
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Get all medicines
   */
  getAllMedicines(): Observable<Medicine[]> {
    return this.medicines$;
  }

  /**
   * Get medicine by ID
   */
  getMedicineById(id: string): Observable<Medicine | undefined> {
    return this.medicines$.pipe(
      map(medicines => medicines.find(m => m.id === id))
    );
  }

  /**
   * Check for medicines expiring soon (within 60 days)
   */
  private checkExpirations(medicines: Medicine[]): void {
    const notifications: MedicineNotification[] = [];
    const now = new Date();

    medicines.forEach(medicine => {
      const expirationDate = typeof medicine.expirationDate === 'string'
        ? parseISO(medicine.expirationDate)
        : medicine.expirationDate as Date;

      const daysUntilExpiration = differenceInDays(expirationDate as Date, now);

      // Check if within 60 days (2 months) of expiration
      if (daysUntilExpiration <= 60 && daysUntilExpiration >= 0) {
        notifications.push({
          medicineId: medicine.id || '',
          medicineName: medicine.name,
          daysUntilExpiration,
          expirationDate: expirationDate as Date,
          notificationSent: false
        });
      }
    });

    this.notificationsSubject.next(notifications);
  }

  /**
   * Save medicines to localStorage
   */
  private saveMedicinesToStorage(medicines: Medicine[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(medicines));
  }

  /**
   * Sync medicines with Supabase (pull from server)
   */
  private syncWithSupabase(): void {
    if (!this.supabaseService.isInitialized()) {
      return;
    }

    const client = this.supabaseService.getClient();
    if (!client) return;

    client
      .from('medicines')
      .select('*')
      .then(({ data, error }: any) => {
        try {
          if (!error && data) {
            this.medicinesSubject.next(data as Medicine[]);
            this.saveMedicinesToStorage(data as Medicine[]);
          } else if (error) {
            console.error('Sync error:', error);
          }
        } catch (err) {
          console.error('Sync error:', err);
        }
      });
  }

  /**
   * Sync add operation to Supabase
   */
  private syncAddToSupabase(medicine: Medicine): void {
    const client = this.supabaseService.getClient();
    if (!client) return;

    client
      .from('medicines')
      .insert([medicine])
      .then(({ error }: any) => {
        if (error) {
          console.error('Sync add error:', error);
        }
      });
  }

  /**
   * Sync update operation to Supabase
   */
  private syncUpdateToSupabase(medicine: Medicine): void {
    const client = this.supabaseService.getClient();
    if (!client) return;

    client
      .from('medicines')
      .update(medicine)
      .eq('id', medicine.id)
      .then(({ error }: any) => {
        if (error) {
          console.error('Sync update error:', error);
        }
      });
  }

  /**
   * Sync delete operation to Supabase
   */
  private syncDeleteToSupabase(medicineId: string): void {
    const client = this.supabaseService.getClient();
    if (!client) return;

    client
      .from('medicines')
      .delete()
      .eq('id', medicineId)
      .then(({ error }: any) => {
        if (error) {
          console.error('Sync delete error:', error);
        }
      });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
