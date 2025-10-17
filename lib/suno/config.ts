// Configurações padrão para a API Suno
export const SUNO_CONFIG = {
  // URL base da API Suno (pode ser sobrescrita por variáveis de ambiente)
  BASE_URL: process.env.NEXT_PUBLIC_SUNO_API_BASE_URL || 'https://api.sunoapi.org',
  
  // Configurações de timeout
  TIMEOUT: 300000, // 5 minutos em milissegundos
  
  // Número de tentativas de requisição
  RETRY_ATTEMPTS: 3,
  
  // Configurações padrão para geração de música
  DEFAULT_GENERATION_OPTIONS: {
    style: 'chill',
    duration: 60, // segundos
    mv: 'chirp-v3-0',
    instrumental: false,
    callBackUrl: process.env.NEXT_PUBLIC_APP_URL ? 
      `${process.env.NEXT_PUBLIC_APP_URL}/api/suno/callback` : 
      'http://localhost:3000/api/suno/callback',
    customMode: true,
    model: 'V3_5',
    vocalGender: 'f',
    styleWeight: 0.65,
    weirdnessConstraint: 0.65,
    audioWeight: 0.65
  },
  
  // Cabeçalhos HTTP padrão
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
} as const;
