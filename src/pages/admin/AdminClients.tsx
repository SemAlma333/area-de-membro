import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Mail, User, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminClients() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addClient = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-client", {
        body: {
          email,
          password,
          displayName: displayName || null,
          phone: phone || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: "Cliente cadastrado!" });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: "Removido!" });
      setDeleteConfirmOpen(false);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-clients"] }),
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setPhone("");
  };

  const filtered = clients?.filter(c => {
    const term = search.toLowerCase();
    return (c.display_name || "").toLowerCase().includes(term) || 
           (c.user_id || "").toLowerCase().includes(term) ||
           (c.phone || "").toLowerCase().includes(term);
  });

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Gestão de Clientes</h1>
            <p className="text-muted-foreground">
              {clients ? `Total: ${clients.length} alunos cadastrados` : "Carregando alunos..."}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 w-64" />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nome" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" />
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefone" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha (min 6)" />
                  <Button onClick={() => addClient.mutate()} className="w-full gradient-primary text-primary-foreground">Cadastrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/20 border-b border-border">
              <tr>
                <th className="p-4">Aluno</th>
                <th className="p-4">Telefone</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map(c => (
                <tr key={c.id} className="border-b border-border/50 group hover:bg-muted/10">
                  <td className="p-4">
                    <div className="font-bold">{c.display_name || "Sem nome"}</div>
                    <div className="text-xs text-muted-foreground">{c.user_id}</div>
                  </td>
                  <td className="p-4">{c.phone || "—"}</td>
                  <td className="p-4">
                    <Badge variant={c.is_active ? "default" : "outline"}>{c.is_active ? "Ativo" : "Inativo"}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch checked={c.is_active} onCheckedChange={v => toggleActive.mutate({ userId: c.user_id, isActive: v })} />
                      <Button variant="ghost" size="icon" onClick={() => { setUserToDelete(c.user_id); setDeleteConfirmOpen(true); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aluno?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá o perfil do banco de dados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500" onClick={() => userToDelete && deleteUser.mutate(userToDelete)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
