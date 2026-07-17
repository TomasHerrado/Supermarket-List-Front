import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ChoiceDialogData {
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor?: 'primary' | 'warn';
}

export type ChoiceDialogResult = 'primary' | 'secondary';

/**
 * Diálogo genérico de dos opciones. Reutilizable para cualquier
 * decisión binaria (duplicados, confirmaciones destructivas, etc.).
 */
@Component({
  selector: 'app-choice-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './choice-dialog.component.html',
  styleUrl: './choice-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceDialogComponent {
  protected readonly data = inject<ChoiceDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ChoiceDialogComponent, ChoiceDialogResult>);

  protected choose(choice: ChoiceDialogResult): void {
    this.dialogRef.close(choice);
  }
}