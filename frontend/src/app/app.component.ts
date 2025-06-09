import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  template: `
    <div class="app-container">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>LLM Agent</h2>
        </div>
        <ul class="nav-list">
          <li><a routerLink="/chats" routerLinkActive="active">Chats</a></li>
          <li><a routerLink="/chat" routerLinkActive="active">Chat</a></li>
          <li><a routerLink="/settings" routerLinkActive="active">Settings</a></li>
        </ul>
      </nav>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      width: 100vw;
    }

    .sidebar {
      width: 280px;
      background-color: #f5f5f5;
      border-right: 1px solid #ddd;
      padding: 0;
    }

    .sidebar-header {
      padding: 20px;
      background-color: #2196f3;
      color: white;
      margin: 0;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-list li {
      border-bottom: 1px solid #eee;
    }

    .nav-list a {
      display: block;
      padding: 15px 20px;
      text-decoration: none;
      color: #333;
      transition: background-color 0.2s;
    }

    .nav-list a:hover,
    .nav-list a.active {
      background-color: #e3f2fd;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background-color: #fafafa;
    }
  `]
})
export class AppComponent {
  title = 'LLM Agent';
}
