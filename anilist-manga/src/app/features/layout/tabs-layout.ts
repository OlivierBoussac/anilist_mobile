import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-tabs-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './tabs-layout.html',
  styleUrl: './tabs-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsLayout {}
