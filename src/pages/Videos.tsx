import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentCard } from "@/components/ContentCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Videos() {
  const [search, setSearch] = useState("");

  const { data: contents, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("*, categories(name)")
        .eq("type", "video")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = contents?.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByModule = (filtered || []).reduce<Record<string, NonNullable<typeof filtered>>>((acc, content) => {
    const moduleName = (content.categories as any)?.name || "Aulas Gerais";
    if (!acc[moduleName]) acc[moduleName] = [];
    acc[moduleName].push(content);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Vídeos</h1>
            <p className="text-muted-foreground">Aulas em vídeo exclusivas para membros.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar vídeos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedByModule).map(([moduleName, moduleContents]) => (
              <section key={moduleName}>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-4">{moduleName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moduleContents?.map((c) => (
                    <ContentCard
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      description={c.description}
                      type={c.type}
                      thumbnailUrl={c.thumbnail_url}
                      categoryName={(c.categories as any)?.name}
                    />
                  ))}
                </div>
              </section>
            ))}
            {filtered?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Nenhum vídeo encontrado.</div>
            )}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
