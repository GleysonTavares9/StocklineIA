import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type CallbackData = {
  taskId: string;
  status: 'completed' | 'failed' | 'processing';
  audio_url?: string;
  error?: string;
  metadata?: {
    title?: string;
    duration?: number;
    tags?: string;
    style?: string;
  };
};

export async function POST(request: Request) {
  try {
    const data: CallbackData = await request.json();
    
    console.log('Recebido callback da API Suno:', JSON.stringify(data, null, 2));
    
    if (!data.taskId) {
      console.error('ID da tarefa não fornecido no callback');
      return NextResponse.json(
        { success: false, error: 'ID da tarefa não fornecido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Atualizar o status da tarefa no banco de dados
    const { data: task, error: taskError } = await supabase
      .from('suno_tasks')
      .update({
        status: data.status,
        audio_url: data.audio_url || null,
        error: data.error || null,
        updated_at: new Date().toISOString(),
        completed_at: data.status === 'completed' ? new Date().toISOString() : null,
        metadata: {
          ...data.metadata,
          status: data.status,
          updated_at: new Date().toISOString()
        }
      })
      .eq('task_id', data.taskId)
      .select('user_id, metadata')
      .single();

    if (taskError) {
      console.error('Erro ao atualizar tarefa:', taskError);
      return NextResponse.json(
        { success: false, error: 'Erro ao processar o callback' },
        { status: 500 }
      );
    }

    // Se a tarefa foi concluída com sucesso, podemos notificar o usuário
    if (data.status === 'completed' && task.user_id) {
      // Aqui você pode adicionar lógica para notificar o usuário, por exemplo:
      // - Enviar um email
      // - Enviar uma notificação push
      // - Atualizar o estado da aplicação via WebSocket
      
      console.log(`Música gerada com sucesso para o usuário ${task.user_id}`);
    }

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Erro no callback da API Suno:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao processar o callback',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
