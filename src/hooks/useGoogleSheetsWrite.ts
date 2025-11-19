import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SPREADSHEET_ID = "1L7U3nYLgYbD9RIsQdiqmi94dxZhQYxolCzRpSBgKYiM";
const API_KEY = "AIzaSyAUA0pHDay0LQ0kebpZtam3-8ZCl_U_mak";

interface TaskData {
  title: string;
  description: string;
  status: string;
  createdDate: string;
  startDate: string;
  completionDate: string;
}

export const useGoogleSheetsWrite = () => {
  const queryClient = useQueryClient();

  const appendTask = useMutation({
    mutationFn: async (task: TaskData) => {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Лист1:append?valueInputOption=USER_ENTERED&key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[
              task.title,
              task.description,
              task.status,
              task.createdDate,
              task.startDate,
              task.completionDate,
            ]],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Ошибка при добавлении задачи");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["googleSheets"] });
      toast.success("Задача успешно добавлена");
    },
    onError: (error: Error) => {
      console.error("Error appending task:", error);
      toast.error(error.message || "Не удалось добавить задачу");
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ rowIndex, task }: { rowIndex: number; task: TaskData }) => {
      const range = `Лист1!A${rowIndex + 2}:F${rowIndex + 2}`;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${API_KEY}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[
              task.title,
              task.description,
              task.status,
              task.createdDate,
              task.startDate,
              task.completionDate,
            ]],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Ошибка при обновлении задачи");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["googleSheets"] });
      toast.success("Задача успешно обновлена");
    },
    onError: (error: Error) => {
      console.error("Error updating task:", error);
      toast.error(error.message || "Не удалось обновить задачу");
    },
  });

  return { appendTask, updateTask };
};
