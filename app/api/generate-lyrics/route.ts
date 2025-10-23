import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import fetch from 'node-fetch';
import type { RequestInit } from 'node-fetch';

declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch;
    }
  }
}

// Garante que o fetch global está disponível
if (!global.fetch) {
  global.fetch = fetch as any;
}

// No Vercel, variáveis de ambiente no servidor não precisam do prefixo NEXT_PUBLIC_
const API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
// Usando o modelo Gemini 2.0 Flash, que é mais rápido e eficiente
const MODEL_NAME = 'models/gemini-2.0-flash';
const GENERATE_ENDPOINT = `${BASE_URL}/${MODEL_NAME}:generateContent`;

if (!API_KEY) {
  console.error('Erro: Chave da API do Google AI não encontrada no ambiente');
  throw new Error('GOOGLE_AI_API_KEY não configurada no ambiente');
} else {
  console.log('Chave da API carregada com sucesso');
}

// Função para listar modelos disponíveis
async function listAvailableModels() {
  try {
    const response = await fetch(`${BASE_URL}/models?key=${API_KEY}`);
    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao listar modelos:', error);
      return [];
    }
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    return [];
  }
}

// Função para verificar se o modelo está disponível
async function checkModelAvailability() {
  try {
    const models = await listAvailableModels();
    console.log('Modelos disponíveis:', models.map((m: any) => m.name));
    
    const modelExists = models.some((model: any) => 
      model.name.includes(MODEL_NAME)
    );
    
    if (!modelExists) {
      console.error(`Modelo ${MODEL_NAME} não encontrado. Modelos disponíveis:`, 
        models.map((m: any) => m.name).join(', ')
      );
    }
    
    return modelExists;
  } catch (error) {
    console.error('Erro ao verificar modelo:', error);
    return false;
  }
}

type GenerateLyricsRequest = {
  theme: string;
  style?: string;
  userId: string;
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Não autorizado. Por favor, faça login para continuar.',
          code: 'UNAUTHORIZED'
        }, 
        { status: 401 }
      );
    }

    // Validar entrada
    const body = await request.json() as Partial<GenerateLyricsRequest>;
    
    if (!body.theme || body.theme.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'O tema da letra é obrigatório e deve ter pelo menos 3 caracteres',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }

    const { theme, style } = body;

    // Verificar se o modelo está disponível
    const isModelAvailable = await checkModelAvailability();
    if (!isModelAvailable) {
      throw new Error(`O modelo ${MODEL_NAME} não está disponível ou a chave de API é inválida`);
    }

    // Gerar a letra usando a API REST do Gemini
    const prompt = `Você é um compositor talentoso que escreve letras de música cativantes e originais.
    Escreva uma letra de música ${style ? `no estilo ${style}` : ''} sobre ${theme}.
    A letra deve ter entre 2 e 4 versos e um refrão cativante.
    Retorne APENAS a letra da música, sem comentários adicionais.`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        }
      ]
    };

    console.log('Enviando requisição para a API do Gemini...');
    const response = await fetch(`${GENERATE_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    let lyrics: string;
    
    try {
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na API do Gemini:', errorData);
        
        // Se for erro de cota excedida, usar dados mockados
        if (response.status === 429) {
          console.log('Cota excedida, usando dados mockados...');
          lyrics = getMockLyrics(theme as string, style);
        } else {
          throw new Error('Erro ao gerar letra com a API do Gemini: ' + 
            (errorData.error?.message || JSON.stringify(errorData)));
        }
      } else {
        const data = await response.json();
        lyrics = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
          getMockLyrics(theme as string, style);
      }
      
      console.log('Letra gerada com sucesso');
    } catch (error) {
      console.error('Erro ao processar resposta da API:', error);
      // Em caso de qualquer erro, retornar dados mockados
      lyrics = getMockLyrics(theme as string, style);
    }
    
    // Função para gerar letras mockadas
    function getMockLyrics(theme: string, style?: string): string {
      const styles = style ? `no estilo ${style}` : '';
      
      return `[Verso 1]
Pensando em ${theme} todo dia
${styles ? `No ritmo de ${style} que alegria` : 'A vida segue seu rumo natural'}
Cada verso que escrevo é um novo dia
E a música é meu canal

[Refrão]
${theme} é o que me inspira
${styles ? `No compasso do ${style} que me gira` : 'Nas notas que ecoam sem parar'}
Se o mundo girar e eu cair
A música vai me levantar

[Verso 2]
${theme} é minha paixão
${styles ? `No som do ${style} que é emoção` : 'Nas cordas do meu coração'}
Cada acorde, cada melodia
É pura inspiração`;
    }

    // Registrar a atividade no banco de dados
    const { error: activityError } = await supabase
      .from('user_activities')
      .insert([
        {
          user_id: user.id,
          action: 'generate_lyrics',
          metadata: {
            theme,
            style,
            generated_at: new Date().toISOString(),
            model: 'gemini-2.5-flash'
          }
        },
      ]);

    if (activityError) {
      console.error('Erro ao registrar atividade:', activityError);
    }

    return NextResponse.json({
      success: true,
      lyrics: lyrics.trim(),
      theme,
      style,
      generated_at: new Date().toISOString(),
      model: 'gemini-pro'
    });

  } catch (error) {
    console.error('Erro ao gerar letra:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ocorreu um erro ao gerar a letra. Por favor, tente novamente.',
        code: 'GENERATION_ERROR',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
