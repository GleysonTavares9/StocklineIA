import { NextResponse } from 'next/server';
import { getSunoClient } from '@/lib/suno/client';
import { createClient } from '@/lib/supabase/server';

// Tipos para a requisição
type GenerateRequest = {
  prompt: string;
  duration?: number;
  tags?: string;
  title?: string;
  style?: string;
  userId: string;
};

type SongMetadata = {
  provider: string;
  duration: number;
  tags: string;
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
    const supabase = await createClient();
    
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

    const { prompt, duration = 60, tags, title, style } = body;
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
      baseUrl: process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org',
      timeout: 300000 // 5 minutos
    });

    // Preparar parâmetros
    const songTags = typeof tags === 'string' ? tags : (tags || []).join(', ');
    const songTitle = title || `Música Gerada - ${new Date().toLocaleString('pt-BR')}`;
    const songDuration = Math.min(Math.max(30, duration), 300); // 30s a 5min
    const callBackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/suno/callback`;

    console.log('Enviando requisição para a API Suno com os seguintes parâmetros:', {
      prompt: prompt?.substring(0, 50) + '...',
      title: songTitle,
      tags: songTags,
      duration: songDuration,
      style: style || 'chill',
      callBackUrl
    });

    // Gerar música
    const result = await suno.generateSong({
      prompt: prompt!,
      title: songTitle,
      tags: songTags,
      duration: songDuration,
      style: style || 'chill',
      instrumental: false,
      mv: 'chirp-v3-0',
      callBackUrl,
      customMode: true,
      model: 'V3_5',
      vocalGender: 'f',
      styleWeight: 0.65,
      weirdnessConstraint: 0.65,
      audioWeight: 0.65
    });

    console.log('Resposta da API Suno:', JSON.stringify(result, null, 2));

    if (!result || !result.data || !result.data.taskId) {
      throw new Error('Resposta inesperada da API Suno: taskId não encontrado');
    }

    const taskId = result.data.taskId;

    // Salvar a tarefa no banco de dados para acompanhamento
    const { error: taskError } = await supabase
      .from('suno_tasks')
      .insert({
        task_id: taskId,
        user_id: user.id,
        status: 'pending',
        metadata: {
          title: songTitle,
          prompt: prompt,
          style: style || 'chill',
          duration: songDuration,
          tags: songTags,
          callBackUrl
        },
        created_at: new Date().toISOString()
      });

    if (taskError) {
      console.error('Erro ao salvar tarefa:', taskError);
      // Não interrompemos o fluxo, apenas registramos o erro
    }

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

    // Registrar atividade
    const activity: UserActivity = {
      user_id: user.id,
      action: 'song_generated',
      metadata: {
        song_title: songTitle,
        duration: songDuration,
        credits_used: 1,
        remaining_credits: (profile.credits || 1) - 1
      }
    };

    const { error: activityError } = await supabase
      .from('user_activities')
      .insert(activity);

    if (activityError) {
      console.error('Erro ao registrar atividade:', activityError);
      // Não interrompemos o fluxo, apenas registramos o erro
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId: taskId,
        status: 'pending',
        message: 'Sua música está sendo gerada. Você receberá uma notificação quando estiver pronta.'
      }
    });

  } catch (error: any) {
    console.error('Erro ao gerar música:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Ocorreu um erro ao processar sua solicitação',
        code: 'GENERATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
