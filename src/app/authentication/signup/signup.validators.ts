import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

export function passwordMatchValidator(
  formGroup: AbstractControl,
): ValidationErrors | null {
  const group = formGroup as FormGroup;
  const password = group.get('password')?.value;
  const confirmPassword = group.get('repitpassword')?.value;
  if (!password && !confirmPassword) {
    return null;
  }
  return password === confirmPassword ? null : { passwordMismatch: true };
}

export function NoWhitespaceValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (String(control.value ?? '').includes(' ')) {
    return { whitespace: true };
  }
  return null;
}
