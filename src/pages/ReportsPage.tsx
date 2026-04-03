import { leads, salesReps, statusConfig, houseModels, type LeadStatus } from "@/data/mockData";
import { BarChart3, TrendingUp, Users, Euro, Home, Target } from "lucide-react";

export default function ReportsPage() {
  // Compute stats
  const totalBudget = leads.reduce((s, l) => s + l.budget, 0);
  const wonLeads = leads.filter(l => l.status === "gagné");
  const wonBudget = wonLeads.reduce((s, l) => s + l.budget, 0);
  const conversionRate = Math.round((wonLeads.length / leads.length) * 100);
  const avgBudget = Math.round(totalBudget / leads.length);

  // Leads by source
  const sourceMap = new Map<string, number>();
  leads.forEach(l => sourceMap.set(l.source, (sourceMap.get(l.source) || 0) + 1));
  const sources = Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(...sources.map(s => s[1]));

  // Leads by model
  const modelMap = new Map<string, { count: number; budget: number }>();
  leads.forEach(l => {
    const prev = modelMap.get(l.houseModel) || { count: 0, budget: 0 };
    modelMap.set(l.houseModel, { count: prev.count + 1, budget: prev.budget + l.budget });
  });
  const models = Array.from(modelMap.entries()).sort((a, b) => b[1].count - a[1].count);

  // Pipeline funnel
  const funnelStages: LeadStatus[] = ["nouveau", "contacté", "qualifié", "proposition", "négociation", "gagné"];
  const funnelData = funnelStages.map(status => ({
    status,
    ...statusConfig[status],
    count: leads.filter(l => l.status === status).length,
  }));
  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

  // Performance by rep
  const repStats = salesReps.map(rep => {
    const repLeads = leads.filter(l => l.assignedTo === rep.id);
    const repWon = repLeads.filter(l => l.status === "gagné");
    const repBudget = repLeads.reduce((s, l) => s + l.budget, 0);
    const avgScore = repLeads.length ? Math.round(repLeads.reduce((s, l) => s + l.score, 0) / repLeads.length) : 0;
    return { ...rep, total: repLeads.length, won: repWon.length, budget: repBudget, avgScore };
  }).sort((a, b) => b.won - a.won);

  // Score distribution
  const scoreRanges = [
    { label: "0-25", min: 0, max: 25, color: "bg-tag-lost" },
    { label: "26-50", min: 26, max: 50, color: "bg-tag-contacted" },
    { label: "51-75", min: 51, max: 75, color: "bg-tag-qualified" },
    { label: "76-100", min: 76, max: 100, color: "bg-tag-won" },
  ];
  const scoreDist = scoreRanges.map(r => ({
    ...r,
    count: leads.filter(l => l.score >= r.min && l.score <= r.max).length,
  }));
  const maxScore = Math.max(...scoreDist.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Rapports</h1>
        <p className="text-sm text-muted-foreground">Analyse de performance commerciale</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniKPI icon={Target} label="Taux de conversion" value={`${conversionRate}%`} />
        <MiniKPI icon={Euro} label="CA Gagné" value={`${(wonBudget / 1000).toFixed(0)}k €`} />
        <MiniKPI icon={Home} label="Budget moyen" value={`${(avgBudget / 1000).toFixed(0)}k €`} />
        <MiniKPI icon={Users} label="Pipeline actif" value={`${leads.filter(l => !["gagné", "perdu"].includes(l.status)).length}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Conversion funnel */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" /> Entonnoir de conversion
          </h2>
          <div className="space-y-2.5">
            {funnelData.map((stage, i) => (
              <div key={stage.status} className="flex items-center gap-3">
                <span className="text-xs font-medium w-24 text-right">{stage.label}</span>
                <div className="flex-1 bg-muted rounded-full h-7 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max((stage.count / maxFunnel) * 100, 8)}%`,
                      backgroundColor: `hsl(var(--tag-${statusConfig[stage.status].color.replace('tag-', '')}))`,
                    }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow">{stage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by source */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" /> Leads par source
          </h2>
          <div className="space-y-3">
            {sources.map(([source, count]) => (
              <div key={source}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{source}</span>
                  <span className="text-xs text-muted-foreground">{count} leads ({Math.round((count / leads.length) * 100)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(count / maxSource) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance by rep */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" /> Performance commerciaux
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Commercial</th>
                  <th className="text-center py-2 text-xs text-muted-foreground font-medium">Leads</th>
                  <th className="text-center py-2 text-xs text-muted-foreground font-medium">Gagnés</th>
                  <th className="text-center py-2 text-xs text-muted-foreground font-medium">Taux</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">Pipeline</th>
                  <th className="text-center py-2 text-xs text-muted-foreground font-medium">Score moy.</th>
                </tr>
              </thead>
              <tbody>
                {repStats.map(rep => (
                  <tr key={rep.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold flex-shrink-0">
                          {rep.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-xs">{rep.name}</p>
                          <p className="text-[10px] text-muted-foreground">{rep.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center font-medium">{rep.total}</td>
                    <td className="text-center"><span className="text-tag-won font-bold">{rep.won}</span></td>
                    <td className="text-center">{rep.total > 0 ? Math.round((rep.won / rep.total) * 100) : 0}%</td>
                    <td className="text-right font-medium">{rep.budget.toLocaleString("fr-FR")} €</td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${rep.avgScore >= 70 ? 'bg-tag-won/15 text-tag-won' : rep.avgScore >= 40 ? 'bg-tag-contacted/15 text-tag-contacted' : 'bg-tag-lost/15 text-tag-lost'}`}>
                        {rep.avgScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score distribution + Models */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-sm mb-4">Distribution des scores</h2>
            <div className="flex items-end gap-3 h-32">
              {scoreDist.map(s => (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold">{s.count}</span>
                  <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${(s.count / maxScore) * 100}%` }}>
                    <div className={`w-full h-full rounded-t-lg ${s.color}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-muted-foreground" /> CA par modèle
            </h2>
            <div className="space-y-2.5">
              {models.map(([model, data]) => (
                <div key={model} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs font-medium">{model}</p>
                    <p className="text-[10px] text-muted-foreground">{data.count} lead{data.count > 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-sm font-bold">{data.budget.toLocaleString("fr-FR")} €</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="font-display font-bold text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
