import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ProductService } from '../../core/services/product.service';
import { DeviceService } from '../../core/services/device.service';
import { Product } from '../../core/models/product.model';

import { MatDialog } from '@angular/material/dialog';
import { ProductFormComponent } from './product-form/product-form.component';

import { ChoiceDialogComponent } from '../../shared/dialogs/choice-dialog/choice-dialog.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  protected readonly productService = inject(ProductService);
  protected readonly deviceService = inject(DeviceService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.productService.loadAll();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        const trimmed = term.trim();
        trimmed ? this.productService.search(trimmed) : this.productService.loadAll();
      });
  }

  protected onTogglePurchased(product: Product): void {
    const userName = this.deviceService.deviceName() ?? 'Desconocido';
    this.productService.togglePurchased(product.id, userName).subscribe();
  }

  protected onDelete(product: Product): void {
    this.productService.delete(product.id).subscribe();
  }

  private readonly dialog = inject(MatDialog);

 protected openCreateDialog(): void {
    this.dialog.open(ProductFormComponent, { width: '420px', maxWidth: '95vw', data: {} });
  }

  protected openEditDialog(product: Product): void {
    this.dialog.open(ProductFormComponent, { width: '420px', maxWidth: '95vw', data: { product } });
  }
  protected onSelectAll(): void {
    const userName = this.deviceService.deviceName() ?? 'Desconocido';
    this.productService.markAllAsPurchased(userName).subscribe();
  }

  protected onDeselectAll(): void {
    const userName = this.deviceService.deviceName() ?? 'Desconocido';
    this.productService.markAllAsUnpurchased(userName).subscribe();
  }

  protected onClearList(): void {
    const dialogRef = this.dialog.open(ChoiceDialogComponent, {
      width: '360px',
      maxWidth: '90vw',
      data: {
        title: 'Vaciar la lista',
        message: 'Se eliminarán todos los productos. Esta acción no se puede deshacer.',
        primaryLabel: 'Vaciar lista',
        secondaryLabel: 'Cancelar',
        primaryColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((choice) => {
      if (choice === 'primary') {
        this.productService.clearAll().subscribe();
      }
    });
  }
}