import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressTracking } from "@/hooks/useProgressTracking";

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function getGoogleDriveId(url: string) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function getWistiaMediaId(value: string) {
  // Remove espaços em branco extras
  const cleanValue = value.trim();
  
  // Tenta extrair media-id da tag wistia-player (mais confiável)
  const mediaIdMatch = cleanValue.match(/media-id=["']([a-zA-Z0-9_-]+)["']/i);
  if (mediaIdMatch) return mediaIdMatch[1];

  // Tenta extrair da URL de embed JavaScript
  const embedJsMatch = cleanValue.match(/embed\/([a-zA-Z0-9_-]+)\.js/i);
  if (embedJsMatch) return embedJsMatch[1];

  // Tenta extrair da URL de iframe
  const iframeMatch = cleanValue.match(/wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9_-]+)/i);
  if (iframeMatch) return iframeMatch[1];

  // Tenta extrair se for apenas o ID (direto ou com hyphens)
  const directIdMatch = cleanValue.match(/^([a-zA-Z0-9_-]{11})$/);
  if (directIdMatch) return directIdMatch[1];

  // Trata como ID se tiver apenas letras/números/símbolos válidos Wistia
  if (/^[a-zA-Z0-9_-]+$/.test(cleanValue) && cleanValue.length >= 8) {
    return cleanValue;
  }

  return null;
}

export default function ContentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateProgress, markAsCompleted } = useProgressTracking();
  const videoRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const { data: content, isLoading } = useQuery({
    queryKey: ["content", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const ytId = content?.url ? getYouTubeId(content.url) : null;
  const driveId = content?.url ? getGoogleDriveId(content.url) : null;
  const wistiaId = content?.url ? getWistiaMediaId(content.url) : null;

  // Carrega os scripts necessários
  useEffect(() => {
    // Carrega script principal do Wistia
    if (!document.querySelector('script[src="https://fast.wistia.com/player.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://fast.wistia.com/player.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Carrega script específico do vídeo Wistia
    if (wistiaId && !document.querySelector(`script[src*="embed/${wistiaId}.js"]`)) {
      const videoScript = document.createElement('script');
      videoScript.src = `https://fast.wistia.com/embed/${wistiaId}.js`;
      videoScript.async = true;
      videoScript.type = 'module';
      document.head.appendChild(videoScript);
    }
  }, [wistiaId]);

  // Tracking de progresso básico (simula progresso baseado no tempo)
  useEffect(() => {
    if (content?.type === "video" && content.id) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000; // segundos
        // Simula progresso baseado no tempo (pode ser melhorado com APIs reais de vídeo)
        const simulatedProgress = Math.min(95, (elapsed / 300) * 100); // 5 minutos = 100%

        if (simulatedProgress > 0) {
          updateProgress.mutate({
            contentId: content.id,
            progressPercentage: simulatedProgress,
          });
        }
      }, 10000); // Atualiza a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [content, updateProgress]);

  // Marca como completo quando o usuário sai da página
  useEffect(() => {
    return () => {
      if (content?.id) {
        // Simula conclusão se assistiu por tempo suficiente
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed > 240) { // 4 minutos
          markAsCompleted.mutate(content.id);
        }
      }
    };
  }, [content?.id, markAsCompleted]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : content ? (
          <>
            {/* Player */}
            {content.type === "video" && (
              <div className="rounded-xl overflow-hidden mb-6 glass">
                {ytId ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : wistiaId ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://fast.wistia.net/embed/iframe/${wistiaId}`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture; microphone"
                      allowFullScreen
                      title={content.title}
                      style={{ border: 'none' }}
                    />
                  </div>
                ) : driveId ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://drive.google.com/file/d/${driveId}/preview`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full flex items-center justify-center">
                    <Button onClick={() => window.open(content.url, "_blank")} className="gradient-primary text-primary-foreground">
                      <Play className="h-5 w-5 mr-2" /> Abrir Vídeo
                    </Button>
                  </div>
                )}
              </div>
            )}

            {content.type === "ebook" && content.thumbnail_url && (
              <div className="flex justify-center mb-6">
                <img src={content.thumbnail_url} alt={content.title} className="max-h-80 rounded-xl shadow-lg" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <Badge className="gradient-primary text-primary-foreground">
                {content.type === "video" ? "Vídeo" : "Ebook"}
              </Badge>
              {(content.categories as any)?.name && (
                <Badge variant="outline">{(content.categories as any).name}</Badge>
              )}
            </div>

            <h1 className="text-3xl font-heading font-bold text-foreground mb-4">{content.title}</h1>
            {content.description && (
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">{content.description}</p>
            )}

            {content.type === "ebook" && (
              <Button onClick={() => window.open(content.url, "_blank")} className="gradient-primary text-primary-foreground">
                <ExternalLink className="h-5 w-5 mr-2" /> Acessar Ebook
              </Button>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center py-12">Conteúdo não encontrado.</p>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
