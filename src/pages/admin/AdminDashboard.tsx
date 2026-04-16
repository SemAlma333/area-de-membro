import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, BookOpen, Users, FolderOpen } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [videosRes, ebooksRes, catsRes, clientsRes, activeRes] = await Promise.all([
        supabase.from("contents").select("id", { count: "exact", head: true }).eq("type", "video"),
        supabase.from("contents").select("id", { count: "exact", head: true }).eq("type", "ebook"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        videos: videosRes.count || 0,
        ebooks: ebooksRes.count || 0,
        categories: catsRes.count || 0,
        clients: clientsRes.count || 0,
        activeClients: activeRes.count || 0,
      };
    },
  });

  const cards = [
    { label: "Vídeos", value: stats?.videos || 0, icon: Video, color: "from-orange-500 to-red-500" },
    { label: "Ebooks", value: stats?.ebooks || 0, icon: BookOpen, color: "from-blue-500 to-indigo-500" },
    { label: "Categorias", value: stats?.categories || 0, icon: FolderOpen, color: "from-emerald-500 to-teal-500" },
    { label: "Clientes", value: stats?.clients || 0, icon: Users, color: "from-purple-500 to-pink-500", sub: `${stats?.activeClients || 0} ativos` },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground mb-8">Visão geral da plataforma.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                  <c.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-heading font-bold text-foreground">{c.value}</p>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  {c.sub && <p className="text-xs text-primary">{c.sub}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
