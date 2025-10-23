"use client"

import { Play, Pause, Loader2, Trash2, Music, Home, Mic, ImageIcon, Search, Filter, Download, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { ptBR } from "@/lib/translations"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Song as DBSong } from '@/types/database.types';

interface Song extends Omit<DBSong, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
}

interface LibraryClientProps {
  user: User;
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    credits: number;
    credits_balance: number;
    plan_id: string;
  } | null;
  unreadNotifications: number;
  userSongs: Song[];
}

// Função para formatar a data
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função para formatar a duração em segundos para MM:SS
const formatDuration = (seconds?: number) => {
  if (!seconds) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function LibraryClient({ user, profile, unreadNotifications, userSongs }: LibraryClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = ptBR.library;

  // Filtrar músicas com base na busca e filtros
  const filteredSongs = userSongs.filter(song => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (song.title?.toLowerCase().includes(searchLower) || false) ||
      (song.style?.toLowerCase().includes(searchLower) || false) ||
      (song.lyrics?.toLowerCase().includes(searchLower) || false);
    const matchesStatus = statusFilter === 'all' || song.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Limpar o áudio quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = (songId: string, audioUrl: string | null) => {
    if (!audioUrl) {
      toast({
        title: "Áudio não disponível",
        description: "O áudio desta música ainda não está disponível.",
        variant: "destructive"
      });
      return;
    }

    if (playingSongId === songId) {
      audioRef.current?.pause();
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play()
        .then(() => {
          setPlayingSongId(songId);
        })
        .catch(error => {
          console.error("Erro ao reproduzir áudio:", error);
          toast({
            title: "Erro ao reproduzir",
            description: "Não foi possível reproduzir o áudio. Tente novamente mais tarde.",
            variant: "destructive"
          });
        });
      
      audioRef.current.onended = () => setPlayingSongId(null);
    }
  }

  const handleDelete = async (songId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta música? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingSongId(songId);
    
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir a música');
      }

      // Atualizar a lista de músicas
      router.refresh();
      
      toast({
        title: "Música excluída",
        description: "A música foi removida da sua biblioteca.",
      });
    } catch (error) {
      console.error('Erro ao excluir música:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a música. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setDeletingSongId(null);
    }
  };

  const handleDownload = async (songId: string, fileName: string) => {
    try {
      const song = userSongs.find(s => s.id === songId);
      if (!song?.audio_url) {
        throw new Error('URL do áudio não disponível');
      }

      const response = await fetch(song.audio_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'musica'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast({
        title: "Download iniciado",
        description: "O download da música foi iniciado.",
      });
    } catch (error) {
      console.error('Erro ao baixar música:', error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar a música. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      completed: { text: 'Concluído', className: 'bg-green-100 text-green-800' },
      processing: { text: 'Processando', className: 'bg-blue-100 text-blue-800' },
      pending: { text: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      failed: { text: 'Falha', className: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  // Se não houver músicas, mostrar mensagem
  if (userSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Music className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhuma música encontrada</h3>
        <p className="text-sm text-gray-500 mt-1">Crie sua primeira música para começar</p>
        <Button className="mt-4" onClick={() => router.push('/')}>
          Criar Música
        </Button>
      </div>
    );
  }


  // Função para obter o texto do status
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: 'Concluído',
      processing: 'Processando',
      pending: 'Pendente',
      failed: 'Falha',
      // Adicionar outros status que possam existir no banco
      generated: 'Gerado',
      error: 'Erro',
      queued: 'Na fila'
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Minha Biblioteca</h2>
            <Button onClick={() => router.push('/')}>
              Nova Música
            </Button>
          </div>
          
          {/* Barra de pesquisa e filtros */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar músicas..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 whitespace-nowrap">Filtrar por:</span>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="completed">Concluído</option>
                <option value="processing">Processando</option>
                <option value="pending">Pendente</option>
                <option value="failed">Falha</option>
              </select>
            </div>
          </div>

          {userSongs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <Music className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.emptyState.title}</h3>
              <p className="text-gray-500 mb-6">{t.emptyState.description}</p>
              <Button 
                onClick={() => router.push('/')}
                className="bg-[#338d97] hover:bg-[#2a7a83] text-white"
              >
                {t.emptyState.createButton}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userSongs.map((song) => (
                <div key={song.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-[#338d97] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{song.title || 'Sem título'}</h3>
                      {song.style && <p className="text-sm text-gray-500 mt-1">{song.style}</p>}
                      {song.is_cover && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mt-1">
                          Versão Cover
                        </span>
                      )}
                      {song.is_instrumental && (
                        <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full ml-1">
                          Instrumental
                        </span>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        {getStatusBadge(song.status)}
                        <span className="text-xs text-gray-400">
                          {new Date(song.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {song.audio_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayPause(song.id, song.audio_url!)}
                          className="text-gray-500 hover:text-[#338d97]"
                          aria-label={playingSongId === song.id ? t.table.pause : t.table.play}
                        >
                          {playingSongId === song.id ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(song.id)}
                        className="text-gray-500 hover:text-red-500"
                        disabled={deletingSongId === song.id}
                        aria-label={t.table.delete}
                      >
                        {deletingSongId === song.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
