import { useState, useRef, useEffect } from "react";
import { statusConfig, type LeadStatus } from "@/data/mockData";
import { ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const pipelineOrder: LeadStatus[] = ['nouveau', 'contacté', 'qualifié', 'proposition', 'négociation', 'gagné', 'perdu'];

interface InlineStatusSelectProps {
  status: LeadStatus;
  onStatusChange?: (newStatus: LeadStatus) => void;
  compact?: boolean;
}

export function InlineStatusSelect({ status, onStatusChange, compact }: InlineStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const config = statusConfig[status];
  const currentIndex = pipelineOrder.indexOf(status);
  const nextStatus = currentIndex < 5 && status !== 'perdu' ? pipelineOrder[currentIndex + 1] : null;

  const handleSelect = (newStatus: LeadStatus) => {
    onStatusChange?.(newStatus);
    setOpen(false);
    toast.success(`Statut → ${statusConfig[newStatus].label}`);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all hover:ring-2 hover:ring-current/20 ${config.bgClass}`}
        >
          {config.label}
        </button>
        {nextStatus && !compact && (
          <button
            onClick={(e) => { e.stopPropagation(); handleSelect(nextStatus); }}
            className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            title={`Avancer vers ${statusConfig[nextStatus].label}`}
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 bg-popover border rounded-lg shadow-lg p-1 min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            {pipelineOrder.map((s) => {
              const c = statusConfig[s];
              const isActive = s === status;
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/60'}`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `hsl(var(--tag-${c.color.replace('tag-', '')}))` }}
                  />
                  <span className="flex-1 text-left">{c.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
