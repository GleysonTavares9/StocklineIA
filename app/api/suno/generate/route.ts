import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Função auxiliar para processar resposta de sucesso
async function handleSuccessResponse(
  result: any,
  userId: string,
  style: string,
  prompt: string,
  title: string | undefined,
  duration: number,
  supabase: any,
  currentCredits: number,
  provider: string = 'suno.ai'
) {
  // Atualizar créditos do usuário
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: Math.max(0, currentCredits - 1) })
    .eq('id', userId);

  if (updateError) {
    console.error('Erro ao atualizar créditos:', updateError);
  }

  // Salvar a música gerada no banco de dados
  const songData = {
    user_id: userId,
    title: title || `Música ${style} gerada`,
    style: style,
    status: 'completed',
    audio_url: result.audio_url || result.url,
    metadata: {
      provider: provider,
      duration: result.duration || duration,
      style: style,
      prompt: prompt,
      generated_at: new Date().toISOString()
    },
  };

  const { error: songError } = await supabase.from('songs').insert(songData);

  if (songError) {
    console.error('Erro ao salvar música:', songError);
  }

  return NextResponse.json({
    success: true,
    audio_url: songData.audio_url,
    credits_remaining: Math.max(0, currentCredits - 1),
    provider: provider
  });
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('Iniciando processamento da requisição de geração de música');
    const body = await request.json();
    const { prompt, duration = 30, style = 'electronic', title, make_instrumental = false } = body;

    console.log('Dados recebidos:', { 
      prompt: prompt?.substring(0, 100) + (prompt?.length > 100 ? '...' : ''), 
      duration, 
      style,
      title,
      make_instrumental
    });

    const cookieStore = cookies();
    const supabase = createClient();

    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não autenticado',
          message: 'Por favor, faça login para continuar.'
        },
        { status: 401 }
      );
    }

    console.log(`Usuário autenticado: ${user.email} (${user.id})`);

    // Verificar créditos do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, display_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil:', profileError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao buscar perfil do usuário',
          message: 'Não foi possível carregar suas informações. Tente novamente.'
        },
        { status: 500 }
      );
    }

    const currentCredits = profile.credits || 0;
    console.log(`Créditos disponíveis: ${currentCredits}`);

    if (currentCredits < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Créditos insuficientes',
          message: 'Você não tem créditos suficientes para gerar mais músicas.'
        },
        { status: 402 }
      );
    }

    // Configuração da chamada para a API da Suno
    const sunoApiUrl = `${process.env.SUNO_BASE_URL_V1 || 'https://api.suno.ai'}/api/generate`;
    const apiKey = process.env.SUNO_API_KEY;
    
    console.log('Configuração da API:', {
      sunoApiUrl,
      hasApiKey: !!apiKey,
      environment: process.env.NODE_ENV
    });
    
    console.log('Variáveis de ambiente carregadas:', {
      SUNO_BASE_URL_V1: process.env.SUNO_BASE_URL_V1,
      hasApiKey: !!apiKey
    });
    
    // Configuração alternativa para Riffusion API
    const riffusionApiUrl = 'https://api.riffusion.com/api/v1/generate';
    
    // URL do áudio de fallback local
    const fallbackAudioUrl = '/audio/fallback/placeholder.mp3';
    
    console.log('Configuração da Suno API:', { sunoApiUrl, hasKey: !!apiKey });

    if (!apiKey) {
      console.warn('Suno API key não configurada, usando Riffusion como fallback');
      // Não retornamos erro, apenas continuamos com o fallback
    }

    // Formatar os dados para a API da Suno
    console.log('Dados da requisição recebidos:', { prompt, style, duration });
    
    const sunoRequestData = {
      prompt: `${style} music, ${prompt}`.trim(),
      make_instrumental: false,
      wait_audio: true
    };
    
    // Adicionar cabeçalhos de autenticação se a chave estiver disponível
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Formatar dados para a API do Riffusion (fallback)
    const riffusionRequestData = {
      prompt: `${style} music, ${prompt}`.trim(),
      seed: Math.floor(Math.random() * 1000000), // seed aleatória
      num_inference_steps: 50,
      guidance_scale: 7.5,
      negative_prompt: 'low quality, distorted, noisy',
      width: 512,
      height: 512
    } as const;

    try {
      // Primeiro tentamos a Suno API
      if (!apiKey) {
        throw new Error('Chave da API não configurada');
      }

      console.log('Enviando requisição para a API da Suno:', {
        url: sunoApiUrl,
        headers: { ...headers, Authorization: 'Bearer ***' },
        body: sunoRequestData
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 segundos de timeout

      const response = await fetch(sunoApiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(sunoRequestData),
        signal: controller.signal
      });

      clearTimeout(timeout);

      // Processar a resposta
      const responseText = await response.text();
      
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Erro ao fazer parse da resposta:', e);
        throw new Error(`Resposta inválida da API: ${responseText.substring(0, 200)}`);
      }

      console.log('Resposta da API recebida:', {
        status: response.status,
        statusText: response.statusText,
        data: result
      });

      if (!response.ok) {
        throw new Error(result.error || result.message || response.statusText);
      }

      // Verificar se a resposta contém dados válidos
      if (!result || (Array.isArray(result) && result.length === 0)) {
        throw new Error('Resposta da API inválida ou vazia');
      }

      // Processar a resposta (assumindo que a API retorna um array de músicas)
      const musicData = Array.isArray(result) ? result[0] : result;
      
      if (!musicData.audio_url && !musicData.url) {
        console.error('URL de áudio não encontrada na resposta:', musicData);
        throw new Error('Não foi possível gerar o áudio. Tente novamente com um prompt diferente.');
      }

      // Retornar a resposta de sucesso
      const responseData = await handleSuccessResponse(
        musicData,
        user.id,
        style,
        prompt,
        title,
        duration,
        supabase,
        profile.credits || 0
      );

      console.log('Música gerada com sucesso:', {
        audio_url: musicData.audio_url || musicData.url,
        duration: musicData.duration || duration,
        credits_remaining: profile.credits ? profile.credits - 1 : 0
      });

      return responseData;
    } catch (error) {
      console.error('Erro ao processar a requisição:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = errorMessage.includes('não autenticado') ? 401 : 
                       errorMessage.includes('créditos') ? 402 : 500;
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao gerar música',
          message: errorMessage,
          code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 
                statusCode === 401 ? 'UNAUTHORIZED' :
                statusCode === 402 ? 'INSUFFICIENT_CREDITS' : 'UNKNOWN_ERROR'
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
