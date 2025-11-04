import { supabase } from "@/integrations/supabase/client";

/**
 * Migration utility to update existing verbs with new preposition columns
 * Adds "Up with" (index 15) and "Forward" (index 16) to all existing verbs
 */
export const migrateVerbsToNewPrepositions = async (userId: string) => {
  try {
    // Fetch all existing verbs for the user
    const { data: existingVerbs, error: fetchError } = await supabase
      .from("phrasal_verbs")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) throw fetchError;
    if (!existingVerbs || existingVerbs.length === 0) return;

    // Update each verb to add two new empty positions at indices 15 and 16
    const updates = existingVerbs.map(async (verb) => {
      const currentMeanings = verb.meanings as string[];
      
      // Insert two empty strings at positions 15 and 16 (before the last "With" column)
      const updatedMeanings = [
        ...currentMeanings.slice(0, 15),
        "", // Up with
        "", // Forward
        ...currentMeanings.slice(15)
      ];

      return supabase
        .from("phrasal_verbs")
        .update({ meanings: updatedMeanings })
        .eq("user_id", userId)
        .eq("verb", verb.verb);
    });

    await Promise.all(updates);
    console.log("Migration completed: Added 'Up with' and 'Forward' columns");
  } catch (error) {
    console.error("Error migrating verbs:", error);
    throw error;
  }
};
