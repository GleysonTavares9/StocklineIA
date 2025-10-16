interface SunoClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface SongGenerationParams {
  prompt: string;
  duration?: number;
  tags?: string[];
  title?: string;
  style?: string;
  bpm?: number;
  key?: string;
  genre?: string;
}

interface SongResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audio_url?: string;
  duration: number;
  title: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export class SunoClient {
  private static instance: SunoClient;
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 segundo

  private constructor(config: SunoClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.suno.ai/v1';
    this.timeout = config.timeout || 30000; // 30 segundos
  }

  public static getInstance(config: SunoClientConfig): SunoClient {
    if (!SunoClient.instance) {
      SunoClient.instance = new SunoClient(config);
    }
    return SunoClient.instance;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
    };
  }

  private async fetchWithRetry<T>(
    url: string, 
    options: RequestInit,
    attempt: number = 1
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (attempt >= this.retryAttempts) {
        throw new Error(
          `Falha após ${this.retryAttempts} tentativas: ${errorMessage}`
        );
      }

      // Espera exponencial entre tentativas
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.fetchWithRetry<T>(url, options, attempt + 1);
    }
  }

  async generateSong(params: SongGenerationParams): Promise<SongResponse> {
    const url = `${this.baseUrl}/generate`;
    const body = {
      prompt: params.prompt,
      duration: Math.min(Math.max(30, params.duration || 60), 300), // 30s a 5min
      tags: params.tags || [],
      title: params.title || `Música Gerada - ${new Date().toISOString()}`,
      style: params.style,
      bpm: params.bpm,
      key: params.key,
      genre: params.genre,
    };

    return this.fetchWithRetry<SongResponse>(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
  }

  async getSongStatus(songId: string): Promise<SongResponse> {
    const url = `${this.baseUrl}/songs/${songId}`;
    
    return this.fetchWithRetry<SongResponse>(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async downloadSong(songId: string): Promise<Blob> {
    const url = `${this.baseUrl}/songs/${songId}/download`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Falha ao baixar a música');
    }

    return response.blob();
  }

  async listSongs(limit: number = 10, offset: number = 0): Promise<SongResponse[]> {
    const url = `${this.baseUrl}/songs?limit=${limit}&offset=${offset}`;
    
    return this.fetchWithRetry<SongResponse[]>(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async deleteSong(songId: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/songs/${songId}`;
    
    return this.fetchWithRetry<{ success: boolean }>(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

export const getSunoClient = (config: SunoClientConfig) => 
  SunoClient.getInstance(config);
