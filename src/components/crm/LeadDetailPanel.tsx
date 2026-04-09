import { Lead, salesReps, statusConfig, type LeadStatus } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import {
  X, Mail, Phone, MapPin, MessageSquare, StickyNote, Paperclip,
  Send, User, Calendar, Home, Euro, ChevronRight, History,
  Copy, ExternalLink, Check
} from "lucide-react";
import { TelegramChat } from "./TelegramChat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { relativeDate } from "@/lib/dates";
import { toast } from "sonner";

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
}

const pipelineOrder: LeadStatus[] = ['nouveau', 'contacté', 'qualifié', 'proposition', 'négociation', 'gagné', 'perdu'];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copié !`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={copy} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center transition-colors">
          {copied ? <Check className="w-3 h-3 text-tag-won" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Copier</TooltipContent>
    </Tooltip>
  );
}

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [newNote, setNewNote] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [emailMode, setEmailMode] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [currentStatus, setCurrentStatus] = useState<LeadStatus | null>(null);

  if (!lead) return null;

  const rep = salesReps.find(r => r.id === lead.assignedTo);
  const displayStatus = currentStatus || lead.status;
  const currentIndex = pipelineOrder.indexOf(displayStatus);

  const timeline = [
    { date: lead.createdAt, event: "Lead créé", detail: `Source : ${lead.source}` },
    ...(lead.assignedTo ? [{ date: lead.createdAt, event: "Assigné", detail: `Commercial : ${rep?.name || '—'}` }] : []),
    ...lead.notes.map(n => ({ date: n.createdAt, event: "Note ajoutée", detail: n.content.slice(0, 60) + (n.content.length > 60 ? '...' : '') })),
    ...lead.messages.map(m => ({ date: m.createdAt, event: "Message interne", detail: m.content.slice(0, 60) + (m.content.length > 60 ? '...' : '') })),
    { date: lead.lastContact, event: "Dernier contact", detail: `Statut : ${statusConfig[lead.status].label}` },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
      >
        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-card shadow-2xl border-l overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card z-10 border-b p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display font-bold text-xl">{lead.firstName} {lead.lastName}</h2>
                    <LeadScoreBadge score={lead.score} />
                  </div>
                  <p className="text-sm text-muted-foreground">{lead.city} • {lead.source}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clickable contact info */}
            <div className="flex flex-wrap gap-2 mt-3">
              <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors text-xs">
                <Phone className="w-3 h-3 text-tag-won" /> {lead.phone}
              </a>
              <CopyButton text={lead.phone} label="Téléphone" />
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors text-xs">
                <Mail className="w-3 h-3 text-primary" /> {lead.email}
              </a>
              <CopyButton text={lead.email} label="Email" />
            </div>

            {/* Status pipeline stepper — visual with labels */}
            <div className="mt-4">
              <div className="flex items-center gap-1">
                {pipelineOrder.filter(s => s !== 'perdu').map((status, i) => {
                  const isActive = i <= currentIndex && displayStatus !== 'perdu';
                  const isCurrent = status === displayStatus;
                  return (
                    <Tooltip key={status}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setCurrentStatus(status);
                            toast.success(`Statut mis à jour : ${statusConfig[status].label}`);
                          }}
                          className={`flex-1 h-2.5 rounded-full transition-all relative ${isCurrent ? 'h-3.5 ring-2 ring-offset-1 ring-offset-card' : ''} ${isActive ? '' : 'bg-muted'}`}
                          style={{
                            ...(isActive ? { backgroundColor: `hsl(var(--tag-${statusConfig[status].color.replace('tag-', '')}))` } : {}),
                            ...(isCurrent ? { ringColor: `hsl(var(--tag-${statusConfig[status].color.replace('tag-', '')}))` } : {})
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-medium">
                        {statusConfig[status].label}
                        {isCurrent && ' (actuel)'}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              {/* Labels under stepper */}
              <div className="flex items-center gap-1 mt-1.5">
                {pipelineOrder.filter(s => s !== 'perdu').map((status) => {
                  const isCurrent = status === displayStatus;
                  return (
                    <span key={status} className={`flex-1 text-center text-[8px] leading-tight ${isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground/60'}`}>
                      {statusConfig[status].label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <Select value={displayStatus} onValueChange={(v) => {
                setCurrentStatus(v as LeadStatus);
                toast.success(`Statut mis à jour : ${statusConfig[v as LeadStatus].label}`);
              }}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelineOrder.map(s => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(var(--tag-${statusConfig[s].color.replace('tag-', '')}))` }} />
                        {statusConfig[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentIndex < 5 && displayStatus !== 'perdu' && (
                <Button
                  size="sm"
                  className="text-xs gap-1.5 h-8 bg-primary text-primary-foreground"
                  onClick={() => {
                    const next = pipelineOrder[Math.min(currentIndex + 1, 5)];
                    setCurrentStatus(next);
                    toast.success(`Statut mis à jour : ${statusConfig[next].label}`);
                  }}
                >
                  Avancer vers {statusConfig[pipelineOrder[Math.min(currentIndex + 1, 5)]].label} <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setEmailMode(!emailMode)}>
                <Mail className="w-3.5 h-3.5" /> Email
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                <a href={`tel:${lead.phone.replace(/\s/g, '')}`}>
                  <Phone className="w-3.5 h-3.5" /> Appeler
                </a>
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                <a href={`sms:${lead.phone.replace(/\s/g, '')}`}>
                  <MessageSquare className="w-3.5 h-3.5" /> SMS
                </a>
              </Button>
            </div>
          </div>

          {/* Email compose */}
          <AnimatePresence>
            {emailMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="text-xs text-muted-foreground">À : {lead.email}</div>
                  <Input placeholder="Objet" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="text-sm" />
                  <Textarea placeholder="Votre message..." value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={4} className="text-sm" />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEmailMode(false)}>Annuler</Button>
                    <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground" onClick={() => { setEmailMode(false); toast.success("Email envoyé !"); }}>
                      <Send className="w-3.5 h-3.5" /> Envoyer
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs — moved to top */}
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="info" className="flex flex-col flex-1 min-h-0">
              <div className="px-6 pt-3">
                <TabsList className="w-full bg-muted">
                  <TabsTrigger value="info" className="flex-1 gap-1.5 text-xs">
                    <User className="w-3.5 h-3.5" /> Infos
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex-1 gap-1.5 text-xs">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat ({lead.messages.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1 gap-1.5 text-xs">
                    <StickyNote className="w-3.5 h-3.5" /> Notes ({lead.notes.length})
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex-1 gap-1.5 text-xs">
                    <History className="w-3.5 h-3.5" /> Historique
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex-1 gap-1.5 text-xs">
                    <Paperclip className="w-3.5 h-3.5" /> Fichiers
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 min-h-0 mt-0 px-0">
                <TelegramChat messages={lead.messages} leadName={`${lead.firstName} ${lead.lastName}`} />
              </TabsContent>

              <TabsContent value="notes" className="mt-0 px-6 py-4 space-y-3 overflow-y-auto">
                {lead.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune note. Ajoutez-en une ci-dessous.</p>
                )}
                {lead.notes.map(note => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground">{relativeDate(note.createdAt)}</span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Textarea placeholder="Ajouter une note..." value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} className="text-sm" />
                  <Button size="icon" className="flex-shrink-0 self-end bg-primary text-primary-foreground" onClick={() => { if (newNote.trim()) { toast.success("Note ajoutée !"); setNewNote(""); } }}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-0 px-6 py-4 overflow-y-auto">
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                  {timeline.map((evt, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-card border-2 border-primary" />
                      <div className="pb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{evt.event}</span>
                          <span className="text-[10px] text-muted-foreground">{relativeDate(evt.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{evt.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-0 px-6 py-4">
                <div className="border-2 border-dashed rounded-xl p-8 text-center">
                  <Paperclip className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Glissez vos fichiers ici ou</p>
                  <Button size="sm" variant="outline" className="mt-2 text-xs">Parcourir</Button>
                </div>
              </TabsContent>

              <TabsContent value="info" className="mt-0 px-6 py-4 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard icon={Home} label="Modèle" value={lead.houseModel} />
                  <InfoCard icon={Euro} label="Budget" value={`${lead.budget.toLocaleString('fr-FR')} €`} />
                  <InfoCard icon={MapPin} label="Adresse" value={`${lead.address}, ${lead.postalCode} ${lead.city}`} link={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.address}, ${lead.postalCode} ${lead.city}`)}`} />
                  <InfoCard icon={User} label="Commercial" value={rep?.name || '—'} />
                  <InfoCard icon={Calendar} label="Créé le" value={new Date(lead.createdAt).toLocaleDateString('fr-FR')} />
                  <InfoCard icon={Calendar} label="Dernier contact" value={relativeDate(lead.lastContact)} />
                </div>

                {/* Tags */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium">{tag}</span>
                    ))}
                    <button className="px-2.5 py-1 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-muted transition-colors">+ Tag</button>
                  </div>
                </div>

                {/* Map embed */}
                <div className="rounded-xl overflow-hidden border h-40 bg-muted relative group">
                  <iframe
                    title="Localisation"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${lead.lng - 0.01},${lead.lat - 0.005},${lead.lng + 0.01},${lead.lat + 0.005}&layer=mapnik&marker=${lead.lat},${lead.lng}`}
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-card/90 border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoCard({ icon: Icon, label, value, link }: { icon: React.ElementType; label: string; value: string; link?: string }) {
  const content = (
    <div className={`p-3 rounded-lg bg-muted/50 border ${link ? 'hover:bg-muted/80 cursor-pointer transition-colors group/card' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
        {link && <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity ml-auto" />}
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );

  if (link) {
    return <a href={link} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}
