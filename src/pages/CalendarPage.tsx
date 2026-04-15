import { useState, useMemo } from "react";
import { salesReps } from "@/data/mockData";
import { useLeads, type Lead } from "@/contexts/LeadsContext";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { ChevronLeft, ChevronRight, Clock, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  lead: Lead;
  type: "contact" | "followup" | "creation";
  date: Date;
  label: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 2, 1)); // March 2024 to match mock data
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday start

  const events = useMemo<CalendarEvent[]>(() => {
    const evts: CalendarEvent[] = [];
    leads.forEach(lead => {
      evts.push({ lead, type: "contact", date: new Date(lead.lastContact), label: `Dernier contact : ${lead.firstName} ${lead.lastName}` });
      evts.push({ lead, type: "creation", date: new Date(lead.createdAt), label: `Créé : ${lead.firstName} ${lead.lastName}` });
      // Generate a follow-up 5 days after last contact
      const followup = new Date(lead.lastContact);
      followup.setDate(followup.getDate() + 5);
      if (lead.status !== "gagné" && lead.status !== "perdu") {
        evts.push({ lead, type: "followup", date: followup, label: `Rappel : ${lead.firstName} ${lead.lastName}` });
      }
    });
    return evts;
  }, []);

  const getEventsForDay = (day: number) => {
    return events.filter(e => e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === day);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const days = Array.from({ length: lastDay.getDate() }, (_, i) => i + 1);
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Upcoming events for the sidebar
  const upcomingFollowups = events
    .filter(e => e.type === "followup" && e.date >= new Date(2024, 2, 28))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 8);

  const typeStyles = {
    contact: "bg-tag-qualified/15 text-tag-qualified border-l-2 border-tag-qualified",
    creation: "bg-tag-new/15 text-tag-new border-l-2 border-tag-new",
    followup: "bg-tag-contacted/15 text-tag-contacted border-l-2 border-tag-contacted",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Calendrier</h1>
          <p className="text-sm text-muted-foreground">Suivis, rendez-vous et rappels</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-display font-semibold text-sm min-w-[160px] text-center capitalize">{monthName}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Calendar grid */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map(d => (
              <div key={d} className="p-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wide border-b bg-muted/30">
                {d}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-muted/10" />
            ))}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day} className={`min-h-[100px] border-b border-r p-1.5 hover:bg-muted/20 transition-colors ${isToday(day) ? 'bg-primary/5' : ''}`}>
                  <span className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedLead(evt.lead)}
                        className={`block w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium truncate ${typeStyles[evt.type]}`}
                      >
                        {evt.lead.firstName[0]}. {evt.lead.lastName}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 3} autres</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Prochains rappels
            </h3>
            <div className="space-y-2">
              {upcomingFollowups.map((evt, i) => {
                const rep = salesReps.find(r => r.id === evt.lead.assignedTo);
                return (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-muted/50 border hover:border-primary/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedLead(evt.lead)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{evt.lead.firstName} {evt.lead.lastName}</span>
                      <StatusBadge status={evt.lead.status} className="text-[9px] px-1.5 py-0" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{evt.date.toLocaleDateString("fr-FR")}</span>
                      {rep && <span className="flex items-center gap-1"><User className="w-3 h-3" />{rep.name.split(" ")[0]}</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{evt.lead.houseModel} • {evt.lead.budget.toLocaleString("fr-FR")} €</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-display font-semibold text-sm mb-3">Légende</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><div className="w-3 h-1.5 rounded bg-tag-new" /><span className="text-xs text-muted-foreground">Création du lead</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-1.5 rounded bg-tag-qualified" /><span className="text-xs text-muted-foreground">Dernier contact</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-1.5 rounded bg-tag-contacted" /><span className="text-xs text-muted-foreground">Rappel à faire</span></div>
            </div>
          </div>
        </div>
      </div>

      <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
