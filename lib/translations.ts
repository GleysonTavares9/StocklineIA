export const ptBR = {
  musicGenerator: {
    title: 'Criar Nova Música',
    style: {
      title: 'Estilo Musical',
      placeholder: 'Ex: Pop anos 80 com influência de rock',
      customStyle: 'Estilo personalizado (opcional)',
      showMore: 'Mostrar mais gêneros',
      showLess: 'Mostrar menos',
    },
    lyrics: {
      title: 'Letra da Música',
      placeholder: 'Digite a letra da música aqui...',
      instrumental: 'Instrumental',
      withLyrics: 'Com Letra',
      generateWithAI: 'Gerar Letra com IA',
      describeFirst: 'Descreva a música primeiro',
      aiGenerating: 'Gerando letra com IA...',
      noLyricsNeeded: 'Música instrumental selecionada. Nenhuma letra necessária.'
    },
    description: {
      title: 'Descrição da Música (Opcional)',
      placeholder: 'Descreva o estilo, tema ou inspiração da sua música...',
      helpText: 'Quanto mais detalhes você fornecer, melhor será o resultado!',
      charLimit: (current: number, max: number) => `${current}/${max} caracteres`
    },
    createButton: {
      createWithLyrics: 'Criar Música com Letra',
      createInstrumental: 'Criar Música Instrumental',
      creating: 'Criando Música...',
      terms: 'Ao criar, você concorda com nossos',
      termsLink: 'Termos de Uso',
      privacyLink: 'Política de Privacidade',
      and: 'e'
    },
    errors: {
      noLyrics: 'Por favor, adicione uma letra ou marque como instrumental.',
      generationFailed: 'Falha ao gerar música',
      tryAgain: 'Tente novamente mais tarde.'
    },
    success: {
      title: 'Música em produção!',
      message: 'Sua música está sendo gerada e estará disponível em breve na sua biblioteca.'
    }
  },
  bottomNav: {
    featured: 'Início',
    music: 'Músicas',
    covers: 'Covers',
    library: 'Biblioteca'
  },
  header: {
    appName: 'StocklineIA',
    userMenu: {
      profile: 'Meu Perfil',
      settings: 'Configurações',
      billing: 'Assinatura e Pagamentos',
      signOut: 'Sair',
      userMenu: 'Menu do usuário',
      notifications: 'Notificações'
    }
  },
  library: {
    title: 'Minha Biblioteca',
    emptyState: {
      title: 'Nenhuma música encontrada',
      description: 'Crie sua primeira música para vê-la aqui!',
      createButton: 'Criar Música'
    },
    table: {
      title: 'Título',
      style: 'Estilo',
      status: 'Status',
      createdAt: 'Criado em',
      actions: 'Ações',
      play: 'Tocar',
      pause: 'Pausar',
      delete: 'Excluir',
      confirmDelete: 'Tem certeza que deseja excluir esta música?',
      deleteSuccess: 'Música excluída com sucesso!',
      deleteError: 'Erro ao excluir a música.',
      statuses: {
        completed: 'Concluído',
        processing: 'Processando',
        failed: 'Falhou'
      }
    }
  }
}
