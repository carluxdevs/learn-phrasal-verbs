import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PREPOSITIONS = [
  "About", "Across", "After", "Along", "Around", "Away", "Back", "By", "Down", "For", 
  "Forward", "In", "Into", "Off", "On", "Out", "Over", "Up", "Up with", "With"
];

const INITIAL_VERBS = [
  { verb: "Ask", meanings: ["Preguntar por","","","","","","","","","Pedir salir","","","","","","","","","",""] },
  { verb: "Back", meanings: ["","","","","","","","","Echarse atrás","","","","","Alejarse","","Retirarse","","Apoyar/Respaldar","",""] },
  { verb: "Be", meanings: ["Tratar de/Estar a punto de","","","","","Estar fuera","","","Estar deprimido","Ir tras algo","","Estar en casa","","Irse","Estar encendido","","Haber terminado","Estar despierto","","Estar enfermo de"] },
  { verb: "Blow", meanings: ["","","","","","","","","","","","","","Soplar/Apagar","","Explotar","","Explotar","",""] },
  { verb: "Break", meanings: ["","","","","","","","","Averiarse","","","Interrumpir","Irrumpir","","","Estallar/Repartir","","Terminar (relación)","",""] },
  { verb: "Bring", meanings: ["Causar/Provocar","","","","","Devolver","Traer de vuelta","","Bajar/Reducir","","","","","","","","","Mencionar/Criar","",""] },
  { verb: "Bump", meanings: ["","Encontrarse con","","","","","","Visitar","","","","","","Chocarse con","","","","","",""] },
  { verb: "Call", meanings: ["","","","","","","Devolver llamada","","","Pedir/Requerir","","Visitar/Pasarse","","Cancelar/Suspender","Visitar","Gritar","","","",""] },
  { verb: "Carry", meanings: ["","","","Continuar","","","","","","","","","","","Continuar","Llevar a cabo","","","",""] },
  { verb: "Check", meanings: ["","","","","","","","","","","","Registrarse","","Verificar/Dejar hotel","","Investigar","","","",""] },
  { verb: "Come", meanings: ["Acercarse","","Encontrarse con","","Aparecer/Avanzar","","","Regresar","","Bajar","","","Entrar","Toparse con","Desprenderse","¡Vamos!","Salir","Visitar/Venir","Subir/Surgir","Toparse con",""] },
  { verb: "Cut", meanings: ["","","","","","","","","Reducir","","","Interrumpir","","Cortar/Aislar","","Recortar/Dejar de","","","",""] },
  { verb: "Do", meanings: ["","","","","","","","","Abrochar (cremallera)","","","","","","","","","Maquillar/Preparar","",""] },
  { verb: "Drop", meanings: ["","","","","","Dejar algo","","Visitar","Dejar (a alguien)","","","","","Dejar a alguien","","","","Abandonar (estudios)","",""] },
  { verb: "Fill", meanings: ["","","","","","","","","","","","Rellenar (formulario)","","","","Rellenar (espacio)","","Rellenar/Llenar","",""] },
  { verb: "Find", meanings: ["","","","","","","","","","","","","","","Averiguar/Descubrir","","","","",""] },
  { verb: "Get", meanings: ["Andar por ahí/Moverse","","","Llevarse bien","Moverse/Viajar","Deshacerse de","Regresar","","Bajar/Deprimir","","","Entrar","","Bajar (transporte)","Subir (transporte)","Salir","Recuperarse/Superar","Levantarse","","Llevarse bien"] },
  { verb: "Give", meanings: ["","","","","","Regalar","Devolver","","Derrumbarse","","","Ceder","","","","Repartir","Repasar","Rendirse/Abandonar","",""] },
  { verb: "Go", meanings: ["Hacer/Emprender","","","","Circular/Repartir","Irse","Volver/Regresar","","Bajar","Ir a buscar","","Entrar","Revisar","Explotar/Deteriorarse","Continuar/Suceder","Salir","Repasar/Revisar","Subir/Aumentar","",""] },
  { verb: "Grow", meanings: ["","","","","","","","","Disminuir","","","","","","","","","Crecer/Madurar","",""] },
  { verb: "Hang", meanings: ["Rondar/Merodear","","","","","","Esperar/Devolver","","","","","Entregar","","Colgar/Cortar (telf.)","Continuar","Pasar el rato","","","",""] },
  { verb: "Hold", meanings: ["","","","","","","Devolver","","Retrasar","","","Contener/Caber","","","Esperar","","","Sostener","",""] },
  { verb: "Keep", meanings: ["","","","Llevarse bien","","Mantener alejado","Retener/Devolver","","Apuntar (datos)","Buscar","","","","Alejar","Continuar","Ocultar","Superar","","Mantener el ritmo",""] },
  { verb: "Look", meanings: ["","","Cuidar (niños, mascotas)","","Buscar","","Recordar","","Despreciar","Buscar","","Examinar/Investigar","Examinar/Investigar","","Observar/Cuidar","Tener cuidado","Pasar por alto","Buscar (info.)","Esperar","Esperar con ansias"] },
  { verb: "Make", meanings: ["","","","","","Irse","","","","","","","","","","Entender","","Inventar/Hacer las paces","",""] },
  { verb: "Pass", meanings: ["","","","","","Repartir","","","","","","","","Desmayarse","","Desmayarse/Repartir","","","",""] },
  { verb: "Pick", meanings: ["","","","","","","","","","","","","","","","","","Recoger/Mejorar","",""] },
  { verb: "Point", meanings: ["","","","","","","","","","","","","","","Señalar/Destacar","","","","",""] },
  { verb: "Put", meanings: ["","","","","","Guardar/Ordenar","Devolver","","Bajar/Apuntar","","","Meter/Insertar","","Posponer/Desalentar","Ponerse (ropa)","Apagar (fuego)/Publicar","Superar/Tolerar","Subir/Alojar","",""] },
  { verb: "Run", meanings: ["","Encontrarse con","Perseguir","","","Huir","","","Atropellar","","","Entrar","Estrellarse","Irse","","Agotarse/Acabarse","Revisar","","",""] },
  { verb: "Set", meanings: ["Emprender","","","","","","","","","","","Instalarse","","","Empezar (viaje)","Exponer/Partir","Superar/Recuperarse","Establecer/Montar","",""] },
  { verb: "Show", meanings: ["","","","","","","","","","","","","","Presumir","","Aparecer/Llegar","","Aparecer/Llegar","",""] },
  { verb: "Sit", meanings: ["","","","","","","Apoyar","","Sentarse","","","","","","","","","","",""] },
  { verb: "Stand", meanings: ["","","","","","","Apoyar/Respaldar","","","","","Sustituir","","","","Destacar/Sobresalir","","Levantarse","Aguantar","Soportar"] },
  { verb: "Take", meanings: ["","","","","","Quitarse/Despegar","Retirar/Devolver","","Apuntar/Anotar","","","Engañar/Absorber","","Despegar/Quitarse","","Salir","Tomar el control","Empezar (hobby)","",""] },
  { verb: "Turn", meanings: ["","","","","","Rechazar","Volverse","","Bajar (volumen)/Rechazar","","","Entregar","Convertirse en","Apagar","Encender","Resultar/Irse","","Subir (volumen)/Aparecer","",""] },
];

interface VerbData {
  verb: string;
  meanings: string[];
}

export const usePhrasalVerbs = (userId: string | undefined) => {
  const [verbs, setVerbs] = useState<VerbData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Normalize meanings length to match PREPOSITIONS
  const normalizeMeanings = (arr: string[]): string[] => {
    if (arr.length === PREPOSITIONS.length) return arr;
    if (arr.length === PREPOSITIONS.length - 1 && PREPOSITIONS[0] === "About") {
      return ["", ...arr];
    }
    if (arr.length < PREPOSITIONS.length) {
      return [...arr, ...Array(PREPOSITIONS.length - arr.length).fill("")];
    }
    return arr.slice(0, PREPOSITIONS.length);
  };

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

        // If no verbs exist, initialize with default data
        if (!data || data.length === 0) {
          const { error: insertError } = await supabase
            .from("phrasal_verbs")
            .insert(
              INITIAL_VERBS.map(v => ({
                user_id: userId,
                verb: v.verb,
                meanings: v.meanings,
              }))
            );

          if (insertError) throw insertError;

          setVerbs(INITIAL_VERBS);
        } else {
          const loadedVerbs: VerbData[] = data.map((item) => ({
            verb: item.verb,
            meanings: normalizeMeanings(item.meanings as string[]),
          }));

          setVerbs(loadedVerbs);
        }
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
