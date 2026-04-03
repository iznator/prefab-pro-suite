import { useState, useMemo } from "react";
import { leads as allLeads, salesReps, statusConfig, type Lead, type LeadStatus } from "@/data/mockData";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { LeadScoreBadge } from "@/components/crm/LeadScoreBadge";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Plus, Download, Filter, ArrowUpDown, Users, UserPlus,
  Mail, MoreHorizontal, Clock
} from "lucide-react";
import { relativeDate } from "@/lib/dates";

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<'name' | 'score' | 'date' | 'budget'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredLeads = useMemo(() => {
    let result = allLeads.filter(lead => {
      const matchesSearch = `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.city}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesAssignee = assigneeFilter === "all" || lead.assignedTo === assigneeFilter;
      return matchesSearch && matchesStatus && matchesAssignee;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = `${a.lastName}`.localeCompare(`${b.lastName}`); break;
        case 'score': cmp = a.score - b.score; break;
        case 'date': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case 'budget': cmp = a.budget - b.budget; break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [search, statusFilter, assigneeFilter, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeads);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedLeads(next);
  };

  const toggleAll = () => {
    if (selectedLeads.size === filteredLeads.length) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
  };

  const exportCSV = () => {
    const rows = filteredLeads.filter(l => selectedLeads.size === 0 || selectedLeads.has(l.id));
    const csv = [
      ['Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Statut', 'Modèle', 'Budget', 'Score'].join(','),
      ...rows.map(l => [l.firstName, l.lastName, l.email, l.phone, l.city, l.status, l.houseModel, l.budget, l.score].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'leads_export.csv'; a.click();
  };

  // Status counts for quick filters
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allLeads.length };
    allLeads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return counts;
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{filteredLeads.length} leads • {statusCounts['nouveau'] || 0} nouveaux</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> Exporter
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Plus className="w-3.5 h-3.5" /> Nouveau lead
          </Button>
        </div>
      </div>

      {/* Quick status filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === "all" ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Tous ({statusCounts.all})
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === key ? config.bgClass + ' ring-1 ring-current' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {config.label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-card" />
        </div>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-card">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue placeholder="Commercial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {salesReps.map(rep => (
              <SelectItem key={rep.id} value={rep.id}>{rep.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedLeads.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg animate-fade-in">
          <span className="text-sm font-medium">{selectedLeads.size} sélectionné{selectedLeads.size > 1 ? 's' : ''}</span>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7">
            <UserPlus className="w-3 h-3" /> Assigner
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7">
            <Mail className="w-3 h-3" /> Email groupé
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7" onClick={exportCSV}>
            <Download className="w-3 h-3" /> Exporter
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('score')}>
                  <div className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Contact <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground">Statut</th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden lg:table-cell">Modèle</th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('budget')}>
                  <div className="flex items-center gap-1">Budget <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden lg:table-cell">Ville</th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden xl:table-cell">Commercial</th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden xl:table-cell">Dernier contact</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const rep = salesReps.find(r => r.id === lead.assignedTo);
                return (
                  <tr
                    key={lead.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedLeads.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                    </td>
                    <td className="p-3"><LeadScoreBadge score={lead.score} /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3"><StatusBadge status={lead.status} /></td>
                    <td className="p-3 hidden lg:table-cell text-xs">{lead.houseModel}</td>
                    <td className="p-3 hidden md:table-cell font-medium">{lead.budget.toLocaleString('fr-FR')} €</td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">{lead.city}</td>
                    <td className="p-3 hidden xl:table-cell">
                      {rep && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">{rep.avatar}</div>
                          <span className="text-xs">{rep.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 hidden xl:table-cell">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relativeDate(lead.lastContact)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(lead.lastContact).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
