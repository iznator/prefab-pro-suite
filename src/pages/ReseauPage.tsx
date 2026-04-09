import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Users, UserPlus, ChevronRight, ChevronDown, MapPin, Mail, Phone,
  Shield, Target, Briefcase, User, Search, MoreHorizontal, Edit2,
  Trash2, ToggleLeft, ToggleRight, ArrowDownUp, Globe, Building2
} from "lucide-react";
import {
  networkUsers as initialUsers,
  zones as initialZones,
  roleConfig,
  frenchDepartments,
  getChildren,
  getUserFullName,
  type NetworkUser,
  type UserRole,
  type Zone,
} from "@/data/networkData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ── Role icon component ────────────────────────────────
function RoleIcon({ role }: { role: UserRole }) {
  const icons = { admin: Shield, directeur: Target, manager: Briefcase, commercial: User };
  const Icon = icons[role];
  return <Icon className="w-4 h-4" />;
}

// ── Hierarchy tree node ────────────────────────────────
function TreeNode({ user, users, depth = 0, onSelect }: {
  user: NetworkUser;
  users: NetworkUser[];
  depth?: number;
  onSelect: (u: NetworkUser) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = users.filter(u => u.parentId === user.id);
  const hasChildren = children.length > 0;
  const rc = roleConfig[user.role];

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors group ${!user.isActive ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => onSelect(user)}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="w-5 h-5 flex items-center justify-center hover:bg-muted rounded">
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        ) : <div className="w-5" />}

        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${rc.color}`}>
          {user.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{getUserFullName(user)}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${rc.color}`}>
              {rc.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {user.zoneIds.length > 0 && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {user.zoneIds.map(zid => initialZones.find(z => z.id === zid)?.name).filter(Boolean).join(', ')}
              </span>
            )}
            {user.leadsCount > 0 && <span>{user.leadsCount} leads</span>}
            {hasChildren && <span>{children.length} membre{children.length > 1 ? 's' : ''}</span>}
          </div>
        </div>

        {!user.isActive && <Badge variant="secondary" className="text-[9px]">Inactif</Badge>}
      </div>

      {expanded && children.map(child => (
        <TreeNode key={child.id} user={child} users={users} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ── Zone management card ───────────────────────────────
function ZoneCard({ zone, users, onEdit }: { zone: Zone; users: NetworkUser[]; onEdit: (z: Zone) => void }) {
  const assignedUsers = users.filter(u => u.zoneIds.includes(zone.id));
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
            <h3 className="font-semibold text-sm">{zone.name}</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(zone)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {zone.departments.map(d => (
            <Badge key={d} variant="secondary" className="text-[10px] px-1.5 py-0">
              {d} — {frenchDepartments[d]}
            </Badge>
          ))}
        </div>
        <Separator className="my-2" />
        <div className="space-y-1.5 mt-2">
          {assignedUsers.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun membre assigné</p>}
          {assignedUsers.map(u => (
            <div key={u.id} className="flex items-center gap-2 text-xs">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${roleConfig[u.role].color}`}>
                {u.avatar}
              </div>
              <span>{getUserFullName(u)}</span>
              <Badge variant="outline" className="text-[9px] ml-auto">{roleConfig[u.role].label}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Edit user dialog ───────────────────────────────────
function EditUserDialog({ user, users, zones, onSave, open, onOpenChange }: {
  user: NetworkUser;
  users: NetworkUser[];
  zones: Zone[];
  onSave: (updated: NetworkUser) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [role, setRole] = useState<UserRole>(user.role);
  const [parentId, setParentId] = useState(user.parentId || '');
  const [selectedZones, setSelectedZones] = useState<string[]>(user.zoneIds);

  const possibleParents = users.filter(u => {
    if (u.id === user.id) return false;
    if (role === 'directeur') return u.role === 'admin';
    if (role === 'manager') return u.role === 'directeur';
    if (role === 'commercial') return u.role === 'manager' || u.role === 'directeur';
    return false;
  });

  const toggleZone = (zid: string) => {
    setSelectedZones(prev => prev.includes(zid) ? prev.filter(z => z !== zid) : [...prev, zid]);
  };

  const handleSubmit = () => {
    if (!firstName || !lastName || !email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const avatar = `${firstName[0]}${lastName[0]}`.toUpperCase();
    onSave({
      ...user,
      firstName, lastName, email, phone, avatar,
      role, parentId: parentId || null,
      zoneIds: selectedZones,
    });
    onOpenChange(false);
    toast.success(`${firstName} ${lastName} mis à jour`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Modifier le membre</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prénom *</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <Label className="text-xs">Téléphone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          {user.role !== 'admin' && (
            <>
              <div>
                <Label className="text-xs">Rôle *</Label>
                <Select value={role} onValueChange={(v) => { setRole(v as UserRole); setParentId(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="directeur">🎯 Directeur</SelectItem>
                    <SelectItem value="manager">📋 Manager</SelectItem>
                    <SelectItem value="commercial">💼 Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Supervisé par *</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un superviseur" /></SelectTrigger>
                  <SelectContent>
                    {possibleParents.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {roleConfig[p.role].icon} {getUserFullName(p)} — {roleConfig[p.role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div>
            <Label className="text-xs">Zones</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {zones.map(z => (
                <button
                  key={z.id}
                  onClick={() => toggleZone(z.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${selectedZones.includes(z.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'}`}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── User detail panel ──────────────────────────────────
function UserDetail({ user, users, zones, onClose, onEdit, onToggleActive }: {
  user: NetworkUser;
  users: NetworkUser[];
  zones: Zone[];
  onClose: () => void;
  onEdit: (u: NetworkUser) => void;
  onToggleActive: (u: NetworkUser) => void;
}) {
  const rc = roleConfig[user.role];
  const children = users.filter(u => u.parentId === user.id);
  const parent = users.find(u => u.id === user.parentId);
  const userZones = zones.filter(z => user.zoneIds.includes(z.id));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ${rc.color}`}>
          {user.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-display font-bold">{getUserFullName(user)}</h2>
          <Badge className={`${rc.color} text-xs mt-1`}>{rc.icon} {rc.label}</Badge>
          {!user.isActive && <Badge variant="destructive" className="text-xs ml-2">Inactif</Badge>}
        </div>
      </div>

      {/* Contact */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{user.email}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{user.phone}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Hiérarchie</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {parent && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Supervisé par</span>
              <Badge variant="outline" className="text-xs">{getUserFullName(parent)}</Badge>
            </div>
          )}
          {children.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Supervise {children.length} membre{children.length > 1 ? 's' : ''}</p>
              <div className="space-y-1">
                {children.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${roleConfig[c.role].color}`}>{c.avatar}</div>
                    <span>{getUserFullName(c)}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{roleConfig[c.role].label}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zones */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Zones assignées</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {userZones.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucune zone assignée</p>
          ) : (
            <div className="space-y-2">
              {userZones.map(z => (
                <div key={z.id} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                  <span className="text-sm">{z.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{z.departments.length} dép.</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">{user.leadsCount}</p>
            <p className="text-xs text-muted-foreground">Leads assignés</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Taux de conversion</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onEdit(user)}>
          <Edit2 className="w-3.5 h-3.5" /> Modifier
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onToggleActive(user)}>
          {user.isActive ? <><ToggleLeft className="w-3.5 h-3.5" /> Désactiver</> : <><ToggleRight className="w-3.5 h-3.5" /> Activer</>}
        </Button>
      </div>
    </div>
  );
}

// ── Add user dialog ────────────────────────────────────
function AddUserDialog({ users, zones, onAdd }: {
  users: NetworkUser[];
  zones: Zone[];
  onAdd: (user: NetworkUser) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('commercial');
  const [parentId, setParentId] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  const possibleParents = users.filter(u => {
    if (role === 'directeur') return u.role === 'admin';
    if (role === 'manager') return u.role === 'directeur';
    if (role === 'commercial') return u.role === 'manager' || u.role === 'directeur';
    return false;
  });

  const handleSubmit = () => {
    if (!firstName || !lastName || !email || !parentId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const avatar = `${firstName[0]}${lastName[0]}`.toUpperCase();
    const newUser: NetworkUser = {
      id: `u${Date.now()}`,
      firstName, lastName, email, phone, avatar,
      role, parentId, zoneIds: selectedZones,
      isActive: true, createdAt: new Date().toISOString().split('T')[0],
      leadsCount: 0, conversionRate: 0,
    };
    onAdd(newUser);
    toast.success(`${firstName} ${lastName} ajouté en tant que ${roleConfig[role].label}`);
  };

  const toggleZone = (zid: string) => {
    setSelectedZones(prev => prev.includes(zid) ? prev.filter(z => z !== zid) : [...prev, zid]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><UserPlus className="w-4 h-4" /> Ajouter un membre</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Ajouter un membre au réseau</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prénom *</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" />
            </div>
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@modulahome.fr" type="email" />
          </div>
          <div>
            <Label className="text-xs">Téléphone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 12 34 56 78" />
          </div>
          <div>
            <Label className="text-xs">Rôle *</Label>
            <Select value={role} onValueChange={(v) => { setRole(v as UserRole); setParentId(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="directeur">🎯 Directeur</SelectItem>
                <SelectItem value="manager">📋 Manager</SelectItem>
                <SelectItem value="commercial">💼 Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Supervisé par *</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Choisir un superviseur" /></SelectTrigger>
              <SelectContent>
                {possibleParents.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {roleConfig[p.role].icon} {getUserFullName(p)} — {roleConfig[p.role].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Zones</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {zones.map(z => (
                <button
                  key={z.id}
                  onClick={() => toggleZone(z.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${selectedZones.includes(z.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'}`}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit}>Ajouter</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dispatch tab ───────────────────────────────────────
function DispatchTab({ users, zones }: { users: NetworkUser[]; zones: Zone[] }) {
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const directors = users.filter(u => u.role === 'directeur' && u.isActive);
  const filteredDirectors = selectedZone === 'all'
    ? directors
    : directors.filter(d => d.zoneIds.includes(selectedZone));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les zones</SelectItem>
            {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Les leads entrants sont automatiquement attribués au directeur de la zone correspondante.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDirectors.map(director => {
          const dirZones = zones.filter(z => director.zoneIds.includes(z.id));
          const team = users.filter(u => u.parentId === director.id);
          const allDepts = dirZones.flatMap(z => z.departments);

          return (
            <Card key={director.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${roleConfig.directeur.color}`}>
                    {director.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{getUserFullName(director)}</p>
                    <p className="text-xs text-muted-foreground">{dirZones.map(z => z.name).join(', ')}</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium mb-1">Couverture départementale</p>
                  <div className="flex flex-wrap gap-1">
                    {allDepts.slice(0, 8).map(d => (
                      <Badge key={d} variant="secondary" className="text-[9px] px-1">{d}</Badge>
                    ))}
                    {allDepts.length > 8 && (
                      <Badge variant="secondary" className="text-[9px] px-1">+{allDepts.length - 8}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Équipe ({team.length})</span>
                  <span>{director.leadsCount} leads</span>
                </div>

                <div className="space-y-1">
                  {team.map(member => (
                    <div key={member.id} className="flex items-center gap-2 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold ${roleConfig[member.role].color}`}>
                        {member.avatar}
                      </div>
                      <span className="truncate">{getUserFullName(member)}</span>
                      <Badge variant="outline" className="text-[8px] ml-auto">{roleConfig[member.role].label}</Badge>
                      <span className="text-muted-foreground">{member.leadsCount}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                    <ArrowDownUp className="w-3 h-3 mr-1" /> Réassigner
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Zone edit/create dialog ────────────────────────────
function ZoneDialog({ zone, onSave, open, onOpenChange }: {
  zone?: Zone;
  onSave: (zone: Zone) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(zone?.name || '');
  const [color, setColor] = useState(zone?.color || 'hsl(210, 80%, 55%)');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(zone?.departments || []);
  const [deptSearch, setDeptSearch] = useState('');

  const filteredDepts = Object.entries(frenchDepartments).filter(([code, nom]) =>
    !deptSearch || code.includes(deptSearch) || nom.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const toggleDept = (code: string) => {
    setSelectedDepts(prev => prev.includes(code) ? prev.filter(d => d !== code) : [...prev, code]);
  };

  const handleSubmit = () => {
    if (!name || selectedDepts.length === 0) {
      toast.error('Nom et au moins un département requis');
      return;
    }
    onSave({
      id: zone?.id || `z${Date.now()}`,
      name, color, departments: selectedDepts,
    });
    onOpenChange(false);
    toast.success(zone ? `Zone "${name}" modifiée` : `Zone "${name}" créée`);
  };

  const colorOptions = [
    'hsl(210, 80%, 55%)', 'hsl(38, 90%, 55%)', 'hsl(150, 60%, 45%)',
    'hsl(280, 60%, 55%)', 'hsl(0, 70%, 55%)', 'hsl(170, 70%, 45%)',
    'hsl(320, 60%, 55%)', 'hsl(45, 80%, 50%)',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{zone ? 'Modifier la zone' : 'Créer une zone'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Nom de la zone *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Grand Est" />
          </div>
          <div>
            <Label className="text-xs">Couleur</Label>
            <div className="flex gap-2 mt-1.5">
              {colorOptions.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Départements * ({selectedDepts.length} sélectionnés)</Label>
            <Input
              className="mt-1.5 mb-2"
              placeholder="Rechercher un département..."
              value={deptSearch}
              onChange={e => setDeptSearch(e.target.value)}
            />
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="flex flex-wrap gap-1">
                {filteredDepts.map(([code, nom]) => (
                  <button
                    key={code}
                    onClick={() => toggleDept(code)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${selectedDepts.includes(code) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'}`}
                  >
                    {code} — {nom}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>{zone ? 'Enregistrer' : 'Créer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────
export default function ReseauPage() {
  const [users, setUsers] = useState(initialUsers);
  const [zonesList, setZonesList] = useState(initialZones);
  const [selectedUser, setSelectedUser] = useState<NetworkUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<NetworkUser | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [creatingZone, setCreatingZone] = useState(false);

  const rootUsers = useMemo(() => {
    return users.filter(u => u.parentId === null);
  }, [users]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (filterRole !== 'all') {
      result = result.filter(u => u.role === filterRole);
    }
    return result;
  }, [users, searchQuery, filterRole]);

  const stats = useMemo(() => ({
    total: users.filter(u => u.isActive).length,
    directeurs: users.filter(u => u.role === 'directeur' && u.isActive).length,
    managers: users.filter(u => u.role === 'manager' && u.isActive).length,
    commerciaux: users.filter(u => u.role === 'commercial' && u.isActive).length,
  }), [users]);

  const handleAddUser = (user: NetworkUser) => {
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = (updated: NetworkUser) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (selectedUser?.id === updated.id) setSelectedUser(updated);
  };

  const handleToggleActive = (user: NetworkUser) => {
    const updated = { ...user, isActive: !user.isActive };
    handleUpdateUser(updated);
    toast.success(`${getUserFullName(user)} ${updated.isActive ? 'activé' : 'désactivé'}`);
  };

  const handleDeleteUser = (user: NetworkUser) => {
    const children = users.filter(u => u.parentId === user.id);
    if (children.length > 0) {
      toast.error(`Impossible de supprimer ${getUserFullName(user)} — il supervise ${children.length} membre(s)`);
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== user.id));
    if (selectedUser?.id === user.id) setSelectedUser(null);
    toast.success(`${getUserFullName(user)} supprimé`);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Edit dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          users={users}
          zones={zonesList}
          onSave={handleUpdateUser}
          open={!!editingUser}
          onOpenChange={(open) => { if (!open) setEditingUser(null); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Réseau</h1>
          <p className="text-sm text-muted-foreground">Gérez la hiérarchie, les zones et le dispatching des leads</p>
        </div>
        <AddUserDialog users={users} zones={zonesList} onAdd={handleAddUser} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Membres actifs', value: stats.total, icon: Users, color: 'text-primary' },
          { label: 'Directeurs', value: stats.directeurs, icon: Target, color: 'text-destructive' },
          { label: 'Managers', value: stats.managers, icon: Briefcase, color: 'text-accent-foreground' },
          { label: 'Commerciaux', value: stats.commerciaux, icon: User, color: 'text-tag-qualified' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hierarchy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hierarchy" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Hiérarchie</TabsTrigger>
          <TabsTrigger value="zones" className="gap-1.5"><Globe className="w-3.5 h-3.5" /> Zones</TabsTrigger>
          <TabsTrigger value="dispatch" className="gap-1.5"><ArrowDownUp className="w-3.5 h-3.5" /> Dispatching</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> Membres</TabsTrigger>
        </TabsList>

        {/* ── Hierarchy tab ──────────────── */}
        <TabsContent value="hierarchy">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Organigramme</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[500px]">
                  {rootUsers.map(user => (
                    <TreeNode key={user.id} user={user} users={users} onSelect={setSelectedUser} />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">
                  {selectedUser ? getUserFullName(selectedUser) : 'Sélectionner un membre'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {selectedUser ? (
                  <UserDetail
                    user={selectedUser}
                    users={users}
                    zones={zonesList}
                    onClose={() => setSelectedUser(null)}
                    onEdit={(u) => setEditingUser(u)}
                    onToggleActive={handleToggleActive}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Cliquez sur un membre dans l'organigramme pour voir ses détails</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Zones tab ──────────────────── */}
        <TabsContent value="zones">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {zonesList.map(zone => (
              <ZoneCard key={zone.id} zone={zone} users={users} onEdit={(z) => setEditingZone(z)} />
            ))}
            <Card className="border-dashed flex items-center justify-center min-h-[180px] cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setCreatingZone(true)}>
              <div className="text-center text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Créer une zone</p>
                <p className="text-xs">Composée de départements</p>
              </div>
            </Card>
          </div>

          {/* Zone create dialog */}
          {creatingZone && (
            <ZoneDialog
              open={creatingZone}
              onOpenChange={setCreatingZone}
              onSave={(zone) => setZonesList(prev => [...prev, zone])}
            />
          )}

          {/* Zone edit dialog */}
          {editingZone && (
            <ZoneDialog
              zone={editingZone}
              open={!!editingZone}
              onOpenChange={(open) => { if (!open) setEditingZone(null); }}
              onSave={(zone) => setZonesList(prev => prev.map(z => z.id === zone.id ? zone : z))}
            />
          )}
        </TabsContent>

        {/* ── Dispatch tab ───────────────── */}
        <TabsContent value="dispatch">
          <DispatchTab users={users} zones={zonesList} />
        </TabsContent>

        {/* ── Members tab ────────────────── */}
        <TabsContent value="members">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Rechercher un membre..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="directeur">Directeur</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Membre</th>
                      <th className="text-left py-2 px-3 font-medium">Rôle</th>
                      <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Zone(s)</th>
                      <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Superviseur</th>
                      <th className="text-center py-2 px-3 font-medium">Leads</th>
                      <th className="text-center py-2 px-3 font-medium">Conv.</th>
                      <th className="text-center py-2 px-3 font-medium">Statut</th>
                      <th className="text-right py-2 px-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.filter(u => u.role !== 'admin').map(user => {
                      const parent = users.find(u => u.id === user.parentId);
                      const rc = roleConfig[user.role];
                      return (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${rc.color}`}>{user.avatar}</div>
                              <div>
                                <p className="font-medium">{getUserFullName(user)}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className={`text-[10px] ${rc.color}`}>{rc.icon} {rc.label}</Badge>
                          </td>
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {user.zoneIds.map(zid => {
                                const z = zonesList.find(zz => zz.id === zid);
                                return z ? (
                                  <Badge key={zid} variant="secondary" className="text-[9px]">{z.name}</Badge>
                                ) : null;
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground hidden md:table-cell">
                            {parent ? getUserFullName(parent) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium">{user.leadsCount}</td>
                          <td className="py-2.5 px-3 text-center">{user.conversionRate}%</td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-[9px]">
                              {user.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                  <Edit2 className="w-3.5 h-3.5 mr-2" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                  {user.isActive ? <><ToggleLeft className="w-3.5 h-3.5 mr-2" /> Désactiver</> : <><ToggleRight className="w-3.5 h-3.5 mr-2" /> Activer</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user)}>
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
