import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DeviceService } from '../services/device.service';

/**
 * Permite entrar a la lista solo si el dispositivo ya tiene nombre registrado.
 * Si no, redirige a la pantalla de bienvenida.
 */
export const deviceRegisteredGuard: CanActivateFn = () => {
  const deviceService = inject(DeviceService);
  const router = inject(Router);

  return deviceService.isRegistered() ? true : router.parseUrl('/bienvenida');
};

/**
 * Evita que un dispositivo ya registrado vuelva a ver la pantalla de bienvenida
 * si escribe esa URL manualmente.
 */
export const alreadyRegisteredGuard: CanActivateFn = () => {
  const deviceService = inject(DeviceService);
  const router = inject(Router);

  return !deviceService.isRegistered() ? true : router.parseUrl('/');
};