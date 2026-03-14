import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { MedicineService } from './medicine.service';
import { MedicineNotification } from '../models/medicine.model';

/**
 * NotificationService handles push notifications for expiring medicines
 * Guards browser-only APIs for SSR compatibility
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly VAPID_PUBLIC_KEY = 'your-vapid-public-key'; // Replace with your VAPID key
  private notifiedMedicines = new Set<string>();

  constructor(
    private swPush: SwPush,
    private medicineService: MedicineService
  ) {
    this.initializeNotifications();
  }

  /**
   * Initialize notification service
   * Guard against server-side rendering
   */
  private initializeNotifications(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Listen to medicine notifications
    this.medicineService.notifications$.subscribe(notifications => {
      notifications.forEach(notification => {
        if (!this.notifiedMedicines.has(notification.medicineId)) {
          this.sendNotification(notification);
        }
      });
    });

    // Request push notification permission if not already granted
    this.requestNotificationPermission();
  }

  /**
   * Request permission for push notifications
   */
  private requestNotificationPermission(): void {
    if (typeof Notification === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    if (Notification.permission === 'granted') {
      this.subscribeToPushNotifications();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.subscribeToPushNotifications();
        }
      });
    }
  }

  /**
   * Subscribe to push notifications using the service worker
   */
  private subscribeToPushNotifications(): void {
    if (!this.swPush.isEnabled || !this.VAPID_PUBLIC_KEY || this.VAPID_PUBLIC_KEY === 'your-vapid-public-key') {
      console.log('Push notifications not available or not configured');
      return;
    }

    this.swPush
      .requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      })
      .then(sub => {
        console.log('Push subscription successful', sub);
        // Send subscription to backend for storage
        this.sendSubscriptionToBackend(sub);
      })
      .catch(err => {
        console.error('Push subscription error:', err);
      });
  }

  /**
   * Send subscription details to backend
   */
  private sendSubscriptionToBackend(subscription: PushSubscription): void {
    // This would send the subscription object to your backend
    // to store for later sending push notifications
    console.log('Subscription details ready to be sent to backend:', subscription);
  }

  /**
   * Send a notification for an expiring medicine
   */
  private sendNotification(notification: MedicineNotification): void {
    if (typeof Notification === 'undefined') {
      return;
    }

    const title = '⚠️ Medicamento próximo a expirar';
    const options: NotificationOptions = {
      body: `${notification.medicineName} expira en ${notification.daysUntilExpiration} días`,
      icon: '/assets/icon-192x192.png',
      badge: '/assets/icon-192x192.png',
      tag: `medicine-${notification.medicineId}`,
      data: {
        medicineId: notification.medicineId,
        url: `/medicines/${notification.medicineId}`
      }
    };

    // Send notification
    if (Notification.permission === 'granted') {
      new Notification(title, options);
      this.notifiedMedicines.add(notification.medicineId);
    }
  }

  /**
   * Send a local notification (browser notification API)
   */
  showNotification(title: string, options?: NotificationOptions): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    new Notification(title, options);
  }

  /**
   * Clear notification history for a medicine
   */
  clearNotificationHistory(medicineId: string): void {
    this.notifiedMedicines.delete(medicineId);
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return typeof Notification !== 'undefined';
  }

  /**
   * Get notification permission status
   */
  getNotificationPermission(): NotificationPermission | string {
    if (typeof Notification === 'undefined') {
      return 'denied';
    }
    return Notification.permission;
  }
}
