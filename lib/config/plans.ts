// Preços em reais (BRL)
export const PLANS = [
  {
    id: '1',
    name: 'Básico',
    description: 'Ideal para quem está começando',
    price: 29.90,
    credits: 100,
    valid_days: 30,
    is_credit_pack: false,
    is_popular: false,
    features: [
      '100 créditos por mês',
      'Suporte por email',
      'Acesso básico',
      'Até 10 gerações por dia'
    ],
    price_id: 'price_1SFr8GEaMssn2zemQADq2BjG'
  },
  {
    id: '2',
    name: 'Intermediário',
    description: 'Para quem já está evoluindo',
    price: 49.90,
    credits: 200,
    valid_days: 30,
    is_credit_pack: false,
    is_popular: true,
    features: [
      '200 créditos por mês',
      'Suporte prioritário',
      'Acesso a recursos intermediários',
      'Até 20 gerações por dia',
      'Exportação em resolução HD'
    ],
    price_id: 'price_1SFr8mEaMssn2zemIlFlxF7z'
  },
  {
    id: '3',
    name: 'Avançado',
    description: 'Para uso profissional',
    price: 99.90,
    credits: 500,
    valid_days: 30,
    is_credit_pack: false,
    is_popular: false,
    features: [
      '500 créditos por mês',
      'Suporte prioritário',
      'Acesso a todos os recursos',
      'Exportação em Full HD',
      'Até 50 gerações por dia',
      'Armazenamento de 30 dias'
    ],
    price_id: 'price_1SFr8VEaMssn2zemOfkVwP5W'
  },
  {
    id: '4',
    name: 'Premium',
    description: 'Para negócios em crescimento',
    price: 199.90,
    credits: 1200,
    valid_days: 30,
    is_credit_pack: false,
    is_popular: false,
    features: [
      '1200 créditos por mês',
      'Suporte 24/7',
      'Acesso a todos os recursos',
      'Exportação em 4K',
      'Até 120 gerações por dia',
      'Armazenamento de 60 dias',
      'Acesso à API básico'
    ],
    price_id: 'price_1SLB0TEaMssn2zem6SYUuG0v'
  },
  {
    id: '5',
    name: 'Empresarial',
    description: 'Solução corporativa',
    price: 449.90,
    credits: 3000,
    valid_days: 30,
    is_credit_pack: false,
    is_popular: false,
    features: [
      '3000 créditos por mês',
      'Suporte dedicado',
      'Todos os recursos premium',
      'Exportação em 8K',
      'Gerações ilimitadas',
      'Armazenamento de 90 dias',
      'API ilimitada',
      'Conta de gerente dedicada',
      'Relatórios personalizados',
      'Treinamento da equipe'
    ],
    price_id: 'price_1SLB0qEaMssn2zemmnjCeIyD'
  }
] as const

// Preços avulsos (pay-as-you-go)
export const PAY_AS_YOU_GO = {
  music_generation: 0.75, // R$ por música
  vocal_separation: 2.50, // R$ por separação
  hq_audio: 0.50, // R$ por upgrade
  custom_style: 1.00, // R$ por estilo personalizado
  cover_art: 1.50 // R$ por capa
}

// Créditos necessários por ação
export const CREDITS_PER_ACTION = {
  // Geração de músicas
  generate_music: 20, // Geração de música padrão
  generate_music_hd: 30, // Geração em qualidade HD
  generate_music_4k: 50, // Geração em qualidade 4K
  
  // Recursos avançados
  vocal_separation: 50, // Separação de vocais
  audio_enhancement: 20, // Melhoria de áudio
  custom_instrumental: 30, // Geração de instrumental personalizado
  
  // Edição
  extend_duration: 10, // Por minuto adicional
  change_style: 15, // Mudança de estilo musical
  
  // Outros
  generate_lyrics: 2, // Geração de letras
  generate_cover: 5, // Geração de capa
  download_wav: 3, // Download em formato WAV
  download_mp3: 1, // Download em formato MP3
  
  // Pacotes de créditos
  free_trial: 20, // Créditos iniciais para novos usuários
  referral_bonus: 40 // Bônus por indicação
}

// Configuração de créditos iniciais
export const CREDIT_CONFIG = {
  // Créditos iniciais para novos usuários
  freeTrial: {
    amount: 20, // 1 música grátis
    expiresInDays: 30, // Válido por 30 dias
    description: 'Créditos iniciais para teste',
    type: 'signup_bonus'
  },
  
  // Bônus por indicação
  referral: {
    referrer: 40, // Quem indica ganha 40 créditos (2 músicas)
    referred: 20,  // Quem é indicado ganha 20 créditos (1 música)
    expiresInDays: 90,
    description: 'Bônus por indicação',
    type: 'referral_bonus'
  },
  
  // Expiração de créditos
  expiry: {
    default: 90, // 90 dias para pacotes de crédito
    subscription: 30, // 30 dias para assinaturas
    freeTrial: 30, // 30 dias para créditos de teste
    referral: 90 // 90 dias para bônus de indicação
  },
  
  // Limites
  limits: {
    maxCredits: 10000, // Limite máximo de créditos por usuário
    dailyGenerationLimit: 50, // Limite diário de gerações
    monthlyGenerationLimit: 1000 // Limite mensal de gerações
  }
} as const
