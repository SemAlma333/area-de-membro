import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, FolderOpen, Settings, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type ModuleForm = {
  title: string;
  description: string;
  thumbnail_url: string;
  category_id: string;
  display_order: number;
  is_active: boolean;
  is_locked: boolean;
  checkout_url: string;
}

const emptyForm: ModuleForm = {
  title: "", description: "", thumbnail_url: "",
  category_id: "", display_order: 0, is_active: true, is_locked: false, checkout_url: "",
};

export default function AdminModules() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ModuleForm>(emptyForm);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: modules, isLoading } = useQuery({
    queryKey: ["admin-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*, categories(name)")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, category_id: form.category_id || null };
      if (editId) {
        const { error } = await supabase.from("modules").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("modules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-modules"] });
      toast({ title: editId ? "Módulo atualizado!" : "Módulo criado!" });
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-modules"] });
      toast({ title: "Módulo removido!" });
    },
  });

  const openEdit = (module: any) => {
    setEditId(module.id);
    setForm({
      title: module.title,
      description: module.description || "",
      thumbnail_url: module.thumbnail_url || "",
      category_id: module.category_id || "",
      display_order: module.display_order,
      is_active: module.is_active,
      is_locked: module.is_locked || false,
      checkout_url: module.checkout_url || "",
    });
    setOpen(true);
  };

  const handleThumbnailUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Selecione apenas arquivos de imagem para a capa.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, thumbnail_url: result }));
      toast({ title: "Capa enviada!", description: "A imagem foi adicionada com sucesso." });
    };
    reader.onerror = () =>
      toast({
        title: "Erro no upload",
        description: "Não foi possível ler a imagem selecionada.",
        variant: "destructive",
      });
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Módulos</h1>
            <p className="text-muted-foreground">Gerencie os módulos/cursos da plataforma.</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Novo Módulo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">{editId ? "Editar" : "Novo"} Módulo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL da Thumbnail/Capa</Label>
                  <Input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Upload da Thumbnail/Capa</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
                      className="cursor-pointer"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {form.thumbnail_url && (
                    <div className="rounded-md overflow-hidden border border-border w-40">
                      <img src={form.thumbnail_url} alt="Pré-visualização da capa" className="w-full h-24 object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Link de Checkout (Premium)</Label>
                  <Input value={form.checkout_url} onChange={e => setForm({ ...form, checkout_url: e.target.value })} placeholder="https://..." />
                  <p className="text-xs text-muted-foreground">Link para redirecionamento quando usuário clicar em "Desbloqueie agora"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ordem de exibição</Label>
                    <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                    <Label>Ativo</Label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-primary" />
                    <div>
                      <Label className="text-sm font-bold">Módulo Bloqueado (Premium)</Label>
                      <p className="text-[10px] text-muted-foreground">O usuário verá um cadeado e "Desbloqueie agora".</p>
                    </div>
                  </div>
                  <Switch checked={form.is_locked} onCheckedChange={v => setForm({ ...form, is_locked: v })} />
                </div>

                <Button onClick={() => save.mutate()} disabled={save.isPending || !form.title} className="w-full gradient-primary text-primary-foreground">
                  {save.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Título</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Acesso</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : modules?.map(module => (
                  <tr key={module.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{module.title}</td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">{(module.categories as any)?.name || "—"}</td>
                    <td className="p-4">
                      {module.is_locked ? (
                        <Badge variant="outline" className="text-primary border-primary/50 flex items-center gap-1 w-fit">
                          <Lock className="h-3 w-3" /> Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/50 flex items-center gap-1 w-fit">
                          Acesso Livre
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={module.is_active ? "default" : "outline"} className={module.is_active ? "gradient-primary text-primary-foreground" : ""}>
                        {module.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/modules/${module.id}/contents`)} title="Gerenciar conteúdos">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(module)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(module.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}