import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, BookOpen, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

export default function ModuleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: module, isLoading: moduleLoading } = useQuery({
    queryKey: ["module", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          categories(name),
          module_contents!module_contents_module_id_fkey(
            id,
            content_id,
            parent_content_id,
            display_order,
            is_complementary,
            contents:module_contents_content_id_fkey(
              id,
              title,
              description,
              type,
              url,
              thumbnail_url
            ),
            parent_content:module_contents_parent_content_id_fkey(
              id,
              title
            )
          )
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: userProgress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getProgressForContent = (contentId: string) => {
    return userProgress?.find(p => p.content_id === contentId);
  };

  const getModuleProgress = () => {
    if (!module?.module_contents || !userProgress) return 0;

    const mainContents = module.module_contents.filter(mc => !mc.is_complementary);
    const completedContents = mainContents.filter(mc =>
      getProgressForContent(mc.contents?.id)?.is_completed
    );

    return mainContents.length > 0 ? (completedContents.length / mainContents.length) * 100 : 0;
  };

  const mainContents = module?.module_contents
    ?.filter((mc: any) => !mc.is_complementary)
    .sort((a: any, b: any) => a.display_order - b.display_order) || [];

  const groupedContents = module?.module_contents?.reduce((acc: any, mc: any) => {
    const mainId = mc.contents?.id || mc.content_id;
    const parentId = mc.parent_content_id || mc.parent_content?.id;

    if (mc.is_complementary && parentId) {
      if (!acc[parentId]) {
        acc[parentId] = { main: null, complementary: [] };
      }
      acc[parentId].complementary.push(mc);
    } else {
      if (!acc[mainId]) {
        acc[mainId] = { main: mc, complementary: [] };
      } else {
        acc[mainId].main = mc;
      }
    }
    return acc;
  }, {}) || {};

    const [activeContentId, setActiveContentId] = useState<string | null>(null);

  const handleContentClick = (contentId: string) => {
    setActiveContentId(contentId);
  };

  const activeContent = activeContentId
    ? module?.module_contents?.find((mc: any) => (mc.contents?.id || mc.content_id) === activeContentId)?.contents
    : null;

  useEffect(() => {
    if (!activeContentId && mainContents.length > 0) {
      const firstContentId = mainContents[0].contents?.id || mainContents[0].content_id;
      if (firstContentId) {
        // We don't necessarily want to auto-open the first one in this new "inline" mode
        // as it might be overwhelming. Let the user click "Assistir".
        // Removed auto-open to keep the list clean initially.
      }
    }
  }, [mainContents]);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

  const getGoogleDriveId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const getWistiaMediaId = (value: string) => {
    const cleanValue = value.trim();
    const mediaIdMatch = cleanValue.match(/media-id=["']([a-zA-Z0-9_-]+)["']/i);
    if (mediaIdMatch) return mediaIdMatch[1];
    const embedJsMatch = cleanValue.match(/embed\/([a-zA-Z0-9_-]+)\.js/i);
    if (embedJsMatch) return embedJsMatch[1];
    const iframeMatch = cleanValue.match(/wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9_-]+)/i);
    if (iframeMatch) return iframeMatch[1];
    const directIdMatch = cleanValue.match(/^([a-zA-Z0-9_-]{8,})$/);
    if (directIdMatch) return directIdMatch[1];
    return null;
  };

  const moduleProgress = getModuleProgress();

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/modules")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos Módulos
        </Button>

        {moduleLoading ? (
          <div className="space-y-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ) : module ? (
          <>
            {/* Header do Módulo */}
            <div className="glass rounded-xl p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="gradient-primary text-primary-foreground">
                      Módulo
                    </Badge>
                    {(module.categories as any)?.name && (
                      <Badge variant="outline">{(module.categories as any).name}</Badge>
                    )}
                  </div>

                  <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
                    {module.title}
                  </h1>

                  {module.description && (
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                      {module.description}
                    </p>
                  )}

                  {/* Barra de Progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seu progresso</span>
                      <span className="font-medium">{Math.round(moduleProgress)}%</span>
                    </div>
                    <Progress value={moduleProgress} className="h-2" />
                  </div>
                </div>

                {module.thumbnail_url && (
                  <div className="md:w-64">
                    <img
                      src={module.thumbnail_url}
                      alt={module.title}
                      className="w-full aspect-video rounded-lg object-cover shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Conteúdos do Módulo */}
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
                Conteúdos do Módulo
              </h2>

              {mainContents.length > 0 ? (
                <div className="space-y-4">
                  {mainContents.map((mc: any, index: number) => {
                    const mainContent = mc.contents;
                    const progress = getProgressForContent(mainContent?.id || mc.content_id);
                    const mainContentId = mainContent?.id || mc.content_id;
                    const complementaryIds = groupedContents[mainContentId]?.complementary.map((c: any) => c.contents?.id || c.content_id) || [];
                    const isAnyContentInCardActive = activeContentId === mainContentId || (activeContentId && complementaryIds.includes(activeContentId));

                    if (!mainContent || !mainContentId) return null;

                    return (
                      <motion.div
                        key={mainContentId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass rounded-xl overflow-hidden transition-all duration-300 ${isAnyContentInCardActive ? 'ring-2 ring-primary/50 shadow-glow' : ''}`}
                      >
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold transition-colors ${isAnyContentInCardActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Aula {index + 1}</p>
                                <h3 className="text-xl font-semibold text-foreground">{mainContent.title}</h3>
                              </div>
                            </div>

                            <Button
                              className={`${isAnyContentInCardActive && activeContentId === mainContentId ? 'bg-secondary text-secondary-foreground' : 'gradient-primary text-primary-foreground'}`}
                              onClick={() => handleContentClick(activeContentId === mainContentId ? '' : mainContentId)}
                            >
                              {activeContentId === mainContentId ? (
                                <>Fechar Aula</>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" /> Assistir
                                </>
                              )}
                            </Button>
                          </div>

                          {isAnyContentInCardActive && activeContent && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-6 space-y-4"
                            >
                              {activeContentId !== mainContentId && (
                                <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border border-primary/10">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-sm font-medium text-primary">Próximo: {activeContent.title}</span>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => handleContentClick(mainContentId)} className="text-xs h-7">
                                    Voltar para Aula
                                  </Button>
                                </div>
                              )}
                              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/5">
                                {(() => {
                                  const url = activeContent.url;
                                  const ytId = url ? getYouTubeId(url) : null;
                                  const driveId = url ? getGoogleDriveId(url) : null;
                                  const wistiaId = url ? getWistiaMediaId(url) : null;

                                  if (ytId) {
                                    return (
                                      <iframe
                                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      />
                                    );
                                  }

                                  if (wistiaId) {
                                    return (
                                      <iframe
                                        src={`https://fast.wistia.net/embed/iframe/${wistiaId}?autoPlay=true`}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture; microphone"
                                        allowFullScreen
                                        title={activeContent.title}
                                        style={{ border: 'none' }}
                                      />
                                    );
                                  }

                                  if (driveId) {
                                    return (
                                      <iframe
                                        src={`https://drive.google.com/file/d/${driveId}/preview`}
                                        className="w-full h-full"
                                        allowFullScreen
                                      />
                                    );
                                  }

                                  return (
                                    <div className="flex h-full items-center justify-center bg-muted text-center p-4">
                                      <p className="text-muted-foreground">
                                        Não foi possível carregar o vídeo aqui.
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          )}

                          {mainContent.description && (
                            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                              {mainContent.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {mainContent.type === "video" ? "Vídeo" : "Ebook"}
                            </Badge>
                            {progress?.is_completed && (
                              <Badge className="bg-emerald-500 text-white text-xs">Concluído</Badge>
                            )}
                            {progress?.progress_percentage > 0 && !progress?.is_completed && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(progress.progress_percentage)}% concluído
                              </Badge>
                            )}
                          </div>
                        </div>

                        {groupedContents[mainContentId]?.complementary.length > 0 && (
                          <div className="border-t border-border/50 bg-muted/20 p-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">
                              Materiais complementares
                            </h4>
                            <div className="space-y-3">
                              {groupedContents[contentId].complementary.map((comp: any) => (
                                <div
                                  key={comp.id}
                                  className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleContentClick(comp.contents?.id)}
                                >
                                  {comp.contents?.thumbnail_url && (
                                    <img
                                      src={comp.contents.thumbnail_url}
                                      alt={comp.contents.title}
                                      className="w-16 h-10 rounded object-cover"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{comp.contents?.title}</p>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {comp.contents?.type === "video" ? "Vídeo" : "Ebook"}
                                    </Badge>
                                  </div>
                                  <Button size="sm" variant="ghost">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 glass rounded-xl">
                  <p className="text-muted-foreground">Este módulo ainda não possui conteúdos.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Módulo não encontrado.</p>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}