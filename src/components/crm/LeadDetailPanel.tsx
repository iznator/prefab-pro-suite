import { Lead, salesReps, statusConfig, type LeadStatus } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { 
  X, Mail, Phone, MapPin, MessageSquare, StickyNote, Paperclip, 
  Send, User, Calendar, Home, Euro, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
}

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [newNote, setNewNote] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [emailMode, setEmailMode] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  if (!lead) return null;

  const rep = salesReps.find(r => r.id === lead.assignedTo);

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
                  <h2 className="font-display font-bold text-xl">{lead.firstName} {lead.lastName}</h2>
                  <p className="text-sm text-muted-foreground">{lead.city} • {lead.source}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={lead.status} />
                    <LeadScoreBadge score={lead.score} />
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setEmailMode(!emailMode)}>
                <Mail className="w-3.5 h-3.5" /> Email
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Phone className="w-3.5 h-3.5" /> Appeler
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" /> SMS
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
                    <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                      <Send className="w-3.5 h-3.5" /> Envoyer
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info cards */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={Home} label="Modèle" value={lead.houseModel} />
              <InfoCard icon={Euro} label="Budget" value={`${lead.budget.toLocaleString('fr-FR')} €`} />
              <InfoCard icon={MapPin} label="Adresse" value={`${lead.address}, ${lead.postalCode} ${lead.city}`} />
              <InfoCard icon={User} label="Commercial" value={rep?.name || '—'} />
              <InfoCard icon={Calendar} label="Créé le" value={new Date(lead.createdAt).toLocaleDateString('fr-FR')} />
              <InfoCard icon={Calendar} label="Dernier contact" value={new Date(lead.lastContact).toLocaleDateString('fr-FR')} />
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
            <div className="rounded-xl overflow-hidden border h-40 bg-muted flex items-center justify-center">
              <iframe
                title="Localisation"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lead.lng - 0.01},${lead.lat - 0.005},${lead.lng + 0.01},${lead.lat + 0.005}&layer=mapnik&marker=${lead.lat},${lead.lng}`}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pb-6">
            <Tabs defaultValue="notes">
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="notes" className="flex-1 gap-1.5 text-xs">
                  <StickyNote className="w-3.5 h-3.5" /> Notes ({lead.notes.length})
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 gap-1.5 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat ({lead.messages.length})
                </TabsTrigger>
                <TabsTrigger value="files" className="flex-1 gap-1.5 text-xs">
                  <Paperclip className="w-3.5 h-3.5" /> Pièces jointes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4 space-y-3">
                {lead.notes.map(note => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Textarea placeholder="Ajouter une note..." value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} className="text-sm" />
                  <Button size="icon" className="flex-shrink-0 self-end bg-primary text-primary-foreground">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="mt-4 space-y-3">
                {lead.messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun message pour l'instant</p>
                )}
                {lead.messages.map(msg => (
                  <div key={msg.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{msg.author}</span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Message interne..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="text-sm" />
                  <Button size="icon" className="flex-shrink-0 bg-primary text-primary-foreground">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <div className="border-2 border-dashed rounded-xl p-8 text-center">
                  <Paperclip className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Glissez vos fichiers ici ou</p>
                  <Button size="sm" variant="outline" className="mt-2 text-xs">Parcourir</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
