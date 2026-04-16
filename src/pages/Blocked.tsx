import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Blocked() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
          <span className="text-primary-foreground font-heading font-bold text-3xl">FL</span>
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-4">Acesso Bloqueado</h1>
        <p className="text-muted-foreground mb-8">Seu acesso à plataforma está temporariamente desativado. Entre em contato com o suporte.</p>
        <Button asChild variant="outline">
          <Link to="/login">Voltar ao Login</Link>
        </Button>
      </motion.div>
    </div>
  );
}
