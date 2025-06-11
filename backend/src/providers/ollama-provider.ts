import axios from 'axios';
import { LLMProvider } from './llm-provider';
import { Message, OllamaConfig } from '../models/types';

export class OllamaProvider extends LLMProvider {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    super();
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseURL}/api/tags`);
      return response.status === 200;
    } catch (error) {
      console.error('Ollama connection test failed:', error);
      return false;
    }
  }

  async generateResponse(
    messages: Message[], 
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      console.log(messages, "messages1")
      const ollamaMessages = this.convertMessages(messages);
      
      if (onStream) {
        return await this.generateStreamingResponse(ollamaMessages, onStream);
      } else {
        return await this.generateNonStreamingResponse(ollamaMessages);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  private async generateStreamingResponse(
    messages: any[],
    onStream: (chunk: string) => void
  ): Promise<string> {
    console.log('OllamaProvider: Starting streaming response generation');
    console.log(messages, "messages")
    const response = await axios.post(
      `${this.config.baseURL}/api/chat`,
      {
        model: this.config.model,
        messages: messages,
        stream: true,
        options: {
          temperature: this.config.temperature || 0.7,
          num_predict: this.config.maxTokens || 3000
        }
      },
      {
        responseType: 'stream'
      }
    );

    let fullResponse = '';
    let streamCompleted = false;

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        console.log('Новый чанк');
        if (streamCompleted) {
          console.log('OllamaProvider: Stream already completed, ignoring chunk');
          return;
        }
        console.log('Новый чанк1');
        try {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message && data.message.content) {
                const content = data.message.content;
                fullResponse += content;
                
                // Безопасно вызываем callback
                try {
                  onStream(content);
                } catch (callbackError) {
                  console.error('OllamaProvider: Error in onStream callback:', callbackError);
                }
              }
              
              if (data.done) {
                console.log('OllamaProvider: Stream completed');
                streamCompleted = true;
                resolve(fullResponse);
                return;
              }
            } catch (e) {
              // Игнорируем некорректные JSON строки
            }
          }
        } catch (parseError) {
          console.error('OllamaProvider: Error parsing chunk:', parseError);
        }
      });

      response.data.on('error', (error: any) => {
        console.error('OllamaProvider: Stream error:', error);
        streamCompleted = true;
        reject(error);
      });

      response.data.on('end', () => {
        console.log('OllamaProvider: Stream ended');
        if (!streamCompleted) {
          streamCompleted = true;
          resolve(fullResponse);
        }
      });
      
      // Добавляем timeout для защиты от зависания
      setTimeout(() => {
        if (!streamCompleted) {
          console.log('OllamaProvider: Stream timeout, resolving with current response');
          streamCompleted = true;
          resolve(fullResponse);
        }
      }, 60000); // 60 секунд timeout
    });
  }

  private async generateNonStreamingResponse(messages: any[]): Promise<string> {
    const response = await axios.post(`${this.config.baseURL}/api/chat`, {
      model: this.config.model,
      messages: messages,
      stream: false,
      options: {
        temperature: this.config.temperature || 0.7,
        num_predict: this.config.maxTokens || 3000
      }
    });

    return response.data.message?.content || '';
  }

  private convertMessages(messages: Message[]): any[] {
    return messages.map(msg => {
      if (msg.images && msg.images.length > 0) {
        return {
          role: msg.role,
          content: msg.content,
          images: msg.images
        };
      } else {
        return {
          role: msg.role,
          content: msg.content
        };
      }
    });
  }

  supportsImages(): boolean {
    // Проверяем если модель поддерживает изображения (например, llava)
    return this.config.model.toLowerCase().includes('llava') ||
           this.config.model.toLowerCase().includes('vision');
  }
}
