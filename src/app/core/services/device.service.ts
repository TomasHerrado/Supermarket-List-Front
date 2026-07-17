import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'sl_device_name';

/**
 * Gestiona el nombre de este dispositivo/usuario, persistido en localStorage.
 * Ese nombre se usa para registrar quién agrega/edita/marca cada producto.
 */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _deviceName = signal<string | null>(this.readFromStorage());

  /** Nombre guardado para este dispositivo, o `null` si nunca se registró. */
  readonly deviceName = this._deviceName.asReadonly();

  /** `true` si este dispositivo ya tiene un nombre guardado. */
  readonly isRegistered = computed(() => this._deviceName() !== null);

  /**
   * Guarda el nombre del dispositivo (primera vez o si el usuario lo cambia).
   * @throws Error si el nombre está vacío.
   */
  register(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('El nombre no puede estar vacío.');
    }

    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    }
    this._deviceName.set(trimmed);
  }

  /** Olvida el nombre guardado (por si querés un botón "cambiar de usuario"). */
  clear(): void {
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this._deviceName.set(null);
  }

  private readFromStorage(): string | null {
    if (!this.isBrowser) {
      return null; // En el servidor no hay localStorage: asumimos "no registrado" hasta hidratar.
    }
    return localStorage.getItem(STORAGE_KEY);
  }
}