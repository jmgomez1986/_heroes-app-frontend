import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
}
