import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { leads } from "@/data/mockData";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { User, MapPin, Home, Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface CommandSearchProps {
  onSelectLead?: (lead: typeof leads[0]) => void;
}

export function CommandSearch({ onSelectLead }: CommandSearchProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative hidden md:flex items-center gap-2 px-3 h-9 w-72 rounded-lg bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Rechercher un lead...</span>
        <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher un lead, une ville, un modèle..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          <CommandGroup heading="Leads">
            {leads.map(lead => (
              <CommandItem
                key={lead.id}
                value={`${lead.firstName} ${lead.lastName} ${lead.city} ${lead.email} ${lead.houseModel}`}
                onSelect={() => {
                  setOpen(false);
                  if (onSelectLead) {
                    onSelectLead(lead);
                  } else {
                    navigate("/leads");
                  }
                }}
                className="flex items-center gap-3 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}</span>
                    <span className="flex items-center gap-1"><Home className="w-3 h-3" />{lead.houseModel}</span>
                  </div>
                </div>
                <StatusBadge status={lead.status} />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => { setOpen(false); navigate("/"); }}>
              Tableau de bord
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/leads"); }}>
              Liste des leads
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/pipeline"); }}>
              Pipeline
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/carte"); }}>
              Carte
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/calendrier"); }}>
              Calendrier
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/rapports"); }}>
              Rapports
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
