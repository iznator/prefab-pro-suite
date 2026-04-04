import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, Mail, Phone, MapPin, Home, Euro, Sparkles } from "lucide-react";
import { houseModels, salesReps } from "@/data/mockData";
import { toast } from "sonner";

interface NewLeadDialogProps {
  trigger?: React.ReactNode;
}

export function NewLeadDialog({ trigger }: NewLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    toast.success("Lead créé avec succès !", {
      description: "Le nouveau lead a été ajouté à votre pipeline.",
    });
    setOpen(false);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Plus className="w-3.5 h-3.5" /> Nouveau lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Nouveau lead
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Informations du contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Jean" className="pl-9 h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input placeholder="Dupont" className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="email" placeholder="jean@email.fr" className="pl-9 h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Téléphone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="06 12 34 56 78" className="pl-9 h-9 text-sm" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} size="sm">Suivant</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Localisation</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="15 Rue de la Paix" className="pl-9 h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Code postal</Label>
                <Input placeholder="75001" className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Ville *</Label>
                <Input placeholder="Paris" className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Source</Label>
              <Select defaultValue="Site web">
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Site web', 'Facebook Ads', 'Google Ads', 'Salon immobilier', 'Recommandation', 'Instagram', 'Autre'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Retour</Button>
              <Button onClick={() => setStep(3)} size="sm">Suivant</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Projet immobilier</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Modèle de maison</Label>
              <Select>
                <SelectTrigger className="h-9 text-sm">
                  <Home className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Choisir un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {houseModels.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Budget estimé (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="number" placeholder="50000" className="pl-9 h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Commercial assigné</Label>
              <Select>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Assigner un commercial" />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map(rep => (
                    <SelectItem key={rep.id} value={rep.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[8px] font-bold">{rep.avatar}</span>
                        {rep.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Informations supplémentaires..." rows={3} className="text-sm" />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Retour</Button>
              <Button onClick={handleSubmit} size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                <Plus className="w-3.5 h-3.5" /> Créer le lead
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
