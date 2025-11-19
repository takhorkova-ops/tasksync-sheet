import { useState } from "react";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

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
  const [filter, setFilter] = useState<"all" | "in-progress" | "done">("all");

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
    if (filter === "all") return tasks;
    
    if (filter === "done") {
      return tasks.filter(task => 
        task.status.toLowerCase().includes("завершен") || 
        task.status.toLowerCase().includes("done")
      );
    }
    
    if (filter === "in-progress") {
      return tasks.filter(task => 
        task.status.toLowerCase().includes("процесс") || 
        task.status.toLowerCase().includes("progress")
      );
    }
    
    return tasks;
  };

  const filteredTasks = filterTasks(tasks);
  const allCount = tasks.length;
  const inProgressCount = tasks.filter(task => 
    task.status.toLowerCase().includes("процесс") || 
    task.status.toLowerCase().includes("progress")
  ).length;
  const doneCount = tasks.filter(task => 
    task.status.toLowerCase().includes("завершен") || 
    task.status.toLowerCase().includes("done")
  ).length;

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes("завершен") || normalizedStatus.includes("done")) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (normalizedStatus.includes("процесс") || normalizedStatus.includes("progress")) {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  };


  const TaskList = ({ tasks }: { tasks: Task[] }) => (
    <div className="space-y-4 mt-6">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Задачи не найдены</p>
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start gap-3">
              {getStatusIcon(task.status)}
              <div className="flex-1">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                {task.description && (
                  <CardDescription className="mt-2">
                    {task.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Статус:</span>
                <span className="font-medium">{task.status}</span>
              </div>
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
                  <span>{task.completionDate}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        ))
      )}
    </div>
  );

  return (
    <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as typeof filter)}>
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
  );
};

export default TaskTracker;
