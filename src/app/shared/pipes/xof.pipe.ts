import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'xof', standalone: true })
export class XofPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'XOF'): string {
    if (value == null) return `0 ${currency}`;
    return `${new Intl.NumberFormat('fr-FR').format(value)} ${currency}`;
  }
}
