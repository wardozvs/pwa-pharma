import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * BarcodeService handles barcode scanning using device camera
 * Uses browser's MediaStream and canvas for barcode detection
 */
@Injectable({
  providedIn: 'root'
})
export class BarcodeService {
  private scanResultSubject = new BehaviorSubject<string | null>(null);
  public scanResult$ = this.scanResultSubject.asObservable();

  private isScanning = false;
  private mediaStream: MediaStream | null = null;

  constructor() {}

  /**
   * Get available video devices
   */
  async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting video devices:', error);
      return [];
    }
  }

  /**
   * Start barcode scanning from camera
   * Note: ZXing library requires additional configuration. For now, this provides
   * camera access and you can integrate barcode detection via third-party service.
   */
  async startScanning(videoElement: string | HTMLVideoElement, deviceId?: string): Promise<void> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      throw new Error('Not in browser environment');
    }

    const element = typeof videoElement === 'string'
      ? (document.getElementById(videoElement) as HTMLVideoElement)
      : videoElement;

    if (!element) {
      throw new Error('Video element not found');
    }

    this.isScanning = true;

    try {
      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      element.srcObject = this.mediaStream;
      
      // Play video
      await element.play();

      // For actual barcode decoding, integrate with a service like:
      // - Dynamsoft Barcode Reader
      // - Google Cloud Vision API
      // - AWS Textract
      // Or use a simpler approach with manual input + validation
      
    } catch (error) {
      this.isScanning = false;
      console.error('Error starting barcode scan:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied. Enable camera access in device settings.');
      }
      throw error;
    }
  }

  /**
   * Stop barcode scanning
   */
  async stopScanning(): Promise<void> {
    this.isScanning = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.scanResultSubject.next(null);
  }

  /**
   * Manually set a scanned barcode result (for testing or manual input)
   */
  setScanResult(barcode: string): void {
    this.scanResultSubject.next(barcode);
  }

  /**
   * Check if scanning is currently active
   */
  isActive(): boolean {
    return this.isScanning;
  }

  /**
   * Reset scan result
   */
  resetScanResult(): void {
    this.scanResultSubject.next(null);
  }

  /**
   * Get the last scan result
   */
  getLastScanResult(): string | null {
    return this.scanResultSubject.value;
  }

  /**
   * Check if barcode scanning is supported
   */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  }
}
