import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PREPOSITIONS = [
  "Across", "Along", "Around", "Away", "Back", "By", "Down", "For", 
  "In", "Into", "Off", "On", "Out", "Over", "Up", "With"
];

interface VerbData {
  verb: string;
  meanings: string[];
}

export const usePhrasalVerbs = (userId: string | undefined) => {
  const [verbs, setVerbs] = useState<VerbData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load verbs from database
  useEffect(() => {
    if (!userId) return;

    const loadVerbs = async () => {
      try {
        const { data, error } = await supabase
          .from("phrasal_verbs")
          .select("*")
          .eq("user_id", userId)
          .order("verb");

        if (error) throw error;

        const loadedVerbs: VerbData[] = data.map((item) => ({
          verb: item.verb,
          meanings: item.meanings as string[],
        }));

        setVerbs(loadedVerbs);
      } catch (error: any) {
        console.error("Error loading verbs:", error);
        toast({
          title: "Error",
          description: "Failed to load phrasal verbs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadVerbs();
  }, [userId, toast]);

  // Save verb to database
  const saveVerb = useCallback(
    async (verb: string, meanings: string[]) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("phrasal_verbs")
          .upsert({
            user_id: userId,
            verb,
            meanings,
          }, {
            onConflict: "user_id,verb"
          });

        if (error) throw error;
      } catch (error: any) {
        console.error("Error saving verb:", error);
        toast({
          title: "Error",
          description: "Failed to save changes",
          variant: "destructive",
        });
      }
    },
    [userId, toast]
  );

  // Delete verb from database
  const deleteVerb = useCallback(
    async (verb: string) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("phrasal_verbs")
          .delete()
          .eq("user_id", userId)
          .eq("verb", verb);

        if (error) throw error;
      } catch (error: any) {
        console.error("Error deleting verb:", error);
        toast({
          title: "Error",
          description: "Failed to delete verb",
          variant: "destructive",
        });
      }
    },
    [userId, toast]
  );

  return {
    verbs,
    setVerbs,
    loading,
    saveVerb,
    deleteVerb,
    PREPOSITIONS,
  };
};
