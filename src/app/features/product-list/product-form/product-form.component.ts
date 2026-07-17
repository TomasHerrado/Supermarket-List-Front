import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ProductService } from '../../../core/services/product.service';
import { DeviceService } from '../../../core/services/device.service';
import { ApiError, Product, ProductRequest } from '../../../core/models/product.model';
import { ChoiceDialogComponent, ChoiceDialogResult } from '../../../shared/dialogs/choice-dialog/choice-dialog.component';

export interface ProductFormDialogData {
  product?: Product;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly deviceService = inject(DeviceService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<ProductFormComponent>);
  protected readonly data = inject<ProductFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditing = !!this.data.product;
  protected submitting = false;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.product?.name ?? '', [Validators.required, Validators.minLength(2)]],
    description: [this.data.product?.description ?? ''],
    quantity: [this.data.product?.quantity ?? 1, [Validators.required, Validators.min(1)]],
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userName = this.deviceService.deviceName() ?? 'Desconocido';
    const request: ProductRequest = { ...this.form.getRawValue(), userName };
    this.submitting = true;

    const request$ = this.isEditing
      ? this.productService.update(this.data.product!.id, request)
      : this.productService.create(request);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.dialogRef.close();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (!this.isEditing && err.status === 409) {
          this.handleDuplicate(request, (err.error as ApiError | null)?.message);
        }
      },
    });
  }

  /**
   * El backend rechazó la creación porque ya existe un producto con ese nombre.
   * Le damos al usuario las dos salidas que pide el spec.
   */
  private handleDuplicate(request: ProductRequest, message?: string): void {
    const choiceRef = this.dialog.open(ChoiceDialogComponent, {
      width: '360px',
      maxWidth: '90vw',
      data: {
        title: 'Producto duplicado',
        message: message ?? 'Este producto ya existe en la lista.',
        primaryLabel: 'Modificar cantidad',
        secondaryLabel: 'Crear otro producto',
      },
    });

    choiceRef.afterClosed().subscribe((choice: ChoiceDialogResult | undefined) => {
      if (choice === 'primary') {
        this.mergeQuantityWithExisting(request);
      }
      // 'secondary' o cierre sin elegir: el formulario queda abierto
      // para que el usuario ajuste el nombre y lo distinga del existente.
    });
  }

  private mergeQuantityWithExisting(request: ProductRequest): void {
    this.productService.findExistingByName(request.name).subscribe((existing) => {
      if (!existing) {
        return;
      }
      const newQuantity = existing.quantity + request.quantity;
      this.productService
        .updateQuantity(existing.id, { quantity: newQuantity, userName: request.userName })
        .subscribe(() => this.dialogRef.close());
    });
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }
}