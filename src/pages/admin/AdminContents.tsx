import { useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];

interface ContentForm {
  title: string;
  description: string;
  type: ContentType;
  url: string;
  thumbnail_url: string;
  category_id: string;
  module_id: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm: ContentForm = {
  title: "", description: "", type: "video", url: "", thumbnail_url: "",
  category_id: "", module_id: "", display_order: 0, is_active: true,
};

export default function AdminContents() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [items, setItems] = useState<any[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: contents, isLoading } = useQuery({
    queryKey: ["admin-contents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contents")
        .select(`*, categories(name)`)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (contents) {
      setItems(contents);
    }
  }, [contents]);

  const updateOrder = useMutation({
    mutationFn: async (newItems: any[]) => {
      // Fazemos as atualizações em paralelo para ser mais rápido
      const promises = newItems.map((item, index) => 
        supabase
          .from("contents")
          .update({ display_order: index })
          .eq("id", item.id)
      );
      await Promise.all(promises);
    },
    // Não invalidamos imediatamente para evitar saltos visuais
    onSuccess: () => {
      console.log("Ordem salva com sucesso no banco de dados.");
    },
  });

  // Debounce para salvar apenas quando o usuário parar de mexer
  useEffect(() => {
    if (items.length > 0 && items !== contents) {
      const timer = setTimeout(() => {
        // Verifica se a ordem realmente mudou antes de salvar
        const hasChanged = items.some((item, index) => item.display_order !== index);
        if (hasChanged) {
          updateOrder.mutate(items);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [items]);

  const handleReorder = (newOrder: any[]) => {
    setItems(newOrder);
  };

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("display_order");
      if (error) throw error;
      console.log("Categories loaded:", data);
      return data;
    },
  });

  const { data: modules } = useQuery({
    queryKey: ["admin-modules-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("id, title").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { module_id, ...contentData } = form;
      const payload = { ...contentData, category_id: form.category_id || null };

      if (editId) {
        const { error } = await supabase.from("contents").update(payload).eq("id", editId);
        if (error) throw error;

        if (module_id) {
          const { data: existing, error: existsError } = await supabase
            .from("module_contents")
            .select("id")
            .eq("module_id", module_id)
            .eq("content_id", editId)
            .maybeSingle();
          if (existsError) throw existsError;
          if (!existing) {
            const { error: moduleError } = await supabase.from("module_contents").insert({
              module_id,
              content_id: editId,
              display_order: 999,
              is_complementary: false,
            });
            if (moduleError) throw moduleError;
          }
        }
      } else {
        const { data, error } = await supabase.from("contents").insert(payload).select("id").single();
        if (error) throw error;

        if (module_id && data?.id) {
          const { error: moduleError } = await supabase.from("module_contents").insert({
            module_id,
            content_id: data.id,
            display_order: 999,
            is_complementary: false,
          });
          if (moduleError) throw moduleError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contents"] });
      qc.invalidateQueries({ queryKey: ["admin-module-contents"] });
      qc.invalidateQueries({ queryKey: ["available-contents"] });
      qc.invalidateQueries({ queryKey: ["modules"] });
      if (form.module_id) {
        qc.invalidateQueries({ queryKey: ["module", form.module_id] });
      }
      toast({ title: editId ? "Conteúdo atualizado!" : "Conteúdo criado!" });
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contents"] });
      toast({ title: "Conteúdo removido!" });
    },
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      title: c.title,
      description: c.description || "",
      type: c.type,
      url: c.url,
      thumbnail_url: c.thumbnail_url || "",
      category_id: c.category_id || "",
      module_id: "",
      display_order: c.display_order,
      is_active: c.is_active,
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
            <h1 className="text-3xl font-heading font-bold text-foreground">Conteúdos</h1>
            <p className="text-muted-foreground">Gerencie vídeos e ebooks da plataforma.</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Novo Conteúdo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">{editId ? "Editar" : "Novo"} Conteúdo</DialogTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v: ContentType) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="ebook">Ebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {categories && categories.length > 0 ? (
                          categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">Nenhuma categoria encontrada. Crie categorias primeiro.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Adicionar ao Módulo</Label>
                    <Select value={form.module_id || "none"} onValueChange={v => setForm({ ...form, module_id: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {modules?.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{form.type === "video" ? "Link do Vídeo" : "Link do Ebook"}</Label>
                  <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
                  <p className="text-xs text-muted-foreground">
                    {form.type === "video"
                      ? "Cole a URL do YouTube, Google Drive OU o código Wistia completo (você pode copiar a tag <wistia-player> ou o ID direto)."
                      : "Ao salvar, este conteúdo aparecerá automaticamente na área de Ebooks."}
                  </p>
                  {form.type === "video" && (
                    <div className="text-xs bg-muted/50 p-2 rounded border border-border">
                      <p className="font-semibold mb-1 text-foreground">Exemplos Wistia:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• ID direto: <code className="text-[11px]">h79u3cdk5v</code></li>
                        <li>• Media ID: <code className="text-[11px]">media-id="h79u3cdk5v"</code></li>
                        <li>• Código completo com tag &lt;wistia-player&gt;</li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>URL da Thumbnail/Capa</Label>
                  <Input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
                  <p className="text-xs text-muted-foreground">
                    {form.type === "video" ? "Para Wistia, você pode usar: https://fast.wistia.com/embed/medias/[ID]/swatch" : ""}
                  </p>
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
                <Button onClick={() => save.mutate()} disabled={save.isPending || !form.title || !form.url} className="w-full gradient-primary text-primary-foreground">
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
                  <th className="w-10"></th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Título</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <Reorder.Group as="tbody" axis="y" values={items} onReorder={handleReorder}>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : items.map(c => (
                  <Reorder.Item
                    as="tr"
                    key={c.id}
                    value={c}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-default bg-card/50"
                  >
                    <td className="p-4 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </td>
                    <td className="p-4 font-medium text-foreground">{c.title}</td>
                    <td className="p-4"><Badge variant="secondary">{c.type === "video" ? "Vídeo" : "Ebook"}</Badge></td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">{(c.categories as any)?.name || "—"}</td>
                    <td className="p-4">
                      <Badge variant={c.is_active ? "default" : "outline"} className={c.is_active ? "gradient-primary text-primary-foreground" : ""}>
                        {c.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </table>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
