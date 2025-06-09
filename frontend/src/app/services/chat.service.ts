import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Chat, Message, CreateChatRequest } from '../models';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private currentChatSubject = new BehaviorSubject<Chat | null>(null);
  private isGeneratingSubject = new BehaviorSubject<boolean>(false);

  public chats$ = this.chatsSubject.asObservable();
  public currentChat$ = this.currentChatSubject.asObservable();
  public isGenerating$ = this.isGeneratingSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private webSocketService: WebSocketService
  ) {
    // Убираем автоматическое подключение
  }

  loadChats(): Observable<Chat[]> {
    return this.apiService.getChats().pipe(
      map(response => response.data || []),
      tap(chats => this.chatsSubject.next(chats))
    );
  }

  createChat(request: CreateChatRequest): Observable<Chat> {
    return this.apiService.createChat(request).pipe(
      map(response => response.data!),
      tap(chat => {
        const currentChats = this.chatsSubject.value;
        this.chatsSubject.next([chat, ...currentChats]);
      })
    );
  }

  selectChat(chatId: string): Observable<Chat> {
    return this.apiService.getChat(chatId).pipe(
      map(response => response.data!),
      tap(chat => this.currentChatSubject.next(chat))
    );
  }

  deleteChat(chatId: string): Observable<void> {
    return this.apiService.deleteChat(chatId).pipe(
      map(response => response.data!),
      tap(() => {
        const currentChats = this.chatsSubject.value;
        const updatedChats = currentChats.filter(c => c.id !== chatId);
        this.chatsSubject.next(updatedChats);
        
        if (this.currentChatSubject.value?.id === chatId) {
          this.currentChatSubject.next(null);
        }
      })
    );
  }

  sendMessage(content: string, images?: File[]): Observable<void> {
    const currentChat = this.currentChatSubject.value;
    if (!currentChat) {
      throw new Error('No chat selected');
    }

    // Добавляем пользовательское сообщение
    const userMessage: Message = {
      id: Date.now().toString(),
      chatId: currentChat.id,
      content,
      role: 'user',
      timestamp: new Date(),
      images: images?.map(f => f.name)
    };

    currentChat.messages.push(userMessage);
    this.currentChatSubject.next({ ...currentChat });

    return this.apiService.sendMessage({
      chatId: currentChat.id,
      content,
      images
    }).pipe(
      map(response => response.data!)
    );
  }

  stopGeneration(): void {
    this.webSocketService.stopGeneration();
    this.isGeneratingSubject.next(false);
  }

  updateChatLLM(llmModelId: string): Observable<Chat> {
    const currentChat = this.currentChatSubject.value;
    if (!currentChat) {
      throw new Error('No chat selected');
    }

    return this.apiService.updateChatLLM(currentChat.id, llmModelId).pipe(
      map(response => response.data!),
      tap(chat => this.currentChatSubject.next(chat))
    );
  }

  updateChatMCP(mcpServers: string[]): Observable<Chat> {
    const currentChat = this.currentChatSubject.value;
    if (!currentChat) {
      throw new Error('No chat selected');
    }

    return this.apiService.updateChatMCP(currentChat.id, mcpServers).pipe(
      map(response => response.data!),
      tap(chat => this.currentChatSubject.next(chat))
    );
  }
}
