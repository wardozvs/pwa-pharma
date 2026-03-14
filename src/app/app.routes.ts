import { Routes } from '@angular/router';
import { SplashComponent } from './components/splash/splash.component';
import { HomeComponent } from './components/home/home.component';
import { AddMedicineComponent } from './components/add-medicine/add-medicine.component';
import { MedicineListComponent } from './components/medicine-list/medicine-list.component';
import { MedicineDetailComponent } from './components/medicine-detail/medicine-detail.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    component: SplashComponent
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'add-medicine',
    component: AddMedicineComponent
  },
  {
    path: 'medicine-list',
    component: MedicineListComponent
  },
  {
    path: 'medicines/:id',
    component: MedicineDetailComponent
  },
  {
    path: 'medicines/:id/edit',
    component: MedicineDetailComponent
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
