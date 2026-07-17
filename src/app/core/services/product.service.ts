import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductRequest, UpdateQuantityRequest } from '../models/product.model';

/**
 * Punto único de acceso a la API de productos.
 * Mantiene el estado de la lista compartida en Signals para que
 * los componentes se re-rendericen automáticamente ante cualquier cambio.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  private readonly _products = signal<Product[]>([]);
  private readonly _loading = signal(false);

  /** Lista actual de productos (solo lectura desde afuera). */
  readonly products = this._products.asReadonly();

  /** Indica si hay una petición de carga en curso. */
  readonly loading = this._loading.asReadonly();

  /** Cantidad de productos aún no marcados como comprados. */
  readonly pendingCount = computed(
    () => this._products().filter((p) => !p.purchased).length,
  );
  /** Hay al menos un producto sin comprar. */
  readonly hasPendingProducts = computed(
    () => this._products().some((p) => !p.purchased));

  /** Hay al menos un producto ya comprado. */
  readonly hasPurchasedProducts = computed(
    () => this._products().some((p) => p.purchased));

  /** Trae todos los productos y reemplaza el estado local. */
  loadAll(): void {
    this._loading.set(true);
    this.http.get<Product[]>(this.baseUrl).subscribe({
      next: (products) => this._products.set(products),
      error: () => undefined,
      complete: () => this._loading.set(false),
    });
  }

  /** Busca productos por nombre (usa el parámetro `search` del backend). */
  search(term: string): void {
    this._loading.set(true);
    const params = new HttpParams().set('search', term);
    this.http.get<Product[]>(this.baseUrl, { params }).subscribe({
      next: (products) => this._products.set(products),
      error: () => undefined,
      complete: () => this._loading.set(false),
    });
  }

  /**
   * Crea un producto. Si ya existe, el backend responde 409;
   * el componente que llame a este método decide cómo manejarlo.
   */
  create(request: ProductRequest): Observable<Product> {
    return this.http
      .post<Product>(this.baseUrl, request)
      .pipe(tap((created) => this._products.update((list) => [...list, created])));
  }

  /** Edita nombre, descripción y/o cantidad de un producto existente. */
  update(id: number, request: ProductRequest): Observable<Product> {
    return this.http
      .put<Product>(`${this.baseUrl}/${id}`, request)
      .pipe(tap((updated) => this.replaceInList(updated)));
  }

  /** Actualiza únicamente la cantidad (caso "el producto ya existe, sumar cantidad"). */
  updateQuantity(id: number, request: UpdateQuantityRequest): Observable<Product> {
    return this.http
      .patch<Product>(`${this.baseUrl}/${id}/quantity`, request)
      .pipe(tap((updated) => this.replaceInList(updated)));
  }

  /** Marca/desmarca un producto como comprado. */
  togglePurchased(id: number, userName: string): Observable<Product> {
    const params = new HttpParams().set('userName', userName);
    return this.http
      .patch<Product>(`${this.baseUrl}/${id}/toggle-purchased`, null, { params })
      .pipe(tap((updated) => this.replaceInList(updated)));
  }

  /** Elimina un producto puntual. */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._products.update((list) => list.filter((p) => p.id !== id))));
  }

  /** Vacía toda la lista ("Limpiar lista"). */
  clearAll(): Observable<void> {
    return this.http
      .delete<void>(this.baseUrl)
      .pipe(tap(() => this._products.set([])));
  }

  /** Marca como comprados todos los productos aún pendientes. */
  markAllAsPurchased(userName: string): Observable<Product[]> {
    const pending = this._products().filter((p) => !p.purchased);
    return pending.length === 0
      ? of([])
      : forkJoin(pending.map((p) => this.togglePurchased(p.id, userName)));
  }

  /** Desmarca todos los productos actualmente comprados. */
  markAllAsUnpurchased(userName: string): Observable<Product[]> {
    const purchased = this._products().filter((p) => p.purchased);
    return purchased.length === 0
      ? of([])
      : forkJoin(purchased.map((p) => this.togglePurchased(p.id, userName)));
  }
  /**
   * Busca un producto por nombre exacto (case-insensitive) sin tocar
   * el estado de la grilla que el usuario esté viendo (usada para
   * ubicar el producto en conflicto ante un 409 por duplicado).
   */
  findExistingByName(name: string): Observable<Product | undefined> {
    const params = new HttpParams().set('search', name);
    return this.http
      .get<Product[]>(this.baseUrl, { params })
      .pipe(map((list) => list.find((p) => p.name.toLowerCase() === name.trim().toLowerCase())));
  }

  private replaceInList(updated: Product): void {
    this._products.update((list) =>
      list.map((p) => (p.id === updated.id ? updated : p)),
    );
  }
}