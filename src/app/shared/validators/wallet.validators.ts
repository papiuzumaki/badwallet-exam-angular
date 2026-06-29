import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    // Senegalese phone: 7x XXX XX XX (10 digits starting with 7)
    const valid = /^7[0-9]{8}$/.test(value.replace(/\s/g, ''));
    return valid ? null : { invalidPhone: { value } };
  };
}

export function differentPhoneValidator(otherControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherControlName)?.value;
    if (!other || !control.value) return null;
    return control.value !== other ? null : { samePhone: true };
  };
}
