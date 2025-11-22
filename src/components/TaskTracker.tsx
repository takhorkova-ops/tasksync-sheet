import { useMemo, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, AlertCircle, Calendar, ArrowUpDown, Trash2 } from "lucide-react";
import TaskDialog from "./TaskDialog";
import { useTasks, Task } from "@/hooks/useTasks";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const TaskTracker = () => {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask } = useTasks();
  const [filter, setFilter] = useState<"all" | "in-progress" | "done">("all");
  const [sortByDate, setSortByDate] = useState(false);

  const filterTasks = (tasks: Task[]) => {
    let filtered = tasks;

    if (filter === "in-progress") {
      filtered = tasks.filter((task) => task.status === "В процессе");
    } else if (filter === "done") {
      filtered = tasks.filter((task) => task.status === "Выполнено");
    }

    if (sortByDate) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.completion_date ? new Date(a.completion_date).getTime() : 0;
        const dateB = b.completion_date ? new Date(b.completion_date).getTime() : 0;
        return dateA - dateB;
      });
    }

    return filtered;
  };

  const isOverdue = (completionDate: string | null, status: string): boolean => {
    if (!completionDate || status === "Выполнено") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(completionDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getStatusBadge = (status: string, completionDate: string | null) => {
    const overdue = isOverdue(completionDate, status);

    if (status === "Выполнено") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Выполнено
        </Badge>
      );
    }

    if (overdue) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Просрочено
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        В процессе
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Не указана";
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: ru });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Ошибка загрузки задач</p>
        </CardContent>
      </Card>
    );
  }

  const filteredTasks = filterTasks(tasks || []);
  const inProgressCount = tasks?.filter((t) => t.status === "В процессе").length || 0;
  const doneCount = tasks?.filter((t) => t.status === "Выполнено").length || 0;



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Мои задачи</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSortByDate(!sortByDate)}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortByDate ? "По дате" : "По умолчанию"}
          </Button>
          <TaskDialog
            mode="create"
            onSave={(data) => createTask.mutate(data)}
          />
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Все ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="in-progress">В процессе ({inProgressCount})</TabsTrigger>
          <TabsTrigger value="done">Выполнено ({doneCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <TaskList
            tasks={filteredTasks}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            onUpdate={(id, data) => updateTask.mutate({ id, ...data })}
            onDelete={(id) => deleteTask.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TaskListProps {
  tasks: Task[];
  getStatusBadge: (status: string, completionDate: string | null) => JSX.Element;
  formatDate: (date: string | null) => string;
  onUpdate: (id: string, data: Omit<Task, "id" | "creation_date">) => void;
  onDelete: (id: string) => void;
}

const TaskList = memo(({ tasks, getStatusBadge, formatDate, onUpdate, onDelete }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Нет задач в этой категории
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
              {getStatusBadge(task.status, task.completion_date)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {task.description}
              </p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Начало: {formatDate(task.start_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Завершение: {formatDate(task.completion_date)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <TaskDialog
                mode="edit"
                task={task}
                onSave={(data) => onUpdate(task.id, data)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

TaskList.displayName = "TaskList";

export default TaskTracker;
