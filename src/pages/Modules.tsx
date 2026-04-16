import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentCard } from "@/components/ContentCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Modules() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: modules, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          categories(name),
          module_contents!module_contents_module_id_fkey(
            id,
            content_id,
            display_order,
            contents:module_contents_content_id_fkey(
              id,
              title,
              thumbnail_url,
              type
            )
          )
        `)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = modules?.filter(m =>
    !m.is_locked &&
    (m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const getModuleStats = (module: any) => {
    const contents = module.module_contents || [];
    const videos = contents.filter((mc: any) => mc.contents?.type === "video").length;
    const ebooks = contents.filter((mc: any) => mc.contents?.type === "ebook").length;
    return { videos, ebooks, total: contents.length };
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Módulos</h1>
            <p className="text-muted-foreground">Cursos organizados por módulos com aulas sequenciais.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar módulos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((module: any) => {
              const stats = getModuleStats(module);
              const firstContent = module.module_contents?.[0]?.contents;

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate(`/modules/${module.id}`)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    {module.thumbnail_url ? (
                      <img
                        src={module.thumbnail_url}
                        alt={module.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : firstContent?.thumbnail_url ? (
                      <img
                        src={firstContent.thumbnail_url}
                        alt={module.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute top-4 left-4">
                      <Badge className="gradient-primary text-primary-foreground">
                        Módulo
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Play className="h-4 w-4" />
                        <span>{stats.videos} vídeo{stats.videos !== 1 ? 's' : ''}</span>
                        {stats.ebooks > 0 && (
                          <>
                            <span>•</span>
                            <BookOpen className="h-4 w-4" />
                            <span>{stats.ebooks} ebook{stats.ebooks !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-heading font-semibold text-foreground mb-2 line-clamp-2">
                      {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {module.description}
                      </p>
                    )}
                    {(module.categories as any)?.name && (
                      <Badge variant="outline" className="mb-4">
                        {(module.categories as any).name}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {stats.total} conteúdo{stats.total !== 1 ? 's' : ''}
                      </div>
                      <Button
                        size="sm"
                        className="gradient-primary text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/modules/${module.id}`);
                        }}
                      >
                        Acessar Módulo
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered?.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum módulo encontrado.
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}