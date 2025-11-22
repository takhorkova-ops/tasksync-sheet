import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  completion_date: string | null;
  creation_date: string;
}

export const useTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("creation_date", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: Omit<Task, "id" | "creation_date">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Необходима авторизация");

      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...task, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача создана успешно!");
    },
    onError: (error: Error) => {
      console.error("Error creating task:", error);
      toast.error("Ошибка при создании задачи");
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...task }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача обновлена!");
    },
    onError: (error: Error) => {
      console.error("Error updating task:", error);
      toast.error("Ошибка при обновлении задачи");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача удалена!");
    },
    onError: (error: Error) => {
      console.error("Error deleting task:", error);
      toast.error("Ошибка при удалении задачи");
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
};
