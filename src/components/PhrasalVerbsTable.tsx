import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Save, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Prepositions in alphabetical order
const PREPOSITIONS = [
  "Across", "Along", "Around", "Away", "Back", "By", "Down", "For", 
  "In", "Into", "Off", "On", "Out", "Over", "Up", "With"
];

// Initial data from the example
const INITIAL_VERBS = [
  { verb: "Ask", meanings: ["","","","","","","Pedir salir","","","","","","","","",""] },
  { verb: "Back", meanings: ["","","","","","","Echarse atrás","","","","Alejarse","","Retirarse","","Apoyar/Respaldar",""] },
  { verb: "Be", meanings: ["","","","Estar fuera","","","Estar deprimido","Ir tras algo","Estar en casa","","Irse","Estar encendido","","Haber terminado","Estar despierto","Estar enfermo de"] },
  { verb: "Blow", meanings: ["","","","","","","","","","","Soplar/Apagar","","Explotar","","Explotar",""] },
  { verb: "Break", meanings: ["","","","","","","Averiarse","","Interrumpir","Irrumpir","","","Estallar/Repartir","","Terminar (relación)",""] },
  { verb: "Bring", meanings: ["","","","Devolver","Traer de vuelta","","Bajar/Reducir","","","","","","","","Mencionar/Criar",""] },
  { verb: "Bump", meanings: ["Encontrarse con","","","","","Visitar","","","","Chocarse con","","","","","","Chocarse"] },
  { verb: "Call", meanings: ["","","","","Devolver llamada","","","Pedir/Requerir","Visitar/Pasarse","","Cancelar/Suspender","Visitar","Gritar","","",""] },
  { verb: "Carry", meanings: ["","Continuar","","","","","","","","","","","Continuar","Llevar a cabo","",""] },
  { verb: "Check", meanings: ["","","","","","","","","Registrarse","","Verificar/Dejar hotel","","Investigar","","",""] },
  { verb: "Come", meanings: ["Encontrarse con","Aparecer/Avanzar","","Separarse/Desprenderse","Regresar","","Bajar","","Entrar","Toparse con","Desprenderse","¡Vamos!","Salir","Visitar/Venir","Subir/Surgir",""] },
  { verb: "Cut", meanings: ["","","","","","","Reducir","","Interrumpir","","Cortar/Aislar","","Recortar/Dejar de","","",""] },
  { verb: "Do", meanings: ["","","","","","","Abrochar (cremallera)","","","","","","","","Maquillar/Preparar",""] },
  { verb: "Drop", meanings: ["","","","Dejar algo","","Visitar","Dejar (a alguien)","","","","","","","","Abandonar (estudios)",""] },
  { verb: "Fill", meanings: ["","","","","","","","","Rellenar (formulario)","","","","Rellenar (espacio)","","Rellenar/Llenar",""] },
  { verb: "Find", meanings: ["","","","","","","","","","","","","Averiguar/Descubrir","","",""] },
  { verb: "Get", meanings: ["","Llevarse bien","","Deshacerse de","Regresar","","Bajar/Deprimir","","Entrar","","Bajar (transporte)","Subir (transporte)","Salir","Recuperarse/Superar","Levantarse","Llevarse bien"] },
  { verb: "Give", meanings: ["","","","Regalar","Devolver","","Derrumbarse","","Ceder","","","","Repartir","Repasar","Rendirse/Abandonar",""] },
  { verb: "Go", meanings: ["","","","Irse","Volver/Regresar","","Bajar","","Entrar","","Explotar/Deteriorarse","Continuar/Suceder","Salir","Repasar/Revisar","Subir/Aumentar",""] },
  { verb: "Grow", meanings: ["","","","","","","","","","","","","","","Crecer/Madurar",""] },
  { verb: "Hang", meanings: ["","","","","Esperar/Devolver","","","","Entregar","","Colgar/Cortar (telf.)","Continuar","Pasar el rato","","",""] },
  { verb: "Hold", meanings: ["","","","","Devolver","","Retrasar","","Contener/Caber**","","Despegar (Avión)","Esperar","","","Sostener",""] },
  { verb: "Keep", meanings: ["","Llevarse bien","","Mantener alejado","Retener/Devolver","","Apuntar (datos)","Buscar","","","Alejar","Continuar","Ocultar","Superar","",""] },
  { verb: "Look", meanings: ["across","","Buscar","","Recordar","","Despreciar","Buscar","Examinar/Investigar","Examinar/Investigar","","Observar/Cuidar","Tener cuidado","","Buscar (info.)","Esperar con ansias"] },
  { verb: "Make", meanings: ["","","","Irse","","","","","","","","","Entender","","Inventar/Hacer las paces",""] },
  { verb: "Pass", meanings: ["","","","Repartir","","","Desmayarse","","","","Desmayarse","","Desmayarse/Repartir","","",""] },
  { verb: "Pay", meanings: ["","","","Pagar","Devolver (dinero)","","","","","","","","Pagar (en efectivo)","","Pagar todo",""] },
  { verb: "Pick", meanings: ["","","","","","","","","","","","","","","Recoger/Mejorar",""] },
  { verb: "Point", meanings: ["","","","","","","","","","","","","Señalar/Destacar","","",""] },
  { verb: "Put", meanings: ["","","","Guardar/Ordenar","Devolver","","Bajar/Apuntar","","Meter/Insertar","","Posponer/Desalentar","Ponerse (ropa)","Apagar (fuego)/Publicar","Superar/Tolerar","Subir/Alojar",""] },
  { verb: "Run", meanings: ["Encontrarse con","","","Huir","","","Atropellar","","Entrar","Estrellarse","Irse","","Agotarse/Acabarse","Revisar","",""] },
  { verb: "Set", meanings: ["","","","","","","","","Instalarse","","","Empezar (viaje)","Exponer/Partir","Superar/Recuperarse","Establecer/Montar",""] },
  { verb: "Show", meanings: ["","","","","","","","","","","Presumir","","Aparecer/Llegar","","Aparecer/Llegar",""] },
  { verb: "Sit", meanings: ["","","","","Apoyar","","Sentarse","","","","","","","","",""] },
  { verb: "Take", meanings: ["","","","Quitarse/Despegar","Retirar/Devolver","","Apuntar/Anotar","","Engañar/Absorber","","Despegar/Quitarse","","Salir","Tomar el control","Empezar (hobby)",""] },
  { verb: "Turn", meanings: ["","","","Rechazar","Volverse","","Bajar (volumen)/Rechazar","","Entregar","Convertirse en","Apagar","Encender","Resultar/Irse","","Subir (volumen)/Aparecer",""] },
];

interface VerbData {
  verb: string;
  meanings: string[];
}

export const PhrasalVerbsTable = () => {
  const [verbs, setVerbs] = useState<VerbData[]>(INITIAL_VERBS);
  const [editingVerb, setEditingVerb] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ verb: string; prepIndex: number } | null>(null);
  const [newVerb, setNewVerb] = useState("");
  const [isAddingVerb, setIsAddingVerb] = useState(false);
  const [loadingTranslations, setLoadingTranslations] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const { toast } = useToast();

  const handleAddVerb = async () => {
    if (!newVerb.trim()) {
      toast({
        title: "Error",
        description: "Please enter a verb name",
        variant: "destructive",
      });
      return;
    }

    // Check if verb already exists
    if (verbs.some(v => v.verb.toLowerCase() === newVerb.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This verb already exists",
        variant: "destructive",
      });
      return;
    }

    setIsAddingVerb(true);
    const newVerbData: VerbData = {
      verb: newVerb.trim(),
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
      const key = `${newVerb.trim()}-${i}`;
      setLoadingTranslations(prev => new Set(prev).add(key));
      
      try {
        const { data, error } = await supabase.functions.invoke('translate-phrasal-verb', {
          body: { 
            verb: newVerb.trim(), 
            preposition: PREPOSITIONS[i].toLowerCase() 
          }
        });

        if (error) throw error;
        translations[i] = data.translation || "";
      } catch (error) {
        console.error(`Error translating ${newVerb} ${PREPOSITIONS[i]}:`, error);
        translations[i] = "";
      } finally {
        setLoadingTranslations(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    }

    // Update with translations
    newVerbData.meanings = translations;
    const finalVerbs = updatedVerbs.map(v => 
      v.verb === newVerb.trim() ? newVerbData : v
    );
    setVerbs(finalVerbs);
    setNewVerb("");
    setIsAddingVerb(false);

    toast({
      title: "Success",
      description: "Verb added with translations",
    });
  };

  const handleDeleteVerb = (verb: string) => {
    setVerbs(verbs.filter(v => v.verb !== verb));
    toast({
      title: "Deleted",
      description: `${verb} has been removed`,
    });
  };

  const handleEditCell = (verb: string, prepIndex: number, newValue: string) => {
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
    if (!newVerbName.trim()) return;
    
    setVerbs(verbs.map(v => 
      v.verb === oldVerb ? { ...v, verb: newVerbName.trim() } : v
    ).sort((a, b) => a.verb.localeCompare(b.verb)));
    
    setEditingVerb(null);
    toast({
      title: "Updated",
      description: "Verb name changed",
    });
  };

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
                className={`transition-colors ${
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
                        <span className="text-sm">{meaning || "-"}</span>
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
