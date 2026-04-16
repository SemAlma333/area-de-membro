import { motion } from "framer-motion";
import { Play, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ContentCardProps {
  id: string;
  title: string;
  description?: string | null;
  type: "video" | "ebook";
  thumbnailUrl?: string | null;
  categoryName?: string;
}

export function ContentCard({ id, title, description, type, thumbnailUrl, categoryName }: ContentCardProps) {
  const navigate = useNavigate();
  const isVideo = type === "video";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="group glass rounded-xl overflow-hidden shadow-lg hover:shadow-glow transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center gradient-primary">
            {isVideo ? <Play className="h-12 w-12 text-primary-foreground" /> : <BookOpen className="h-12 w-12 text-primary-foreground" />}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="glass-strong text-xs font-medium">
            {isVideo ? "Vídeo" : "Ebook"}
          </Badge>
        </div>
        {categoryName && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="glass-strong text-xs">{categoryName}</Badge>
          </div>
        )}
        {isVideo && (
          <div className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-black/70 border border-white/20 flex items-center justify-center shadow-lg">
            <Play className="h-4 w-4 text-white ml-0.5" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>}
        <Button
          onClick={() => navigate(`/content/${id}`)}
          className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {isVideo ? <><Play className="h-4 w-4 mr-2" /> Assistir</> : <><ExternalLink className="h-4 w-4 mr-2" /> Acessar</>}
        </Button>
      </div>
    </motion.div>
  );
}
