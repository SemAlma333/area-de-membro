import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ArrowLeft } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center border-b border-border/60 px-4 glass-strong sticky top-0 z-40">
            <div className="flex items-center w-full">
              <div className="relative flex items-center">
                <SidebarTrigger className="mr-3 h-10 w-10 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-300 sm:h-8 sm:w-8 sm:rounded-md sm:border-none sm:bg-transparent sm:text-foreground" />
                
                {/* Indicador Mobile com Seta - Atendendo ao pedido do usuário */}
                <div className="sm:hidden absolute left-12 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 animate-fade-in whitespace-nowrap shadow-glow pointer-events-none">
                  <ArrowLeft className="w-3.5 h-3.5 text-primary animate-bounce-x" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Acesse o Menu</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
                {/* Logo/Brand removed as per user request */}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
