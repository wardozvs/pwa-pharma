import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { MedicineService } from '../../services/medicine.service';
import { NotificationService } from '../../services/notification.service';
import { Medicine, MedicineNotification } from '../../models/medicine.model';

/**
 * HomeComponent displays the main dashboard with medicine list and quick actions
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <span class="pill-icon">💊</span>
            <span>PharmaManager</span>
          </h1>
          <div class="header-icons">
            <button class="icon-btn notification-btn" *ngIf="hasExpiringMedicines">
              <span class="notification-badge">{{ expiringCount }}</span>
              <span class="notification-icon">🔔</span>
            </button>
            <button class="icon-btn" (click)="toggleOfflineMode()">
              <span [title]="isOnline ? 'Conectado' : 'Modo Offline'">
                {{ isOnline ? '🌐' : '📴' }}
              </span>
            </button>
          </div>
        </div>
      </header>

      <!-- Quick Stats -->
      <section class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">💊</div>
          <div class="stat-content">
            <p class="stat-label">Total de medicamentos</p>
            <p class="stat-value">{{ medicines.length }}</p>
          </div>
        </div>
        <div class="stat-card warning" *ngIf="hasExpiringMedicines">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <p class="stat-label">Próximos a expirar</p>
            <p class="stat-value">{{ expiringCount }}</p>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="action-section">
        <button class="action-btn primary-btn" routerLink="/add-medicine">
          <span class="btn-icon">➕</span>
          <span class="btn-text">Agregar Medicamento</span>
        </button>
        <button class="action-btn secondary-btn" routerLink="/medicine-list">
          <span class="btn-icon">📋</span>
          <span class="btn-text">Ver Lista Completa</span>
        </button>
      </section>

      <!-- Expiring Medicines Alerts -->
      <section class="alerts-section" *ngIf="expiringMedicines.length > 0">
        <h2 class="section-title">Medicamentos próximos a expirar</h2>
        <div class="alert-list">
          <div class="alert-item" *ngFor="let notification of expiringMedicines">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <p class="alert-medicine">{{ notification.medicineName }}</p>
              <p class="alert-date">Expira en {{ notification.daysUntilExpiration }} días</p>
            </div>
            <button class="alert-action" [routerLink]="['/medicines', notification.medicineId]">
              Ver
            </button>
          </div>
        </div>
      </section>

      <!-- Recent Medicines -->
      <section class="recent-section" *ngIf="medicines.length > 0">
        <h2 class="section-title">Medicamentos recientes</h2>
        <div class="medicine-list">
          <div class="medicine-item" *ngFor="let medicine of recentMedicines">
            <div class="medicine-info">
              <p class="medicine-name">{{ medicine.name }}</p>
              <p class="medicine-dosage">{{ medicine.dosage }} mg</p>
            </div>
            <div class="medicine-qty">
              <p class="qty-label">Cantidad</p>
              <p class="qty-value">{{ medicine.quantity }}</p>
            </div>
            <button class="medicine-action" [routerLink]="['/medicines', medicine.id]">
              →
            </button>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <section class="empty-state" *ngIf="medicines.length === 0">
        <div class="empty-icon">🏥</div>
        <h2>Sin medicamentos registrados</h2>
        <p>Comienza agregando tu primer medicamento</p>
        <button class="action-btn primary-btn" routerLink="/add-medicine">
          Agregar Medicamento
        </button>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      background: #f8f9fa;
      min-height: 100vh;
      padding-bottom: 2rem;
    }

    /* Header */
    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .app-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      margin: 0;
    }

    .pill-icon {
      font-size: 2rem;
    }

    .header-icons {
      display: flex;
      gap: 1rem;
    }

    .icon-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 0.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1.2rem;
      transition: background 0.3s;
      position: relative;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .notification-btn {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff4757;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: bold;
    }

    /* Stats Section */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.warning {
      background: #fff3cd;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
    }

    /* Action Section */
    .action-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
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

    .btn-icon {
      font-size: 1.25rem;
    }

    /* Alerts Section */
    .alerts-section {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: #333;
    }

    .alert-list {
      display: grid;
      gap: 0.75rem;
    }

    .alert-item {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .alert-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
    }

    .alert-medicine {
      font-weight: 600;
      margin: 0;
      color: #333;
    }

    .alert-date {
      font-size: 0.875rem;
      color: #666;
      margin: 0.25rem 0 0 0;
    }

    .alert-action {
      background: #ffc107;
      border: none;
      color: #333;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }

    .alert-action:hover {
      background: #ffb300;
    }

    /* Recent Section */
    .recent-section {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .medicine-list {
      display: grid;
      gap: 0.75rem;
    }

    .medicine-item {
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s;
    }

    .medicine-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .medicine-info {
      flex: 1;
    }

    .medicine-name {
      font-weight: 600;
      margin: 0;
      color: #333;
    }

    .medicine-dosage {
      font-size: 0.875rem;
      color: #666;
      margin: 0.25rem 0 0 0;
    }

    .medicine-qty {
      text-align: center;
    }

    .qty-label {
      font-size: 0.75rem;
      color: #999;
      margin: 0;
    }

    .qty-value {
      font-weight: 700;
      font-size: 1.25rem;
      margin: 0;
      color: #667eea;
    }

    .medicine-action {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }

    .medicine-action:hover {
      background: #764ba2;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
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

    @media (max-width: 640px) {
      .action-section,
      .stats-section {
        grid-template-columns: 1fr;
      }

      .app-title {
        font-size: 1.2rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  medicines: Medicine[] = [];
  expiringMedicines: MedicineNotification[] = [];
  expiringCount = 0;
  isOnline = true;
  hasExpiringMedicines = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private medicineService: MedicineService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to medicines list
    this.subscriptions.push(
      this.medicineService.medicines$.subscribe(medicines => {
        this.medicines = medicines;
      })
    );

    // Subscribe to expiring medicines notifications
    this.subscriptions.push(
      this.medicineService.notifications$.subscribe(notifications => {
        this.expiringMedicines = notifications;
        this.expiringCount = notifications.length;
        this.hasExpiringMedicines = notifications.length > 0;
      })
    );

    // Subscribe to online status
    this.subscriptions.push(
      this.medicineService.isOnline$.subscribe(isOnline => {
        this.isOnline = isOnline;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get recentMedicines(): Medicine[] {
    return this.medicines.slice(0, 5);
  }

  toggleOfflineMode(): void {
    // This is just for UI feedback; actual offline mode is handled by PWA
    console.log('Offline mode indicator clicked');
  }
}
