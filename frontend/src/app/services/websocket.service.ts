import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { StreamResponse } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;

  // Subjects for different socket events
  private streamSubject = new Subject<StreamResponse>();
  private chatUpdatedSubject = new Subject<any>();
  private errorSubject = new Subject<any>();

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.socket && this.connected) {
      return;
    }

    this.socket = io(environment.wsUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected = false;
    });

    this.socket.on('message-stream', (data: StreamResponse) => {
      this.streamSubject.next(data);
    });

    this.socket.on('chat-updated', (data: any) => {
      this.chatUpdatedSubject.next(data);
    });

    this.socket.on('message-error', (data: any) => {
      this.errorSubject.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connected = false;
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  public reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  public joinChat(chatId: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('join-chat', chatId);
    }
  }

  public leaveChat(chatId: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  public getMessageStream(): Observable<StreamResponse> {
    return this.streamSubject.asObservable();
  }

  public getChatUpdates(): Observable<any> {
    return this.chatUpdatedSubject.asObservable();
  }

  public getErrors(): Observable<any> {
    return this.errorSubject.asObservable();
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
