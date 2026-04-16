import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfiles } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description: string, memberIds: string[], type: "channel" | "dm") => Promise<any>;
}

export function CreateChannelDialog({ open, onOpenChange, onCreate }: CreateChannelDialogProps) {
  const [tab, setTab] = useState<"channel" | "dm">("channel");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const profiles = useProfiles();
  const { user } = useAuth();

  const otherProfiles = profiles.filter(p => p.user_id !== user?.id);

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (tab === "channel" && !name.trim()) return;
    if (tab === "dm" && selectedMembers.length === 0) return;

    setCreating(true);
    const channelName = tab === "dm"
      ? otherProfiles.filter(p => selectedMembers.includes(p.user_id)).map(p => p.display_name || "User").join(", ")
      : name.trim().toLowerCase().replace(/\s+/g, "-");

    const result = await onCreate(channelName, description, selectedMembers, tab);
    setCreating(false);

    if (result) {
      setName("");
      setDescription("");
      setSelectedMembers([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Nouvelle conversation</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as "channel" | "dm")}>
          <TabsList className="w-full">
            <TabsTrigger value="channel" className="flex-1 text-xs">Channel</TabsTrigger>
            <TabsTrigger value="dm" className="flex-1 text-xs">Message direct</TabsTrigger>
          </TabsList>

          <TabsContent value="channel" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Nom du channel</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ex: general, ventes, projets"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Description (optionnel)</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="De quoi parle ce channel ?"
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="dm" className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Sélectionner un ou plusieurs contacts</p>
          </TabsContent>
        </Tabs>

        {/* Member selection */}
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
          {otherProfiles.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun utilisateur trouvé</p>
          )}
          {otherProfiles.map(p => (
            <label
              key={p.user_id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedMembers.includes(p.user_id)}
                onCheckedChange={() => toggleMember(p.user_id)}
              />
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                {(p.display_name || "?").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm">{p.display_name || "Utilisateur"}</span>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={handleCreate} disabled={creating || (tab === "channel" && !name.trim()) || (tab === "dm" && selectedMembers.length === 0)}>
            {creating ? "Création..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
