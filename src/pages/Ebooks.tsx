import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentCard } from "@/components/ContentCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Ebooks() {
  const [search, setSearch] = useState("");

  const { data: contents, isLoading } = useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("*, categories(name)")
        .eq("type", "ebook")
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

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Ebooks</h1>
            <p className="text-muted-foreground">Material de leitura exclusivo.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar ebooks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered?.map((c) => (
                <ContentCard key={c.id} id={c.id} title={c.title} description={c.description} type={c.type} thumbnailUrl={c.thumbnail_url} categoryName={(c.categories as any)?.name} />
              ))}
          {!isLoading && filtered?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum ebook encontrado.</div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
