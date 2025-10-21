import { SUNO_CONFIG } from './config';

export interface SongGenerationParams {
  prompt: string;
  title: string;
  tags: string;
  style?: string;
  duration?: number;
  continue_at?: number;
  mv?: string;
  instrumental?: boolean;
  callBackUrl?: string;
  customMode?: boolean;
  model?: string;
  vocalGender?: string;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export class SunoClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: SunoClientOptions) {
    if (!options?.apiKey) {
      throw new Error('Suno API key is required');
    }
    
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || SUNO_CONFIG.BASE_URL;
    this.timeout = options.timeout || SUNO_CONFIG.TIMEOUT;
    this.retryAttempts = options.retryAttempts || SUNO_CONFIG.RETRY_ATTEMPTS;
    this.defaultHeaders = {
      ...SUNO_CONFIG.HEADERS,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private async fetchWithRetry<T = any>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<T> {
    try {
      console.log(`🔧 Tentativa ${attempt}/${this.retryAttempts} para Suno API: ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const url = new URL(endpoint, this.baseUrl).toString();
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.defaultHeaders,
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.status === 503) {
        console.log('🌐 Suno API indisponível (503)');
        throw new Error('SERVICE_UNAVAILABLE');
      }

      if (response.status === 429) {
        console.log('🚦 Rate limit excedido (429)');
        throw new Error('RATE_LIMIT');
      }

      if (!response.ok) {
        console.error(`❌ Erro na API (${response.status}):`, data);
        throw new Error('API_ERROR');
      }

      return data as T;

    } catch (error: any) {
      console.log(`❌ Tentativa ${attempt} falhou:`, error.message);

      if (error.name === 'AbortError' || attempt >= this.retryAttempts) {
        const errorMessages: Record<string, string> = {
          'AbortError': 'O tempo de espera da requisição expirou. Tente novamente.',
          'SERVICE_UNAVAILABLE': 'O serviço de geração de músicas está temporariamente indisponível. Por favor, tente novamente em alguns minutos.',
          'RATE_LIMIT': 'Muitas requisições realizadas. Por favor, aguarde alguns minutos antes de tentar novamente.',
          'API_ERROR': 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
        };

        throw new Error(errorMessages[error.name] || error.message || 'Erro desconhecido');
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
    const { 
      prompt, 
      title, 
      tags, 
      style = SUNO_CONFIG.DEFAULT_GENERATION_OPTIONS.style,
      duration = SUNO_CONFIG.DEFAULT_GENERATION_OPTIONS.duration,
      continue_at = 0,
      mv = SUNO_CONFIG.DEFAULT_GENERATION_OPTIONS.mv,
      instrumental = SUNO_CONFIG.DEFAULT_GENERATION_OPTIONS.instrumental,
      callBackUrl = SUNO_CONFIG.DEFAULT_GENERATION_OPTIONS.callBackUrl,
      customMode = true,
      model = 'V3_5',
      vocalGender = 'f',
      styleWeight = 0.65,
      weirdnessConstraint = 0.65,
      audioWeight = 0.65
    } = params;

    const requestBody = {
      prompt,
      title,
      tags,
      style,
      duration,
      continue_at,
      mv,
      instrumental,
      callBackUrl,
      customMode,
      model,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight
    };

    console.log('Enviando requisição para a API Suno com os seguintes parâmetros:', {
      ...requestBody,
      prompt: prompt.substring(0, 50) + '...', // Log apenas o início do prompt
    });

    try {
      const data = await this.fetchWithRetry<{ taskId: string; status: string; }>('/api/v1/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      console.log('Resposta da API Suno:', data);
      return data;
    } catch (error) {
      console.error('Erro ao gerar música:', error);
      throw error;
    }
  }

  async getSongStatus(taskId: string) {
    if (!taskId) {
      throw new Error('ID da tarefa não fornecido');
    }

    try {
      const data = await this.fetchWithRetry<{
        status: string;
        audio_url?: string;
        error?: string;
        metadata?: Record<string, unknown>;
      }>(`/api/v1/status/${taskId}`, {
        method: 'GET'
      });

      return {
        taskId,
        status: data.status,
        audioUrl: data.audio_url,
        error: data.error,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Erro ao verificar status da música:', error);
      throw error;
    }
  }
}

// Função factory para criar instância do cliente
export function createSunoClient(options: SunoClientOptions): SunoClient {
  return new SunoClient(options);
}

// Função de compatibilidade para importações existentes
let _sunoClient: SunoClient | null = null;

export function getSunoClient(options: SunoClientOptions): SunoClient {
  if (!_sunoClient) {
    _sunoClient = createSunoClient(options);
  }
  return _sunoClient;
}
