import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Recherche rapide" },
  { keys: ["?"], description: "Raccourcis clavier" },
  { keys: ["N"], description: "Nouveau lead" },
  { keys: ["1"], description: "Tableau de bord" },
  { keys: ["2"], description: "Leads" },
  { keys: ["3"], description: "Pipeline" },
  { keys: ["4"], description: "Carte" },
  { keys: ["5"], description: "Calendrier" },
  { keys: ["6"], description: "Rapports" },
  { keys: ["Esc"], description: "Fermer le panneau" },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-muted-foreground" />
            Raccourcis clavier
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-1">
              <span className="text-sm">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 rounded bg-muted border text-xs font-mono font-medium min-w-[24px] text-center">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">?</kbd> à tout moment
        </p>
      </DialogContent>
    </Dialog>
  );
}
