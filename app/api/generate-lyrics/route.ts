import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Configurar o cliente do Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Gerar a letra usando a API do Gemini
    const prompt = `Escreva uma letra de música ${style ? `no estilo ${style}` : ''} sobre ${theme}.
    A letra deve ter entre 2 e 4 versos e um refrão cativante.`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Você é um compositor talentoso que escreve letras de música cativantes e originais. ${prompt}`
            }
          ]
        }
      ]
    });

    const response = await result.response;
    const lyrics = response.text() || 'Não foi possível gerar a letra no momento.';

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
            model: 'gemini-pro'
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
