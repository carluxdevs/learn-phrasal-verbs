import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, X, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePhrasalVerbs } from "./usePhrasalVerbs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { z } from "zod";

const verbSchema = z.object({
  verb: z.string()
    .trim()
    .min(1, "Verb name is required")
    .max(50, "Verb name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed"),
});

const meaningSchema = z.string().max(200, "Meaning must be less than 200 characters");

interface PhrasalVerbsTableProps {
  userId: string;
}

export const PhrasalVerbsTable = ({ userId }: PhrasalVerbsTableProps) => {
  const { verbs, setVerbs, loading, saveVerb, deleteVerb, PREPOSITIONS } = usePhrasalVerbs(userId);
  const [editingVerb, setEditingVerb] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ verb: string; prepIndex: number } | null>(null);
  const [newVerb, setNewVerb] = useState("");
  const [isAddingVerb, setIsAddingVerb] = useState(false);
  const [loadingTranslations, setLoadingTranslations] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [exampleSentences, setExampleSentences] = useState<Record<string, string>>({});
  const [loadingExamples, setLoadingExamples] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchExampleSentence = async (verb: string, preposition: string, meaning: string) => {
    const key = `${verb}-${preposition}`;
    
    if (exampleSentences[key] || loadingExamples.has(key) || !meaning) {
      return;
    }

    setLoadingExamples(prev => new Set(prev).add(key));

    try {
      const { data, error } = await supabase.functions.invoke('generate-example-sentence', {
        body: { verb, preposition, meaning }
      });

      if (error) throw error;

      setExampleSentences(prev => ({
        ...prev,
        [key]: data.example || 'No example available'
      }));
    } catch (error) {
      console.error('Error fetching example:', error);
      setExampleSentences(prev => ({
        ...prev,
        [key]: 'Error loading example'
      }));
    } finally {
      setLoadingExamples(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // Auto-save when meanings change
  useEffect(() => {
    const timer = setTimeout(() => {
      verbs.forEach((verb) => {
        saveVerb(verb.verb, verb.meanings);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [verbs, saveVerb]);

  const handleAddVerb = async () => {
    // Validate verb input
    const validation = verbSchema.safeParse({ verb: newVerb });
    if (!validation.success) {
      toast({
        title: "Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const trimmedVerb = validation.data.verb;

    // Check if verb already exists
    if (verbs.some(v => v.verb.toLowerCase() === trimmedVerb.toLowerCase())) {
      toast({
        title: "Error",
        description: "This verb already exists",
        variant: "destructive",
      });
      return;
    }

    setIsAddingVerb(true);
    const newVerbData = {
      verb: trimmedVerb,
      meanings: new Array(PREPOSITIONS.length).fill(""),
    };

    // Add the verb first
    const updatedVerbs = [...verbs, newVerbData].sort((a, b) => 
      a.verb.localeCompare(b.verb)
    );
    setVerbs(updatedVerbs);

    // Fetch translations for all prepositions
    const translations: string[] = [];
    for (let i = 0; i < PREPOSITIONS.length; i++) {
      const key = `${trimmedVerb}-${i}`;
      setLoadingTranslations(prev => new Set(prev).add(key));
      
      try {
        const { data, error } = await supabase.functions.invoke('translate-phrasal-verb', {
          body: { 
            verb: trimmedVerb, 
            preposition: PREPOSITIONS[i].toLowerCase() 
          }
        });

        if (error) throw error;
        translations[i] = data.translation || "";
      } catch (error) {
        console.error(`Error translating ${trimmedVerb} ${PREPOSITIONS[i]}:`, error);
        translations[i] = "";
      } finally {
        setLoadingTranslations(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    }

    // Update with translations and save
    newVerbData.meanings = translations;
    const finalVerbs = updatedVerbs.map(v => 
      v.verb === trimmedVerb ? newVerbData : v
    );
    setVerbs(finalVerbs);
    await saveVerb(newVerbData.verb, newVerbData.meanings);
    setNewVerb("");
    setIsAddingVerb(false);

    toast({
      title: "Success",
      description: "Verb added with translations",
    });
  };

  const handleDeleteVerb = async (verb: string) => {
    setVerbs(verbs.filter(v => v.verb !== verb));
    await deleteVerb(verb);
    toast({
      title: "Deleted",
      description: `${verb} has been removed`,
    });
  };

  const handleEditCell = (verb: string, prepIndex: number, newValue: string) => {
    // Validate meaning length
    const validation = meaningSchema.safeParse(newValue);
    if (!validation.success) {
      toast({
        title: "Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setVerbs(verbs.map(v => {
      if (v.verb === verb) {
        const newMeanings = [...v.meanings];
        newMeanings[prepIndex] = newValue;
        return { ...v, meanings: newMeanings };
      }
      return v;
    }));
  };

  const handleRenameVerb = (oldVerb: string, newVerbName: string) => {
    // Validate new verb name
    const validation = verbSchema.safeParse({ verb: newVerbName });
    if (!validation.success) {
      toast({
        title: "Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      setEditingVerb(null);
      return;
    }
    
    const trimmedVerb = validation.data.verb;
    
    setVerbs(verbs.map(v => 
      v.verb === oldVerb ? { ...v, verb: trimmedVerb } : v
    ).sort((a, b) => a.verb.localeCompare(b.verb)));
    
    setEditingVerb(null);
    toast({
      title: "Updated",
      description: "Verb name changed",
    });
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex justify-end gap-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter verb name..."
            value={newVerb}
            onChange={(e) => setNewVerb(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddVerb()}
            className="w-64"
            disabled={isAddingVerb}
          />
          <Button 
            onClick={handleAddVerb}
            disabled={isAddingVerb}
            className="bg-primary hover:bg-primary/90"
          >
            {isAddingVerb ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="ml-2">Add Verb</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
        <table className="w-full border-collapse relative">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 bg-[hsl(var(--table-header))] text-white p-3 text-left font-semibold border border-[hsl(var(--table-border))] min-w-[120px]">
                Verb
              </th>
              {PREPOSITIONS.map((prep, colIndex) => (
                <th
                  key={prep}
                  className={`bg-[hsl(var(--table-header))] text-white p-3 text-center font-semibold border border-[hsl(var(--table-border))] min-w-[150px] transition-all ${
                    hoveredCell?.colIndex === colIndex ? 'brightness-110' : ''
                  }`}
                >
                  {prep}
                </th>
              ))}
              <th className="sticky right-0 z-30 bg-[hsl(var(--table-header))] text-white p-3 text-center font-semibold border border-[hsl(var(--table-border))] min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {verbs.map((verbData, rowIndex) => (
              <tr 
                key={verbData.verb} 
                className={`group transition-colors ${
                  hoveredCell?.rowIndex === rowIndex ? 'bg-[hsl(var(--table-hover))]' : ''
                }`}
              >
                <td className={`sticky left-0 z-10 bg-[hsl(var(--table-cell))] p-3 font-medium border border-[hsl(var(--table-border))] transition-all ${
                  hoveredCell?.rowIndex === rowIndex ? 'bg-[hsl(var(--table-hover))]' : ''
                }`}>
                  {editingVerb === verbData.verb ? (
                    <div className="flex gap-1">
                      <Input
                        defaultValue={verbData.verb}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameVerb(verbData.verb, e.currentTarget.value);
                          } else if (e.key === "Escape") {
                            setEditingVerb(null);
                          }
                        }}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingVerb(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{verbData.verb}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingVerb(verbData.verb)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </td>
                {verbData.meanings.map((meaning, colIndex) => {
                  const cellKey = `${verbData.verb}-${colIndex}`;
                  const isLoading = loadingTranslations.has(cellKey);
                  const isEditing = editingCell?.verb === verbData.verb && editingCell?.prepIndex === colIndex;
                  const isHighlighted = hoveredCell?.rowIndex === rowIndex || hoveredCell?.colIndex === colIndex;
                  
                  return (
                    <td
                      key={colIndex}
                      className={`bg-[hsl(var(--table-cell))] p-3 border border-[hsl(var(--table-border))] text-center cursor-pointer transition-all ${
                        isHighlighted ? 'bg-[hsl(var(--table-hover))]' : ''
                      }`}
                      onClick={() => !isLoading && setEditingCell({ verb: verbData.verb, prepIndex: colIndex })}
                      onMouseEnter={() => setHoveredCell({ rowIndex, colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isLoading ? (
                        <div className="flex justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      ) : isEditing ? (
                        <Input
                          defaultValue={meaning}
                          onBlur={(e) => {
                            handleEditCell(verbData.verb, colIndex, e.target.value);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditCell(verbData.verb, colIndex, e.currentTarget.value);
                              setEditingCell(null);
                            } else if (e.key === "Escape") {
                              setEditingCell(null);
                            }
                          }}
                          className="h-8 text-center"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm">{meaning || "-"}</span>
                          {meaning && (
                            <TooltipProvider>
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                                    onMouseEnter={() => fetchExampleSentence(
                                      verbData.verb, 
                                      PREPOSITIONS[colIndex].toLowerCase(), 
                                      meaning
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  {loadingExamples.has(`${verbData.verb}-${PREPOSITIONS[colIndex].toLowerCase()}`) ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>Generating example...</span>
                                    </div>
                                  ) : (
                                    <div className="text-sm space-y-2">
                                      {exampleSentences[`${verbData.verb}-${PREPOSITIONS[colIndex].toLowerCase()}`]?.split('|').map((sentence, idx) => (
                                        <p key={idx} className={idx === 0 ? 'font-medium' : 'text-muted-foreground'}>
                                          {sentence.trim()}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="sticky right-0 z-10 bg-[hsl(var(--table-cell))] p-3 border border-[hsl(var(--table-border))] text-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteVerb(verbData.verb)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
