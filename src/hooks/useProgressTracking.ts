import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useProgressTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateProgress = useMutation({
    mutationFn: async ({
      contentId,
      progressPercentage,
      isCompleted = false
    }: {
      contentId: string;
      progressPercentage: number;
      isCompleted?: boolean;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          content_id: contentId,
          progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
          is_completed: isCompleted || progressPercentage >= 100,
          last_watched_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate queries relacionadas ao progresso
      queryClient.invalidateQueries({ queryKey: ["user-progress", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  const markAsCompleted = useMutation({
    mutationFn: async (contentId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          content_id: contentId,
          progress_percentage: 100,
          is_completed: true,
          last_watched_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });

  return {
    updateProgress,
    markAsCompleted,
  };
};