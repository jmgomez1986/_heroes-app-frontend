import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIcon],
  templateUrl: './header.html',
})
export class Header {
  // Fuente única del texto de marca del header (S1): la marca del shell
  // vive solo aquí, el footer tiene su propia línea de catálogo.
  protected readonly brandName = 'Heroes App';
}
