import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MedicineService } from '../../services/medicine.service';
import { BarcodeService } from '../../services/barcode.service';
import { Medicine } from '../../models/medicine.model';

/**
 * AddMedicineComponent handles creation of new medicine records
 * Includes barcode scanning and form validation
 */
@Component({
  selector: 'app-add-medicine',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="add-medicine-container">
      <!-- Header -->
      <header class="top-bar">
        <button class="back-btn" (click)="goBack()">← Atrás</button>
        <h1>Agregar Medicamento</h1>
        <div></div>
      </header>

      <!-- Scan Mode Toggle -->
      <div class="scan-toggle">
        <button class="toggle-btn" [class.active]="!isFormMode" (click)="toggleScanMode()">
          📱 Escanear
        </button>
        <button class="toggle-btn" [class.active]="isFormMode" (click)="toggleFormMode()">
          ✏️ Formulario
        </button>
      </div>

      <!-- Barcode Scanner View -->
      <div *ngIf="!isFormMode" class="scanner-section">
        <div class="camera-container">
          <video #videoElement id="scanner" playsinline></video>
          <div class="scanner-overlay">
            <div class="scanner-frame"></div>
          </div>
        </div>

        <div class="scanner-info">
          <p *ngIf="!isScanning" class="status-message info">
            Presiona Iniciar para escanear un código de barras
          </p>
          <p *ngIf="isScanning" class="status-message scanning">
            ⏳ Escaneando... Apunta a un código de barras
          </p>

          <div *ngIf="scannedBarcode" class="scanned-result">
            <p class="scan-label">Código escaneado:</p>
            <p class="scan-value">{{ scannedBarcode }}</p>
          </div>

          <div class="scanner-actions">
            <button class="action-btn scan-btn" 
              (click)="startScanning()"
              [disabled]="isScanning">
              {{ isScanning ? '⏹️ Detener' : '▶️ Iniciar Escaneo' }}
            </button>
            <button class="action-btn secondary-btn" 
              (click)="toggleFormMode()"
              *ngIf="scannedBarcode">
              ➕ Completar formulario
            </button>
          </div>
        </div>
      </div>

      <!-- Form View -->
      <form *ngIf="isFormMode" [formGroup]="medicineForm" (ngSubmit)="submitForm()" class="medicine-form">
        <div class="form-section">
          <h2>Información del Medicamento</h2>

          <!-- Name -->
          <div class="form-group">
            <label for="name">Nombre del medicamento *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Ej: Paracetamol"
              class="form-input"
            />
            <span class="error-message" *ngIf="isFieldInvalid('name')">
              El nombre es requerido
            </span>
          </div>

          <!-- Dosage -->
          <div class="form-group">
            <label for="dosage">Dosis (mg) *</label>
            <input
              id="dosage"
              type="number"
              formControlName="dosage"
              placeholder="Ej: 500"
              class="form-input"
              min="1"
            />
            <span class="error-message" *ngIf="isFieldInvalid('dosage')">
              Ingresa una dosis válida
            </span>
          </div>

          <!-- Quantity -->
          <div class="form-group">
            <label for="quantity">Cantidad de tabletas *</label>
            <input
              id="quantity"
              type="number"
              formControlName="quantity"
              placeholder="Ej: 20"
              class="form-input"
              min="1"
            />
            <span class="error-message" *ngIf="isFieldInvalid('quantity')">
              Ingresa una cantidad válida
            </span>
          </div>

          <!-- Expiration Date -->
          <div class="form-group">
            <label for="expirationDate">Fecha de caducidad *</label>
            <input
              id="expirationDate"
              type="date"
              formControlName="expirationDate"
              class="form-input"
            />
            <span class="error-message" *ngIf="isFieldInvalid('expirationDate')">
              La fecha de caducidad es requerida
            </span>
          </div>

          <!-- Barcode -->
          <div class="form-group">
            <label for="barcodeData">Código de barras (opcional)</label>
            <input
              id="barcodeData"
              type="text"
              formControlName="barcodeData"
              placeholder="Escaneado o ingresado manualmente"
              class="form-input"
              readonly
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" class="action-btn primary-btn" [disabled]="!medicineForm.valid">
            💾 Guardar Medicamento
          </button>
          <button type="button" class="action-btn secondary-btn" (click)="resetForm()">
            🔄 Limpiar
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isSubmitting" class="loading-overlay">
          <div class="spinner"></div>
          <p>Guardando...</p>
        </div>
      </form>

      <!-- Success Message -->
      <div *ngIf="submitSuccess" class="success-message">
        <span class="success-icon">✅</span>
        <p>Medicamento agregado exitosamente</p>
      </div>

      <!-- Error Message -->
      <div *ngIf="submitError" class="error-notification">
        <span class="error-icon">❌</span>
        <p>{{ submitError }}</p>
      </div>
    </div>
  `,
  styles: [`
    .add-medicine-container {
      background: #f8f9fa;
      min-height: 100vh;
      padding-bottom: 2rem;
    }

    /* Top Bar */
    .top-bar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 1200px;
      margin: 0 auto;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .top-bar h1 {
      margin: 0;
      font-size: 1.25rem;
    }

    /* Toggle */
    .scan-toggle {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 0.75rem;
      margin-top: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .toggle-btn {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #ddd;
      background: white;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s;
      color: #666;
    }

    .toggle-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: #667eea;
    }

    .toggle-btn:hover {
      border-color: #667eea;
    }

    /* Scanner Section */
    .scanner-section {
      max-width: 600px;
      margin: 1rem auto;
      padding: 1rem;
    }

    .camera-container {
      position: relative;
      width: 100%;
      border-radius: 0.75rem;
      overflow: hidden;
      background: black;
      aspect-ratio: 4/5;
      margin-bottom: 1rem;
    }

    #scanner {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .scanner-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scanner-frame {
      width: 70%;
      height: 70%;
      border: 3px solid rgba(102, 126, 234, 0.5);
      border-radius: 0.5rem;
      box-shadow: inset 0 0 20px rgba(102, 126, 234, 0.2);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: inset 0 0 20px rgba(102, 126, 234, 0.2);
      }
      50% {
        box-shadow: inset 0 0 30px rgba(102, 126, 234, 0.5);
      }
    }

    .scanner-info {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .status-message {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      text-align: center;
    }

    .status-message.info {
      color: #666;
    }

    .status-message.scanning {
      color: #ffc107;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .scanned-result {
      background: #e8f5e9;
      border-radius: 0.5rem;
      padding: 1rem;
      margin: 1rem 0;
      border-left: 4px solid #4caf50;
    }

    .scan-label {
      font-size: 0.75rem;
      color: #666;
      margin: 0;
      text-transform: uppercase;
    }

    .scan-value {
      font-family: monospace;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0.5rem 0 0 0;
      word-break: break-all;
    }

    .scanner-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 1rem;
    }

    /* Form */
    .medicine-form {
      max-width: 600px;
      margin: 1rem auto;
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .form-section h2 {
      font-size: 1.1rem;
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .error-message {
      display: block;
      color: #d32f2f;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    /* Actions */
    .form-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 2rem;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .primary-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .primary-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .secondary-btn {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .secondary-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }

    .scan-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .scan-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    /* Messages */
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-message {
      max-width: 600px;
      margin: 1rem auto;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .success-icon {
      font-size: 2rem;
    }

    .success-message p {
      margin: 0;
      color: #2e7d32;
      font-weight: 600;
    }

    .error-notification {
      max-width: 600px;
      margin: 1rem auto;
      background: #ffebee;
      border-left: 4px solid #d32f2f;
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .error-icon {
      font-size: 2rem;
    }

    .error-notification p {
      margin: 0;
      color: #c62828;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .medicine-form {
        padding: 1.5rem;
      }

      .scanner-actions {
        grid-template-columns: 1fr;
      }

      .form-actions {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AddMedicineComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  medicineForm: FormGroup;
  isFormMode = true;
  isScanning = false;
  scannedBarcode: string | null = null;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private medicineService: MedicineService,
    private barcodeService: BarcodeService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.medicineForm = this.createForm();
  }

  ngOnInit(): void {
    // Subscribe to scan results
    this.subscriptions.push(
      this.barcodeService.scanResult$.subscribe(result => {
        if (result) {
          this.scannedBarcode = result;
          this.medicineForm.patchValue({ barcodeData: result });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Stop scanning when component is destroyed
    this.barcodeService.stopScanning().catch(err => console.error(err));
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', Validators.required],
      dosage: ['', [Validators.required, Validators.min(1)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      expirationDate: ['', Validators.required],
      barcodeData: ['']
    });
  }

  toggleScanMode(): void {
    this.isFormMode = false;
    setTimeout(() => {
      if (this.videoElement) {
        this.startScanning();
      }
    }, 100);
  }

  toggleFormMode(): void {
    this.isFormMode = true;
    this.barcodeService.stopScanning().catch(err => console.error(err));
  }

  async startScanning(): Promise<void> {
    try {
      if (!this.barcodeService.isSupported()) {
        this.submitError = 'El dispositivo no soporta escaneo de códigos de barras';
        return;
      }

      if (this.isScanning) {
        await this.barcodeService.stopScanning();
        this.isScanning = false;
      } else {
        const videoElement = document.getElementById('scanner') as HTMLVideoElement;
        if (videoElement) {
          await this.barcodeService.startScanning(videoElement);
          this.isScanning = true;
        }
      }
    } catch (error) {
      this.submitError = 'Error al acceder a la cámara. Verifica los permisos.';
      console.error('Scanning error:', error);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.medicineForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  resetForm(): void {
    this.medicineForm.reset();
    this.scannedBarcode = null;
    this.submitSuccess = false;
    this.submitError = null;
  }

  submitForm(): void {
    if (!this.medicineForm.valid) {
      this.submitError = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.isSubmitting = true;
    const medicine: Medicine = this.medicineForm.value;

    this.medicineService.addMedicine(medicine).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.medicineForm.reset();

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.submitError = error.message || 'Error al guardar el medicamento';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
