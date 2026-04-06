import { Search, Inbox, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-results" | "no-data" | "no-filter";
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const defaults = {
  "no-results": {
    icon: Search,
    title: "Aucun résultat",
    description: "Essayez de modifier vos critères de recherche ou vos filtres.",
  },
  "no-data": {
    icon: Inbox,
    title: "Aucune donnée",
    description: "Commencez par ajouter votre premier élément.",
  },
  "no-filter": {
    icon: Filter,
    title: "Aucun lead ne correspond",
    description: "Changez vos filtres pour afficher des résultats.",
  },
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const d = defaults[type];
  const Icon = d.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-display font-semibold text-base mb-1">{title || d.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description || d.description}</p>
      {action && (
        <Button size="sm" className="mt-4 gap-1.5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
