import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

interface StreamResponse {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private streamSubject = new Subject<StreamResponse>();

  connect(): void {
    console.log('WebSocket service initialized (simplified version)');
  }

  disconnect(): void {
    console.log('WebSocket disconnected');
  }

  getStreamResponse(): Observable<StreamResponse> {
    return this.streamSubject.asObservable();
  }

  stopGeneration(): void {
    console.log('Stop generation requested');
  }
}