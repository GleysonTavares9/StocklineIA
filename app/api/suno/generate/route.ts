import { NextResponse } from 'next/server';
import { getSunoClient } from '@/lib/suno/client';
import { createClient } from '@/lib/supabase/server';

// Tipos para a requisição
type GenerateRequest = {
  prompt: string;
  duration?: number;
  tags?: string[];
  title?: string;
  style?: string;
  userId: string;
};

type SongMetadata = {
  provider: string;
  duration: number;
  tags: string[];
  style?: string;
  generated_at: string;
  [key: string]: unknown;
};

type SongData = {
  user_id: string;
  title: string;
  status: string;
  audio_url: string;
  duration: number;
  metadata: SongMetadata;
};

type UserActivity = {
  user_id: string;
  action: string;
  metadata: {
    song_title: string;
    duration: number;
    credits_used: number;
    remaining_credits: number;
    [key: string]: unknown;
  };
};

export async function POST(request: Request) {
  try {
    // Inicializar o cliente Supabase com cookies assíncronos
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
    const body = await request.json() as Partial<GenerateRequest>;
    
    if (!body.prompt || body.prompt.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'O prompt é obrigatório e deve ter pelo menos 10 caracteres',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }

    const { prompt, duration = 60, tags = [], title, style } = body;
    const userId = user.id;

    // Verificar se o ID do usuário está presente
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do usuário não encontrado',
          code: 'USER_ID_NOT_FOUND'
        },
        { status: 400 }
      );
    }

    // Verificar créditos
    const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', user.id)
  .single();
  
// Handle profile not found error
if (profileError || !profile) {
  console.error('Error loading profile:', profileError);
  return NextResponse.json(
    {
      success: false,
      error: 'Error loading user profile',
      code: 'PROFILE_ERROR'
    },
    { status: 400 }
  );
}

// Check if user has enough credits
if (!profile.credits || profile.credits <= 0) {
  return NextResponse.json(
    { 
      success: false,
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS'
    }, 
    { status: 400 }
  );
}

    if ((profile.credits || 0) < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Créditos insuficientes. Por favor, adquira mais créditos para continuar.',
          code: 'INSUFFICIENT_CREDITS',
          redirectUrl: '/plans'
        }, 
        { status: 402 }
      );
    }

    // Configuração do Suno AI
    const sunoApiKey = process.env.SUNO_API_KEY;
    if (!sunoApiKey) {
      console.error('Erro: SUNO_API_KEY não configurada');
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro de configuração do servidor',
          code: 'SERVER_ERROR'
        },
        { status: 500 }
      );
    }

    const suno = getSunoClient({
      apiKey: sunoApiKey,
      baseUrl: process.env.SUNO_API_BASE_URL || 'https://api.suno.ai/v1',
      timeout: 60000 // 60 segundos
    });

    // Preparar tags
    const songTags = [...(tags || [])];
    if (style) songTags.push(style);

    // Gerar música
    const result = await suno.generateSong({
      prompt,
      duration: Math.min(Math.max(30, duration), 300), // 30s a 5min
      tags: songTags,
      title: title || `Música Gerada - ${new Date().toLocaleString('pt-BR')}`,
    });

    // Atualizar créditos
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: (profile.credits || 1) - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar créditos:', updateError);
      // Não interrompemos o fluxo, apenas registramos o erro
    }

    // Salvar metadados da música
    const songData = {
      user_id: user.id,
      title: title || 'Música Gerada',
      status: 'completed',
      audio_url: result.audio_url,
      duration: result.duration || duration,
      metadata: {
        provider: 'suno-ai',
        duration: result.duration || duration,
        tags: songTags,
        style,
        generated_at: new Date().toISOString()
      },
    };

    const { error: songError } = await supabase
      .from('songs')
      .insert(songData);

    if (songError) {
      console.error('Erro ao salvar música:', songError);
      // Não interrompemos o fluxo, apenas registramos o erro
    }

    // Registrar atividade
    await supabase.from('user_activities').insert({
      user_id: user.id,
      action: 'generate_song',
      metadata: {
        song_title: songData.title,
        duration: songData.duration,
        credits_used: 1,
        remaining_credits: (profile.credits || 1) - 1
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        credits_remaining: (profile.credits || 1) - 1
      }
    });

  } catch (error) {
    console.error('Erro ao gerar música:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
