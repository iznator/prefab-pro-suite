import { useState } from "react";
import { leads as allLeads, statusConfig, type Lead, type LeadStatus } from "@/data/mockData";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { LeadScoreBadge } from "@/components/crm/LeadScoreBadge";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { Euro, Home, Clock } from "lucide-react";
import { daysSince } from "@/lib/dates";

const pipelineStages: LeadStatus[] = ['nouveau', 'contacté', 'qualifié', 'proposition', 'négociation', 'gagné', 'perdu'];

export default function PipelinePage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const totalBudget = allLeads.reduce((s, l) => s + l.budget, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Visualisation Kanban — Pipeline total : {totalBudget.toLocaleString('fr-FR')} €</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {pipelineStages.map(stage => {
          const stageLeads = allLeads.filter(l => l.status === stage);
          const stageBudget = stageLeads.reduce((s, l) => s + l.budget, 0);
          const percentage = totalBudget > 0 ? (stageBudget / totalBudget) * 100 : 0;
          return (
            <div key={stage} className="flex-shrink-0 w-[280px]">
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={stage} />
                    <span className="text-xs text-muted-foreground font-medium">{stageLeads.length}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{stageBudget.toLocaleString('fr-FR')} €</span>
                </div>
                {/* Progress bar */}
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
              <div className="space-y-2">
                {stageLeads.map(lead => {
                  const daysInStage = daysSince(lead.lastContact);
                  const isStale = daysInStage > 7 && !['gagné', 'perdu'].includes(stage);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`bg-card border rounded-xl p-3.5 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all ${isStale ? 'border-tag-lost/30' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
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
