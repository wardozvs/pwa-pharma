import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MedicineService } from '../../services/medicine.service';
import { Medicine } from '../../models/medicine.model';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * MedicineListComponent displays all medicines with sorting and filtering options
 */
@Component({
  selector: 'app-medicine-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="list-container">
      <!-- Header -->
      <header class="top-bar">
        <button class="back-btn" (click)="goBack()">← Atrás</button>
        <h1>Medicamentos</h1>
        <button class="add-btn" routerLink="/add-medicine">➕</button>
      </header>

      <!-- Filter & Sort -->
      <div class="controls-section">
        <div class="filter-buttons">
          <button 
            class="filter-btn"
            [class.active]="filterType === 'all'"
            (click)="filterType = 'all'">
            Todos ({{ medicines.length }})
          </button>
          <button 
            class="filter-btn"
            [class.active]="filterType === 'expiring'"
            (click)="filterType = 'expiring'">
            Próximos a expirar ({{ expiringCount }})
          </button>
        </div>

        <div class="sort-options">
          <select 
            [(ngModel)]="sortBy"
            (change)="onSortChange()"
            class="sort-select">
            <option value="name">Nombre (A-Z)</option>
            <option value="expiration">Fecha Caducidad</option>
            <option value="newest">Más reciente</option>
          </select>
        </div>
      </div>

      <!-- Medicine List -->
      <div class="medicines-grid">
        <div *ngIf="filteredMedicines.length > 0; else emptyState">
          <div 
            class="medicine-card"
            *ngFor="let medicine of filteredMedicines"
            [routerLink]="['/medicines', medicine.id]">
            
            <div class="card-header">
              <h3 class="medicine-name">{{ medicine.name }}</h3>
              <span class="expiration-badge" [class.critical]="isDaysUntilExpiration(medicine) <= 30">
                <span *ngIf="isDaysUntilExpiration(medicine) > 0">
                  {{ isDaysUntilExpiration(medicine) }}d
                </span>
                <span *ngIf="isDaysUntilExpiration(medicine) <= 0" class="expired">
                  Expirado
                </span>
              </span>
            </div>

            <div class="card-content">
              <div class="info-row">
                <span class="info-label">Dosis:</span>
                <span class="info-value">{{ medicine.dosage }} mg</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cantidad:</span>
                <span class="info-value">{{ medicine.quantity }} tabletas</span>
              </div>
              <div class="info-row">
                <span class="info-label">Caduca:</span>
                <span class="info-value">{{ formatDate(medicine.expirationDate) }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button 
                class="action-btn edit-btn"
                (click)="goToEdit($event, medicine)">
                ✎ Editar
              </button>
              <button 
                class="action-btn delete-btn"
                (click)="deleteMedicine($event, medicine.id!)">
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>

        <ng-template #emptyState>
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h2>Sin medicamentos</h2>
            <p>No hay medicamentos registrados {{ filterType === 'expiring' ? 'próximos a expirar' : '' }}</p>
            <button class="action-btn primary-btn" routerLink="/add-medicine">
              Agregar medicamento
            </button>
          </div>
        </ng-template>
      </div>

      <!-- Confirmation Dialog -->
      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="cancelDelete()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirmar eliminación</h2>
          </div>
          <div class="modal-content">
            <p>¿Estás seguro de que deseas eliminar este medicamento?</p>
            <p class="medicine-name-confirm">{{ medicineToDelete?.name }}</p>
          </div>
          <div class="modal-actions">
            <button class="action-btn secondary-btn" (click)="cancelDelete()">
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
    .list-container {
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
    .add-btn {
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
    .add-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .top-bar h1 {
      margin: 0;
      font-size: 1.25rem;
    }

    /* Controls */
    .controls-section {
      padding: 1.5rem;
      background: white;
      border-bottom: 1px solid #eee;
      max-width: 1200px;
      margin: 0 auto;
    }

    .filter-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #ddd;
      background: white;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
      color: #666;
    }

    .filter-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: #667eea;
    }

    .filter-btn:hover {
      border-color: #667eea;
    }

    .sort-options {
      display: flex;
      gap: 1rem;
    }

    .sort-select {
      padding: 0.5rem;
      border: 2px solid #ddd;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      cursor: pointer;
      background: white;
    }

    .sort-select:focus {
      outline: none;
      border-color: #667eea;
    }

    /* Grid */
    .medicines-grid {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .medicine-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;
      cursor: pointer;
    }

    .medicine-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .medicine-name {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: #333;
    }

    .expiration-badge {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 0.25rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .expiration-badge.critical {
      background: #fff3cd;
      color: #856404;
    }

    .expiration-badge.expired {
      background: #ffebee;
      color: #c62828;
    }

    .card-content {
      margin-bottom: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;
    }

    .info-label {
      color: #666;
      font-weight: 600;
    }

    .info-value {
      color: #333;
    }

    .card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
      font-size: 0.9rem;
    }

    .edit-btn {
      background: #667eea;
      color: white;
    }

    .edit-btn:hover {
      background: #764ba2;
    }

    .delete-btn {
      background: #ffebee;
      color: #d32f2f;
    }

    .delete-btn:hover {
      background: #d32f2f;
      color: white;
    }

    .primary-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      color: #333;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #666;
      margin: 0 0 1.5rem 0;
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

    @media (max-width: 640px) {
      .controls-section {
        padding: 1rem;
      }

      .filter-buttons {
        flex-direction: column;
      }

      .filter-btn {
        width: 100%;
      }

      .card-actions {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MedicineListComponent implements OnInit, OnDestroy {
  medicines: Medicine[] = [];
  filteredMedicines: Medicine[] = [];
  filterType: 'all' | 'expiring' = 'all';
  sortBy: 'name' | 'expiration' | 'newest' = 'name';
  expiringCount = 0;

  showDeleteConfirm = false;
  medicineToDelete: Medicine | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private medicineService: MedicineService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.medicineService.medicines$.subscribe(medicines => {
        this.medicines = medicines;
        this.updateFilteredMedicines();
        this.expiringCount = medicines.filter(
          m => this.isDaysUntilExpiration(m) <= 60 && this.isDaysUntilExpiration(m) > 0
        ).length;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateFilteredMedicines(): void {
    let filtered = [...this.medicines];

    if (this.filterType === 'expiring') {
      filtered = filtered.filter(m => {
        const days = this.isDaysUntilExpiration(m);
        return days <= 60 && days > 0;
      });
    }

    this.applySort(filtered);
    this.filteredMedicines = filtered;
  }

  private applySort(medicines: Medicine[]): void {
    switch (this.sortBy) {
      case 'name':
        medicines.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'expiration':
        medicines.sort((a, b) => {
          const dateA = this.parseDate(a.expirationDate);
          const dateB = this.parseDate(b.expirationDate);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'newest':
        medicines.sort((a, b) => {
          const dateA = this.parseDate(a.createdAt || new Date());
          const dateB = this.parseDate(b.createdAt || new Date());
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }
  }

  onSortChange(): void {
    this.updateFilteredMedicines();
  }

  isDaysUntilExpiration(medicine: Medicine): number {
    const today = new Date();
    const expDate = this.parseDate(medicine.expirationDate);
    return differenceInDays(expDate, today);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = this.parseDate(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private parseDate(date: Date | string | undefined): Date {
    if (!date) return new Date();
    if (typeof date === 'string') {
      return parseISO(date);
    }
    return date;
  }

  goToEdit(event: Event, medicine: Medicine): void {
    event.stopPropagation();
    this.router.navigate(['/medicines', medicine.id, 'edit']);
  }

  deleteMedicine(event: Event, medicineId: string): void {
    event.stopPropagation();
    this.medicineToDelete = this.medicines.find(m => m.id === medicineId) || null;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (this.medicineToDelete?.id) {
      this.medicineService.deleteMedicine(this.medicineToDelete.id).subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.medicineToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting medicine:', error);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.medicineToDelete = null;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
