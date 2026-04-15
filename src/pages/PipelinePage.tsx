import { useState } from "react";
import { statusConfig, type LeadStatus } from "@/data/mockData";
import { useLeads, type Lead } from "@/contexts/LeadsContext";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { LeadScoreBadge } from "@/components/crm/LeadScoreBadge";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { Euro, Home, Clock, ChevronRight, GripVertical, Phone, Mail } from "lucide-react";
import { daysSince } from "@/lib/dates";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const pipelineStages: LeadStatus[] = ['nouveau', 'contacté', 'qualifié', 'proposition', 'négociation', 'gagné', 'perdu'];

export default function PipelinePage() {
  const { leads, updateLeadStatus } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  const totalBudget = leads.reduce((s, l) => s + l.budget, 0);
  const activeBudget = leads.filter(l => !['gagné', 'perdu'].includes(l.status)).reduce((s, l) => s + l.budget, 0);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      const lead = leads.find(l => l.id === draggedLeadId);
      updateLeadStatus(draggedLeadId, targetStage);
      if (lead) {
        toast.success(`${lead.firstName} ${lead.lastName} → ${statusConfig[targetStage].label}`);
      }
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const advanceLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const idx = pipelineStages.indexOf(lead.status);
    if (idx < 5 && lead.status !== 'perdu') {
      const next = pipelineStages[idx + 1];
      updateLeadStatus(leadId, next);
      toast.success(`${lead.firstName} ${lead.lastName} → ${statusConfig[next].label}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Glissez-déposez pour changer le statut • Pipeline actif : {activeBudget.toLocaleString('fr-FR')} € • Total : {totalBudget.toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {pipelineStages.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage);
          const stageBudget = stageLeads.reduce((s, l) => s + l.budget, 0);
          const percentage = totalBudget > 0 ? (stageBudget / totalBudget) * 100 : 0;
          const isDragOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-[280px] transition-all duration-200 ${isDragOver ? 'scale-[1.01]' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={stage} />
                    <span className="text-xs text-muted-foreground font-medium">{stageLeads.length}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{stageBudget.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: `hsl(var(--tag-${statusConfig[stage].color.replace('tag-', '')}))`,
                    }}
                  />
                </div>
              </div>

              <div
                className={`space-y-2 min-h-[80px] rounded-xl p-1 transition-colors duration-200 ${isDragOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-dashed' : ''}`}
              >
                {stageLeads.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                    {isDragOver ? 'Déposez ici' : 'Aucun lead'}
                  </div>
                )}
                {stageLeads.map(lead => {
                  const daysInStage = daysSince(lead.lastContact);
                  const isStale = daysInStage > 7 && !['gagné', 'perdu'].includes(stage);
                  const isDragging = draggedLeadId === lead.id;
                  const canAdvance = pipelineStages.indexOf(stage) < 5 && stage !== 'perdu';

                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={() => { setDraggedLeadId(null); setDragOverStage(null); }}
                      onClick={() => setSelectedLead(lead)}
                      className={`bg-card border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/20 transition-all group/card ${isStale ? 'border-tag-lost/30' : ''} ${isDragging ? 'opacity-40 scale-95' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {lead.firstName[0]}{lead.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{lead.city}</p>
                          </div>
                        </div>
                        <LeadScoreBadge score={lead.score} />
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><Home className="w-3 h-3" />{lead.houseModel}</span>
                        <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{lead.budget.toLocaleString('fr-FR')} €</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1">
                          {lead.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-medium">{tag}</span>
                          ))}
                        </div>
                        <span className={`flex items-center gap-0.5 text-[9px] ${isStale ? 'text-tag-lost font-medium' : 'text-muted-foreground'}`}>
                          <Clock className="w-2.5 h-2.5" /> {daysInStage}j
                        </span>
                      </div>

                      {/* Quick actions on hover */}
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-transparent group-hover/card:border-border transition-colors opacity-0 group-hover/card:opacity-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`tel:${lead.phone.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()} className="w-6 h-6 rounded-md hover:bg-tag-won/10 flex items-center justify-center">
                              <Phone className="w-3 h-3 text-tag-won" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">Appeler</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="w-6 h-6 rounded-md hover:bg-primary/10 flex items-center justify-center">
                              <Mail className="w-3 h-3 text-primary" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">Email</TooltipContent>
                        </Tooltip>
                        {canAdvance && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); advanceLead(lead.id); }}
                                className="ml-auto flex items-center gap-0.5 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium transition-colors"
                              >
                                Avancer <ChevronRight className="w-3 h-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              Passer en {statusConfig[pipelineStages[pipelineStages.indexOf(stage) + 1]].label}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
