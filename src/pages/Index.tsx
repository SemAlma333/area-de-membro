import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Play, BookOpen, Shield, Zap } from "lucide-react";

export default function Landing() {
  const features = [
    { icon: Play, title: "Vídeos Exclusivos", description: "Aulas em vídeo com conteúdo premium para acelerar seus resultados." },
    { icon: BookOpen, title: "Ebooks Completos", description: "Material de leitura aprofundado para dominar cada estratégia." },
    { icon: Shield, title: "Acesso Seguro", description: "Plataforma protegida com controle de acesso por e-mail." },
    { icon: Zap, title: "Conteúdo Atualizado", description: "Novos materiais adicionados frequentemente para você evoluir." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            {/* Logo/Brand removed as per user request */}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost"><Link to="/login">Entrar</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Plataforma de membros exclusiva</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
              Transforme conhecimento em{" "}
              <span className="gradient-text">fatias lucrativas</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Acesse vídeos, ebooks e conteúdos exclusivos que vão acelerar seus resultados. Tudo em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground h-14 px-8 text-base font-semibold shadow-glow">
                <Link to="/login">Acessar plataforma <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base">
                <Link to="/login">Já sou membro</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4">O que você encontra aqui</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Tudo que você precisa para crescer, organizado e acessível.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 hover:shadow-glow transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-primary rounded-2xl p-12 text-center"
          >
            <h2 className="text-3xl font-heading font-bold text-white mb-4">Pronto para começar?</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">O acesso é exclusivo para alunos cadastrados pelo administrador.</p>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-base font-semibold transition-transform active:scale-95">
              <Link to="/login" className="flex items-center justify-center w-full">Entrar na plataforma <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Fatias Lucrativas. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
