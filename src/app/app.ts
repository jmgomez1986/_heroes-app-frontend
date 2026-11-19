import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { Footer } from './shared/components/footer/footer';
import { Header } from './shared/components/header/header';
import { Breadcrumb } from './shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Breadcrumb, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('heroes-app');
  private readonly router = inject(Router);

  constructor() {
    // Siempre al tope al cambiar de ruta (crear, editar, paginar, volver atrás...).
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => window.scrollTo(0, 0));
  }
}
