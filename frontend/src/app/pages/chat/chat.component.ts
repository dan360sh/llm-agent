import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px;">
      <h2>Chat</h2>
      <p>This will be the chat interface</p>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p>Chat messages will appear here</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <input type="text" placeholder="Type message..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <button style="background: #2196f3; color: white; border: none; padding: 10px 20px; border-radius: 4px;">Send</button>
      </div>
    </div>
  `
})
export class ChatComponent {
}
