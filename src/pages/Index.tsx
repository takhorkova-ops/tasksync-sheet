import TaskTracker from "@/components/TaskTracker";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Трекер задач</h1>
          <p className="mt-2 text-muted-foreground">
            Данные загружаются из Google Sheets в реальном времени
          </p>
        </header>
        <TaskTracker />
      </div>
    </div>
  );
};

export default Index;
