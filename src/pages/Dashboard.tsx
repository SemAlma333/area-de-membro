import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Play, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { profile } = useAuth();

  const { data: featuredModules, isLoading, error: queryError } = useQuery({
    queryKey: ["featured-modules"],
    queryFn: async () => {
      try {
        console.log("Iniciando busca de módulos premium...");
        const { data, error } = await supabase
          .from("modules")
          .select(`
            *,
            module_contents(
              id,
              contents:module_contents_content_id_fkey(type)
            )
          `)
          .eq("is_active", true)
          .eq("is_locked", true)
          .order("display_order")
          .limit(6);

        if (error) {
          console.error("Erro detalhado do Supabase:", error);
          throw error;
        }

        console.log("Módulos premium encontrados:", data?.length);
        return data;
      } catch (err) {
        console.error("Erro crítico na query do Dashboard:", err);
        return [];
      }
    },
  });

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Olá, {profile?.display_name || "Membro"} 👋
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Bem-vindo à plataforma Fatias Lucrativas. Está pronto para mudar sua realidade financeira e dar o próximo passo com os módulos completos?
          </p>
        </div>

        {queryError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-8 text-sm">
            Erro ao carregar conteúdos premium. Verifique se a coluna 'is_locked' existe no Supabase.
          </div>
        )}

        <div className="glass rounded-xl p-8 mb-12 text-center flex flex-col items-center">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            Todos os conteúdos agora estão organizados dentro dos módulos. Clique abaixo para acessar os módulos e iniciar sua jornada de transformação financeira.
          </p>
          <Link
            to="/ebooks"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground shadow-lg transition hover:bg-primary/90 w-full sm:w-auto"
          >
            Ver Meus Conteúdos
          </Link>
        </div>

        {/* Módulos Premium/Bloqueados */}
        {featuredModules && featuredModules.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Conteúdos Premium</h2>
                <p className="text-muted-foreground">Maximize seus ganhos com estratégias exclusivas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredModules.map((module: any) => {
                // Cálculo mais seguro das estatísticas
                const videos = module.module_contents?.filter((mc: any) =>
                  (mc.contents?.type || mc.type) === "video"
                ).length || 0;

                return (
                  <motion.div
                    key={module.id}
                    whileHover={{ y: -5 }}
                    className="glass rounded-xl overflow-hidden border-2 border-primary/20 shadow-glow-premium relative group"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px]">
                        <div className="bg-primary p-3 rounded-full shadow-2xl mb-3 animate-bounce">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-primary text-white border-none px-4 py-1 mb-2">PREMIUM</Badge>
                      </div>

                      {module.thumbnail_url ? (
                        <img
                          src={module.thumbnail_url}
                          alt={module.title}
                          className="w-full h-full object-cover grayscale-[0.5]"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center grayscale">
                          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-heading font-bold text-foreground mb-4 line-clamp-1">
                        {module.title}
                      </h3>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Play className="h-3 w-3" />
                          <span>{videos} aulas</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white font-bold h-9 px-4 rounded-lg flex items-center gap-2 shadow-lg"
                          onClick={() => {
                            if (module.checkout_url) {
                              window.open(module.checkout_url, '_blank');
                            } else {
                              // Fallback se não houver checkout_url
                              console.warn('Checkout URL não configurado para o módulo:', module.title);
                            }
                          }}
                        >
                          <Lock className="h-3.5 w-3.5" /> Desbloqueie agora
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="border border-dashed border-border p-8 rounded-xl text-center">
              <p className="text-muted-foreground italic text-sm">
                Nenhum módulo marcado como bloqueado foi encontrado.
                Vá em Admin &gt; Módulos e ative "Módulo Bloqueado" em um deles.
              </p>
            </div>
          )
        )}
      </motion.div>
    </DashboardLayout>
  );
}
