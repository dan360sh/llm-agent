import { Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component';
import { ChatsListComponent } from './pages/chats-list/chats-list.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/chats', pathMatch: 'full' },
  { path: 'chat', component: ChatComponent },
  { path: 'chat/:id', component: ChatComponent },
  { path: 'chats', component: ChatsListComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '/chats' }
];
