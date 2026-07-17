import { Routes } from '@angular/router';
import { alreadyRegisteredGuard, deviceRegisteredGuard } from './core/guards/device.guard';

export const routes: Routes = [
  {
    path: 'bienvenida',
    canActivate: [alreadyRegisteredGuard],
    loadComponent: () =>
      import('./features/device-registration/device-registration.component').then(
        (m) => m.DeviceRegistrationComponent,
      ),
  },
  {
    path: '',
    canActivate: [deviceRegisteredGuard],
    loadComponent: () =>
      import('./features/product-list/product-list.component').then(
        (m) => m.ProductListComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];