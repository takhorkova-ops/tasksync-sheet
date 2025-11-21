import { useState } from "react";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useGoogleSheetsWrite } from "@/hooks/useGoogleSheetsWrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, ArrowUpDown } from "lucide-react";
import { TaskDialog } from "./TaskDialog";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  createdDate: string;
  startDate: string;
  completionDate: string;
}

const TaskTracker = () => {
  const { data, isLoading, error } = useGoogleSheets();
  const { appendTask, updateTask } = useGoogleSheetsWrite();
  const [filter, setFilter] = useState<"all" | "in-progress" | "done">("in-progress");
  const [sortByDate, setSortByDate] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Ошибка загрузки данных</CardTitle>
          <CardDescription>Не удалось загрузить данные из Google Sheets</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет данных</CardTitle>
          <CardDescription>Таблица пуста или данные недоступны</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const headers = data[0];
  const rows = data.slice(1);

  const tasks: Task[] = rows.map((row, index) => ({
    id: `task-${index}`,
    title: row[0] || "Без названия",
    description: row[1] || "",
    status: row[2] || "Не указан",
    createdDate: row[3] || "",
    startDate: row[4] || "",
    completionDate: row[5] || "",
  }));

  const filterTasks = (tasks: Task[]) => {
    let filtered = tasks;
    
    if (filter === "done") {
      filtered = tasks.filter(task => 
        task.status.toLowerCase().includes("завершен") || 
        task.status.toLowerCase().includes("done")
      );
    } else if (filter === "in-progress") {
      filtered = tasks.filter(task => 
        task.status.toLowerCase().includes("процесс") || 
        task.status.toLowerCase().includes("progress")
      );
    }

    if (sortByDate) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
        const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
        return dateB - dateA;
      });
    }
    
    return filtered;
  };

  const filteredTasks = filterTasks(tasks);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Пробуем парсить формат DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // месяцы в JS начинаются с 0
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    // Если не получилось, пробуем стандартный парсинг
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const isOverdue = (completionDate: string, status: string, title: string) => {
    if (!completionDate) return false;
    const normalizedStatus = status.toLowerCase();
    const isInProgress = normalizedStatus.includes("процесс") || normalizedStatus.includes("progress");
    if (!isInProgress) return false;
    
    const parsedDate = parseDate(completionDate);
    if (!parsedDate) return false;
    
    const completionTime = parsedDate.getTime();
    const currentTime = new Date().getTime();
    const result = completionTime < currentTime;
    
    // Debug logging for "Урок английского"
    if (title.includes("Урок английского")) {
      console.log("=== Debug Урок английского ===");
      console.log("Title:", title);
      console.log("Status:", status);
      console.log("Normalized Status:", normalizedStatus);
      console.log("Is In Progress:", isInProgress);
      console.log("Completion Date String:", completionDate);
      console.log("Parsed Date:", parsedDate);
      console.log("Completion Time:", completionTime);
      console.log("Current Time:", currentTime);
      console.log("Is Overdue:", result);
      console.log("============================");
    }
    
    return result;
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes("завершен") || normalizedStatus.includes("done")) {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{status}</Badge>;
    }
    if (normalizedStatus.includes("процесс") || normalizedStatus.includes("progress")) {
      return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />{status}</Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{status}</Badge>;
  };
  const allCount = tasks.length;
  const inProgressCount = tasks.filter(task => 
    task.status.toLowerCase().includes("процесс") || 
    task.status.toLowerCase().includes("progress")
  ).length;
  const doneCount = tasks.filter(task => 
    task.status.toLowerCase().includes("завершен") || 
    task.status.toLowerCase().includes("done")
  ).length;



  const TaskList = ({ tasks }: { tasks: Task[] }) => (
    <div className="space-y-4 mt-6">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Задачи не найдены</p>
          </CardContent>
        </Card>
      ) : (
        tasks.map((task, index) => (
        <Card key={task.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
                {task.description && (
                  <CardDescription className="mt-1">
                    {task.description}
                  </CardDescription>
                )}
              </div>
              {getStatusBadge(task.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {task.createdDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Дата создания:</span>
                  <span>{task.createdDate}</span>
                </div>
              )}
              {task.startDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Дата начала:</span>
                  <span>{task.startDate}</span>
                </div>
              )}
              {task.completionDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Дата завершения:</span>
                  <span className={isOverdue(task.completionDate, task.status, task.title) ? "text-destructive font-semibold" : ""}>
                    {task.completionDate}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <TaskDialog
                mode="edit"
                task={task}
                onSave={(updatedTask) => {
                  updateTask.mutate({ rowIndex: index, task: updatedTask });
                }}
              />
            </div>
          </CardContent>
        </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Задачи</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSortByDate(!sortByDate)}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortByDate ? "Сброс" : "По дате"}
          </Button>
          <TaskDialog
            mode="create"
            onSave={(newTask) => {
              appendTask.mutate(newTask);
            }}
          />
        </div>
      </div>
      <Tabs defaultValue="in-progress" onValueChange={(value) => setFilter(value as typeof filter)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">
          Все ({allCount})
        </TabsTrigger>
        <TabsTrigger value="in-progress">
          В процессе ({inProgressCount})
        </TabsTrigger>
        <TabsTrigger value="done">
          Завершенные ({doneCount})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <TaskList tasks={filteredTasks} />
      </TabsContent>
      <TabsContent value="in-progress">
        <TaskList tasks={filteredTasks} />
      </TabsContent>
      <TabsContent value="done">
        <TaskList tasks={filteredTasks} />
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskTracker;
