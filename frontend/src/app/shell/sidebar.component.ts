import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from './nav-item.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected readonly items: NavItem[] = [
    {
      route: '/home',
      label: 'Home',
      iconPath: 'M3 9.6 12 3l9 6.6V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.6Z',
    },
    {
      route: '/transactions',
      label: 'Transactions',
      iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    },
  ];
}
