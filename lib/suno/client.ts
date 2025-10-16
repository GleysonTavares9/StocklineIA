interface SongGenerationParams {
  prompt: string;
  title: string;
  tags: string;
  style?: string;
  duration?: number;
  continue_at?: number;
  mv?: string;
  instrument?: boolean;
}

export class SunoClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;

  constructor(options: { 
    apiKey: string; 
    baseUrl?: string; 
    timeout?: number;
    retryAttempts?: number;
  }) {
    if (!options.apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://suno-api-eta.vercel.app';
    this.timeout = options.timeout || 300000; // 5 minutos
    this.retryAttempts = options.retryAttempts || 3;
  }

  private async fetchWithRetry(
    endpoint: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    try {
      console.log(`🔧 Tentativa ${attempt}/${this.retryAttempts} para Suno API: ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 503) {
        console.log('🌐 Suno API indisponível (503)');
        throw new Error('SERVICE_UNAVAILABLE');
      }

      if (response.status === 429) {
        console.log('🚦 Rate limit excedido (429)');
        throw new Error('RATE_LIMIT');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Erro na API (${response.status}):`, errorData);
        throw new Error('API_ERROR');
      }

      return response;

    } catch (error: any) {
      console.log(`❌ Tentativa ${attempt} falhou:`, error.message);

      if (error.name === 'AbortError' || attempt >= this.retryAttempts) {
        const errorMessages: { [key: string]: string } = {
          'AbortError': 'O tempo de espera da requisição expirou. Tente novamente.',
          'SERVICE_UNAVAILABLE': 'O serviço de geração de músicas está temporariamente indisponível. Por favor, tente novamente em alguns minutos.',
          'RATE_LIMIT': 'Muitas requisições realizadas. Por favor, aguarde alguns minutos antes de tentar novamente.',
          'API_ERROR': 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
        };

        throw new Error(errorMessages[error.name] || errorMessages[error.message] || 'Erro desconhecido');
      }

      // Espera exponencial com jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      console.log(`⏳ Aguardando ${Math.round(delay/1000)}s antes de tentar novamente...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.fetchWithRetry(endpoint, options, attempt + 1);
    }
  }

  async generateSong(params: SongGenerationParams) {
    const { prompt, title, tags, style = 'chill', duration = 60, continue_at = 0, mv = 'chirp-v3-0', instrument = false } = params;
    
    const response = await this.fetchWithRetry('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        title,
        tags,
        style,
        duration,
        continue_at,
        mv,
        instrument
      })
    });
    
    return response.json();
  }

  // Método de compatibilidade
  async generateMusic(prompt: string, options: Partial<SongGenerationParams> = {}) {
    return this.generateSong({
      prompt,
      title: options.title || 'Generated Song',
      tags: options.tags || 'pop, electronic',
      style: options.style,
      duration: options.duration,
      continue_at: options.continue_at,
      mv: options.mv,
      instrument: options.instrument
    });
  }

  async getSongStatus(songId: string) {
    const response = await this.fetchWithRetry(`/api/generate/${songId}`, {
      method: 'GET'
    });
    
    return response.json();
  }
}

// Função factory para criar instância do cliente
export function createSunoClient(options: { 
  apiKey: string; 
  baseUrl?: string; 
  timeout?: number;
  retryAttempts?: number;
}) {
  return new SunoClient(options);
}

// Função de compatibilidade para importações existentes
export function getSunoClient(options: Parameters<typeof createSunoClient>[0]) {
  return createSunoClient(options);
}