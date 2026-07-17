import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DeviceService } from '../../core/services/device.service';

@Component({
  selector: 'app-device-registration',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './device-registration.component.html',
  styleUrl: './device-registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceRegistrationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.deviceService.register(this.form.controls.name.value);
    this.router.navigateByUrl('/');
  }
}