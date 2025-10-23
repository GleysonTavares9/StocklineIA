import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createClient();

  // Dados dos planos atualizados
  const plans = [
    {
      id: '1',
      name: 'Básico',
      description: 'Ideal para quem está começando',
      price: 29.90,
      credits: 100,
      price_id: 'price_1SFr8GEaMssn2zemQADq2BjG',
      features: [
        '100 créditos por mês',
        'Suporte por email',
        'Acesso básico',
        'Até 10 gerações por dia'
      ],
      recommended: false
    },
    {
      id: '2',
      name: 'Intermediário',
      description: 'Para quem já está evoluindo',
      price: 49.90,
      credits: 200,
      price_id: 'price_1SFr8mEaMssn2zemIlFlxF7z',
      features: [
        '200 créditos por mês',
        'Suporte prioritário',
        'Acesso a recursos intermediários',
        'Até 20 gerações por dia',
        'Exportação em resolução HD'
      ],
      recommended: true
    },
    {
      id: '3',
      name: 'Avançado',
      description: 'Para uso profissional',
      price: 99.90,
      credits: 500,
      price_id: 'price_1SFr8VEaMssn2zemOfkVwP5W',
      features: [
        '500 créditos por mês',
        'Suporte prioritário',
        'Acesso a todos os recursos',
        'Exportação em Full HD',
        'Até 50 gerações por dia',
        'Armazenamento de 30 dias'
      ],
      recommended: false
    },
    {
      id: '4',
      name: 'Premium',
      description: 'Para negócios em crescimento',
      price: 199.90,
      credits: 1200,
      price_id: 'price_1SLB0TEaMssn2zem6SYUuG0v',
      features: [
        '1200 créditos por mês',
        'Suporte 24/7',
        'Acesso a todos os recursos',
        'Exportação em 4K',
        'Até 120 gerações por dia',
        'Armazenamento de 60 dias',
        'Acesso à API básico'
      ],
      recommended: false
    },
    {
      id: '5',
      name: 'Empresarial',
      description: 'Solução corporativa',
      price: 449.90,
      credits: 3000,
      price_id: 'price_1SLB0qEaMssn2zemmnjCeIyD',
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
      recommended: false
    }
  ];

  try {
    // Primeiro, limpar a tabela de planos existente
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .not('id', 'is', null);

    if (deleteError) {
      console.error('Erro ao limpar planos existentes:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao limpar planos existentes', details: deleteError },
        { status: 500 }
      );
    }

    // Inserir os novos planos
    const { error: insertError } = await supabase
      .from('plans')
      .insert(plans);

    if (insertError) {
      console.error('Erro ao inserir planos:', insertError);
      return NextResponse.json(
        { error: 'Erro ao inserir planos', details: insertError },
        { status: 500 }
      );
    }

    console.log('Planos atualizados com sucesso!', plans);
    return NextResponse.json({
      success: true,
      message: 'Planos atualizados com sucesso!',
      plans
    });

  } catch (error) {
    console.error('Erro ao atualizar planos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
}
