import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  menuItems = [
    {
      label: 'Chats',
      icon: 'chat',
      route: '/chats',
      children: []
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/settings',
      children: [
        {
          label: 'LLM Models',
          icon: 'psychology',
          route: '/settings/llm-models'
        },
        {
          label: 'MCP Servers',
          icon: 'hub',
          route: '/settings/mcp-servers'
        },
        {
          label: 'Agents',
          icon: 'smart_toy',
          route: '/settings/agents'
        }
      ]
    }
  ];

  expandedItems: Set<string> = new Set();

  toggleExpanded(label: string): void {
    if (this.expandedItems.has(label)) {
      this.expandedItems.delete(label);
    } else {
      this.expandedItems.add(label);
    }
  }

  isExpanded(label: string): boolean {
    return this.expandedItems.has(label);
  }
}
