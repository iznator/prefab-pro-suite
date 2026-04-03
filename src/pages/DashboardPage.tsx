import { leads, salesReps, statusConfig, type LeadStatus } from "@/data/mockData";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { LeadScoreBadge } from "@/components/crm/LeadScoreBadge";
import {
  Users, Euro, TrendingUp, Home, ArrowUpRight, ArrowDownRight,
  Plus, Target, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { relativeDate } from "@/lib/dates";

export default function DashboardPage() {
  const navigate = useNavigate();
  const totalLeads = leads.length;
  const totalBudget = leads.reduce((sum, l) => sum + l.budget, 0);
  const wonLeads = leads.filter(l => l.status === 'gagné');
  const newLeads = leads.filter(l => l.status === 'nouveau');
  const avgScore = Math.round(leads.reduce((s, l) => s + l.score, 0) / totalLeads);
  const conversionRate = Math.round((wonLeads.length / totalLeads) * 100);

  const pipelineCounts = Object.entries(statusConfig).map(([key, config]) => ({
    status: key as LeadStatus,
    ...config,
    count: leads.filter(l => l.status === key).length,
    budget: leads.filter(l => l.status === key).reduce((s, l) => s + l.budget, 0),
  }));

  const recentLeads = [...leads].sort((a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime()).slice(0, 5);

  // Source breakdown
  const sourceMap = new Map<string, number>();
  leads.forEach(l => sourceMap.set(l.source, (sourceMap.get(l.source) || 0) + 1));
  const sources = Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(...sources.map(s => s[1]));

  // Hot leads (score > 70, not won/lost)
  const hotLeads = leads.filter(l => l.score >= 70 && !['gagné', 'perdu'].includes(l.status)).sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de votre activité commerciale</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground" onClick={() => navigate('/leads')}>
          <Plus className="w-3.5 h-3.5" /> Nouveau lead
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard icon={Users} label="Total leads" value={totalLeads.toString()} change="+12%" positive />
        <KPICard icon={Euro} label="Pipeline total" value={`${(totalBudget / 1000).toFixed(0)}k €`} change="+8%" positive />
        <KPICard icon={Home} label="Projets gagnés" value={wonLeads.length.toString()} change="+2" positive />
        <KPICard icon={Target} label="Conversion" value={`${conversionRate}%`} change="+5%" positive />
        <KPICard icon={TrendingUp} label="Score moyen" value={avgScore.toString()} change="-3" positive={false} />
      </div>

      {/* Pipeline overview */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-display font-semibold text-sm mb-4">Pipeline commercial</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pipelineCounts.map(p => (
            <div
              key={p.status}
              className="flex-1 min-w-[120px] p-3 rounded-lg bg-muted/50 border cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => navigate('/pipeline')}
            >
              <StatusBadge status={p.status} />
              <p className="font-display font-bold text-2xl mt-2">{p.count}</p>
              <p className="text-[10px] text-muted-foreground">{p.budget.toLocaleString('fr-FR')} €</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent leads */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm">Activité récente</h2>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/leads')}>Voir tout</Button>
          </div>
          <div className="space-y-3">
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/leads')}>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-muted-foreground">{relativeDate(lead.lastContact)}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Hot leads */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" /> Leads chauds
            </h2>
          </div>
          <div className="space-y-3">
            {hotLeads.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/leads')}>
                <LeadScoreBadge score={lead.score} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-muted-foreground">{lead.houseModel} • {lead.budget.toLocaleString('fr-FR')} €</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Sources + Team */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-sm mb-3">Sources</h2>
            <div className="space-y-2.5">
              {sources.map(([source, count]) => (
                <div key={source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{source}</span>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(count / maxSource) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-sm mb-3">Équipe</h2>
            <div className="space-y-2">
              {salesReps.map(rep => {
                const repLeads = leads.filter(l => l.assignedTo === rep.id);
                const repWon = repLeads.filter(l => l.status === 'gagné').length;
                return (
                  <div key={rep.id} className="flex items-center gap-2 p-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold flex-shrink-0">
                      {rep.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{rep.name}</p>
                    </div>
                    <span className="text-xs font-bold">{repLeads.length}</span>
                    <span className="text-[10px] text-tag-won font-medium">{repWon}✓</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, change, positive }: {
  icon: React.ElementType; label: string; value: string; change: string; positive: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-tag-won' : 'text-tag-lost'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <p className="font-display font-bold text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
