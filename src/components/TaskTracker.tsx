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
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
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
    id: row[0] || `task-${index}`,
    title: row[1] || "Без названия",
    status: row[2] || "Не указан",
    priority: row[3] || "Средний",
    assignee: row[4] || "Не назначен",
    dueDate: row[5] || "",
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

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" => {
    const normalizedPriority = priority.toLowerCase();
    if (normalizedPriority.includes("высок") || normalizedPriority.includes("high")) {
      return "destructive";
    }
    if (normalizedPriority.includes("средн") || normalizedPriority.includes("medium")) {
      return "default";
    }
    return "secondary";
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
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getStatusIcon(task.status)}
                <div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Исполнитель: {task.assignee}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={getPriorityVariant(task.priority)}>
                {task.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Статус: {task.status}</span>
              {task.dueDate && (
                <span className="text-muted-foreground">Срок: {task.dueDate}</span>
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
