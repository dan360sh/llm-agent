import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chats-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px;">
      <h2>Chats List</h2>
      <p>This will show list of chats</p>
      <button style="background: #2196f3; color: white; border: none; padding: 10px 20px; border-radius: 4px;">
        Create Chat
      </button>
    </div>
  `
})
export class ChatsListComponent {
}
