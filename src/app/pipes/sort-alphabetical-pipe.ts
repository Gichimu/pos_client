import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortAlphabetical',
  standalone: true,
})
export class SortAlphabeticalPipe implements PipeTransform {
  transform(array: any[], field: string): any[] {
    if (!array || !field) {
      return array;
    }

    // Return a copy of the sorted array to maintain pure change detection
    return [...array].sort((a, b) => {
      const valA = a[field] ? String(a[field]) : '';
      const valB = b[field] ? String(b[field]) : '';
      return valA.localeCompare(valB, undefined, { sensitivity: 'base' });
    });
  }
}
