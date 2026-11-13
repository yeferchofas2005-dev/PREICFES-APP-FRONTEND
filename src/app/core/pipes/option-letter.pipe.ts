import { Pipe, PipeTransform } from '@angular/core';

/** Convierte un índice numérico (0,1,2...) a letra de opción (A,B,C...) */
@Pipe({ name: 'optionLetter', standalone: true })
export class OptionLetterPipe implements PipeTransform {
  transform(index: number): string {
    return String.fromCharCode(65 + index); // 65 = 'A'
  }
}
