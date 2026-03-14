import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * SplashComponent displays a loading screen on app startup
 * Navigates to home after a brief delay
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-container">
      <div class="splash-content">
        <div class="logo">
          <div class="pill-icon">💊</div>
        </div>
        <h1>PharmaManager</h1>
        <p class="subtitle">Gestión de Medicamentos</p>
        <div class="loader">
          <div class="spinner"></div>
        </div>
        <p class="loading-text">Cargando...</p>
      </div>
    </div>
  `,
  styles: [`
    .splash-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .splash-content {
      text-align: center;
      color: white;
    }

    .logo {
      margin-bottom: 2rem;
    }

    .pill-icon {
      font-size: 4rem;
      animation: bounce 2s infinite;
    }

    h1 {
      font-size: 2.5rem;
      margin: 1rem 0;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .loader {
      margin: 2rem 0;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    .loading-text {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 640px) {
      h1 {
        font-size: 2rem;
      }

      .pill-icon {
        font-size: 3rem;
      }

      .subtitle {
        font-size: 1rem;
      }
    }
  `]
})
export class SplashComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Navigate to home after 3 seconds
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 3000);
  }
}
