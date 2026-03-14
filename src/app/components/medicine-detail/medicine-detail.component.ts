import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine.model';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * MedicineDetailComponent displays and allows editing of a single medicine
 */
@Component({
  selector: 'app-medicine-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="detail-container">
      <!-- Header -->
      <header class="top-bar">
        <button class="back-btn" (click)="goBack()">← Atrás</button>
        <h1>{{ isEditMode ? 'Editar Medicamento' : 'Detalle del Medicamento' }}</h1>
        <button class="edit-btn" *ngIf="!isEditMode" (click)="toggleEditMode()">
          ✎ Editar
        </button>
      </header>

      <!-- Loading State -->
      <div *ngIf="!medicine" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>

      <!-- Detail View -->
      <div *ngIf="medicine && !isEditMode" class="detail-view">
        <!-- Overview Card -->
        <div class="overview-card">
          <div class="card-header">
            <h2>{{ medicine.name }}</h2>
            <span class="status-badge" [class.critical]="daysUntilExpiration <= 30">
              <span *ngIf="daysUntilExpiration > 0">
                {{ daysUntilExpiration }} días restantes
              </span>
              <span *ngIf="daysUntilExpiration <= 0" class="expired">
                Expirado
              </span>
            </span>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Dosis</span>
              <span class="detail-value">{{ medicine.dosage }} mg</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Cantidad</span>
              <span class="detail-value">{{ medicine.quantity }} tabletas</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Fecha de Caducidad</span>
              <span class="detail-value">{{ formatDate(medicine.expirationDate) }}</span>
            </div>
            <div class="detail-item" *ngIf="medicine.barcodeData">
              <span class="detail-label">Código de Barras</span>
              <span class="detail-value barcode">{{ medicine.barcodeData }}</span>
            </div>
          </div>

          <div class="timeline">
            <div class="timeline-event">
              <span class="timeline-icon">📅</span>
              <div class="timeline-content">
                <p class="timeline-label">Agregado</p>
                <p class="timeline-date">{{ formatDate(medicine.createdAt) }}</p>
              </div>
            </div>
            <div class="timeline-event">
              <span class="timeline-icon">♻️</span>
              <div class="timeline-content">
                <p class="timeline-label">Última modificación</p>
                <p class="timeline-date">{{ formatDate(medicine.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="detail-actions">
          <button class="action-btn edit-btn" (click)="toggleEditMode()">
            ✎ Editar
          </button>
          <button class="action-btn delete-btn" (click)="showDeleteConfirm = true">
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <!-- Edit Form -->
      <form *ngIf="isEditMode && medicine" [formGroup]="editForm" (ngSubmit)="submitEdit()" class="edit-form">
        <div class="form-section">
          <div class="form-group">
            <label for="name">Nombre del medicamento</label>
            <input 
              id="name"
              type="text"
              formControlName="name"
              class="form-input"
            />
            <span class="error-message" *ngIf="isFieldInvalid('name')">
              El nombre es requerido
            </span>
          </div>

          <div class="form-group">
            <label for="dosage">Dosis (mg)</label>
            <input 
              id="dosage"
              type="number"
              formControlName="dosage"
              class="form-input"
              min="1"
            />
            <span class="error-message" *ngIf="isFieldInvalid('dosage')">
              Ingresa una dosis válida
            </span>
          </div>

          <div class="form-group">
            <label for="quantity">Cantidad de tabletas</label>
            <input 
              id="quantity"
              type="number"
              formControlName="quantity"
              class="form-input"
              min="1"
            />
            <span class="error-message" *ngIf="isFieldInvalid('quantity')">
              Ingresa una cantidad válida
            </span>
          </div>

          <div class="form-group">
            <label for="expirationDate">Fecha de caducidad</label>
            <input 
              id="expirationDate"
              type="date"
              formControlName="expirationDate"
              class="form-input"
            />
            <span class="error-message" *ngIf="isFieldInvalid('expirationDate')">
              La fecha es requerida
            </span>
          </div>

          <div class="form-group">
            <label for="barcodeData">Código de barras</label>
            <input 
              id="barcodeData"
              type="text"
              formControlName="barcodeData"
              class="form-input"
              readonly
            />
          </div>
        </div>

        <div class="edit-actions">
          <button type="submit" class="action-btn save-btn" [disabled]="!editForm.valid">
            💾 Guardar cambios
          </button>
          <button type="button" class="action-btn cancel-btn" (click)="toggleEditMode()">
            ✕ Cancelar
          </button>
        </div>

        <div *ngIf="isSubmitting" class="loading-overlay">
          <div class="spinner"></div>
          <p>Guardando...</p>
        </div>
      </form>

      <!-- Success Message -->
      <div *ngIf="submitSuccess" class="success-message">
        <span class="success-icon">✅</span>
        <p>Medicamento actualizado correctamente</p>
      </div>

      <!-- Delete Confirmation -->
      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="showDeleteConfirm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirmar eliminación</h2>
          </div>
          <div class="modal-content">
            <p>¿Estás seguro de que deseas eliminar este medicamento?</p>
            <p class="medicine-name-confirm">{{ medicine?.name }}</p>
          </div>
          <div class="modal-actions">
            <button class="action-btn secondary-btn" (click)="showDeleteConfirm = false">
              Cancelar
            </button>
            <button class="action-btn delete-btn" (click)="confirmDelete()">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      background: #f8f9fa;
      min-height: 100vh;
    }

    /* Header */
    .top-bar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn,
    .edit-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }

    .back-btn:hover,
    .edit-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .top-bar h1 {
      margin: 0;
      font-size: 1.25rem;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
      color: #666;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(102, 126, 234, 0.2);
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Detail View */
    .detail-view {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .overview-card {
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 2rem;
    }

    .card-header h2 {
      margin: 0;
      font-size: 2rem;
      color: #333;
      flex: 1;
    }

    .status-badge {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
      margin-left: 1rem;
    }

    .status-badge.critical {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.expired {
      background: #ffebee;
      color: #c62828;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #eee;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 0.75rem;
      color: #999;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .detail-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #333;
    }

    .detail-value.barcode {
      font-family: monospace;
      word-break: break-all;
      background: #f5f5f5;
      padding: 0.5rem;
      border-radius: 0.25rem;
    }

    .timeline {
      display: grid;
      gap: 1rem;
    }

    .timeline-event {
      display: flex;
      gap: 1rem;
      align-items: start;
    }

    .timeline-icon {
      font-size: 1.5rem;
    }

    .timeline-label {
      font-size: 0.85rem;
      color: #999;
      margin: 0;
      font-weight: 600;
    }

    .timeline-date {
      font-size: 0.95rem;
      color: #333;
      margin: 0.25rem 0 0 0;
    }

    /* Detail Actions */
    .detail-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 1rem;
    }

    .edit-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .edit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .delete-btn {
      background: #ffebee;
      color: #d32f2f;
    }

    .delete-btn:hover {
      background: #d32f2f;
      color: white;
    }

    /* Edit Form */
    .edit-form {
      max-width: 800px;
      margin: 2rem auto;
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
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

    .edit-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 2rem;
    }

    .save-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .save-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .cancel-btn:hover {
      background: #667eea;
      color: white;
    }

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

    .loading-overlay p {
      color: white;
      font-weight: 600;
    }

    /* Messages */
    .success-message {
      max-width: 800px;
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

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .modal-content {
      padding: 1.5rem;
    }

    .modal-content p {
      margin: 0 0 1rem 0;
      color: #666;
    }

    .medicine-name-confirm {
      font-weight: 600;
      color: #d32f2f;
      font-size: 1.1rem;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .modal-actions .action-btn {
      flex: 1;
    }

    .secondary-btn {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .secondary-btn:hover {
      background: #667eea;
      color: white;
    }

    @media (max-width: 640px) {
      .card-header {
        flex-direction: column;
      }

      .status-badge {
        margin-left: 0;
        margin-top: 1rem;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .detail-actions,
      .edit-actions {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MedicineDetailComponent implements OnInit, OnDestroy {
  medicine: Medicine | null = null;
  editForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  submitSuccess = false;
  showDeleteConfirm = false;
  daysUntilExpiration = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private medicineService: MedicineService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.paramMap
        .pipe(
          switchMap(params => {
            const id = params.get('id');
            return id ? this.medicineService.getMedicineById(id) : [];
          })
        )
        .subscribe(medicine => {
          if (medicine) {
            this.medicine = medicine;
            this.updateDaysUntilExpiration();
            this.editForm.patchValue(medicine);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', Validators.required],
      dosage: ['', [Validators.required, Validators.min(1)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      expirationDate: ['', Validators.required],
      barcodeData: [{ value: '', disabled: true }]
    });
  }

  private updateDaysUntilExpiration(): void {
    if (this.medicine) {
      const today = new Date();
      const expDate = this.medicine.expirationDate instanceof Date
        ? this.medicine.expirationDate
        : parseISO(this.medicine.expirationDate as string);
      this.daysUntilExpiration = differenceInDays(expDate, today);
    }
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.submitSuccess = false;
    if (!this.isEditMode && this.medicine) {
      this.editForm.patchValue(this.medicine);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  submitEdit(): void {
    if (!this.editForm.valid || !this.medicine?.id) {
      return;
    }

    this.isSubmitting = true;
    const updatedMedicine: Medicine = {
      ...this.medicine,
      ...this.editForm.value
    };

    this.medicineService.updateMedicine(updatedMedicine).subscribe({
      next: (medicine) => {
        this.medicine = medicine;
        this.updateDaysUntilExpiration();
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.isEditMode = false;

        setTimeout(() => {
          this.submitSuccess = false;
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error updating medicine:', error);
      }
    });
  }

  confirmDelete(): void {
    if (this.medicine?.id) {
      this.medicineService.deleteMedicine(this.medicine.id).subscribe({
        next: () => {
          this.router.navigate(['/medicine-list']);
        },
        error: (error) => {
          console.error('Error deleting medicine:', error);
        }
      });
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : parseISO(date as string);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine-list']);
  }
}
