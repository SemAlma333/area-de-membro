import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminModuleContents() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [isComplementary, setIsComplementary] = useState(false);
  const [parentContentId, setParentContentId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [orderedContents, setOrderedContents] = useState<any[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: module } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
  });

  const { data: moduleContents, isLoading } = useQuery({
    queryKey: ["module-contents", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_contents")
        .select(`
          *,
          contents:module_contents_content_id_fkey (
            id,
            title,
            type,
            thumbnail_url,
            description
          ),
          parent_content:module_contents_parent_content_id_fkey (
            id,
            title
          )
        `)
        .eq("module_id", moduleId!)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
  });

  useEffect(() => {
    if (moduleContents) {
      setOrderedContents(moduleContents);
    }
  }, [moduleContents]);

  const { data: availableContents } = useQuery({
    queryKey: ["available-contents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, type")
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const addedContentIds = orderedContents?.map((mc: any) => mc.content_id) || [];
  const selectableContents = availableContents?.filter((content: any) => !addedContentIds.includes(content.id));

  const addContent = useMutation({
    mutationFn: async () => {
      if (!selectedContentId) throw new Error("Selecione um conteúdo");

      const { error } = await supabase.from("module_contents").insert({
        module_id: moduleId!,
        content_id: selectedContentId,
        is_complementary: isComplementary,
        parent_content_id: isComplementary && parentContentId ? parentContentId : null,
        display_order: (moduleContents?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-contents", moduleId] });
      qc.invalidateQueries({ queryKey: ["modules"] });
      qc.invalidateQueries({ queryKey: ["module", moduleId] });
      qc.invalidateQueries({ queryKey: ["available-contents"] });
      toast({ title: "Conteúdo adicionado ao módulo!" });
      setOpen(false);
      setSelectedContentId("");
      setIsComplementary(false);
      setParentContentId("");
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("module_contents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-contents", moduleId] });
      qc.invalidateQueries({ queryKey: ["modules"] });
      qc.invalidateQueries({ queryKey: ["module", moduleId] });
      toast({ title: "Conteúdo removido do módulo!" });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase.from("module_contents").update({ display_order }).eq("id", id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-contents", moduleId] });
      qc.invalidateQueries({ queryKey: ["modules"] });
      qc.invalidateQueries({ queryKey: ["module", moduleId] });
    },
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(orderedContents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedContents(items);

    const updates = items.map((item, index) => ({
      id: item.id,
      display_order: index + 1,
    }));

    updateOrder.mutate(updates);
  };

  const getParentContents = () => {
    return orderedContents?.filter(mc => !mc.is_complementary) || [];
  };

  if (!moduleId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Módulo não encontrado.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/admin/modules")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Conteúdos do Módulo
            </h1>
            <p className="text-muted-foreground">
              {module?.title} - Organize os vídeos e conteúdos complementares
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-muted-foreground">
            Arraste para reordenar • Clique em + para adicionar conteúdos
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> Adicionar Conteúdo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Conteúdo ao Módulo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conteúdo</label>
                  <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um conteúdo" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableContents?.length ? (
                        selectableContents.map(content => (
                          <SelectItem key={content.id} value={content.id}>
                            {content.title} ({content.type === "video" ? "Vídeo" : "Ebook"})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Todos os conteúdos já foram adicionados
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="complementary"
                    checked={isComplementary}
                    onChange={(e) => setIsComplementary(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="complementary" className="text-sm">
                    É conteúdo complementar?
                  </label>
                </div>

                {isComplementary && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conteúdo Principal</label>
                    <Select value={parentContentId} onValueChange={setParentContentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o conteúdo principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {getParentContents().map(mc => (
                          <SelectItem key={mc.id} value={mc.contents?.id || mc.content_id}>
                            {mc.contents?.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!parentContentId && (
                      <p className="text-xs text-destructive">Selecione o conteúdo principal para relacionar este complemento.</p>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => addContent.mutate()}
                  disabled={addContent.isPending || !selectedContentId || (isComplementary && !parentContentId)}
                  className="w-full gradient-primary text-primary-foreground"
                >
                  {addContent.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="module-contents">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Carregando conteúdos...</p>
                  </div>
                ) : orderedContents?.length === 0 ? (
                  <div className="text-center py-12 glass rounded-xl">
                    <p className="text-muted-foreground mb-4">Nenhum conteúdo neste módulo ainda.</p>
                    <p className="text-sm text-muted-foreground">Clique em "Adicionar Conteúdo" para começar.</p>
                  </div>
                ) : (
                  orderedContents?.map((mc, index) => (
                    <Draggable key={mc.id} draggableId={mc.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={provided.draggableProps.style}
                          className={`glass rounded-xl p-4 transition-all ${
                            snapshot.isDragging ? "shadow-lg scale-105" : ""
                          } ${mc.is_complementary ? "ml-8 border-l-4 border-primary" : ""}`}
                        >
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="flex-1 flex items-center gap-4">
                              {mc.contents?.thumbnail_url && (
                                <img
                                  src={mc.contents.thumbnail_url}
                                  alt={mc.contents.title}
                                  className="w-16 h-12 rounded object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-medium text-foreground">{mc.contents?.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">
                                    {mc.contents?.type === "video" ? "Vídeo" : "Ebook"}
                                  </Badge>
                                  {mc.is_complementary && (
                                    <Badge variant="outline" className="text-xs">
                                      Complementar
                                    </Badge>
                                  )}
                                  {mc.parent_content && (
                                    <span className="text-xs text-muted-foreground">
                                      → Complementa: {mc.parent_content.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeContent.mutate(mc.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </motion.div>
    </DashboardLayout>
  );
}