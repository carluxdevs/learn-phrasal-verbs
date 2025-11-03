import { PhrasalVerbsTable } from "@/components/PhrasalVerbsTable";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Phrasal Verbs Learning Tool
          </h1>
          <p className="text-muted-foreground">
            Master English phrasal verbs with AI-powered translations
          </p>
        </header>
        
        <PhrasalVerbsTable />
      </div>
    </div>
  );
};

export default Index;
