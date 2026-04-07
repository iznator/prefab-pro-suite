// ── Types ──────────────────────────────────────────────
export type UserRole = 'admin' | 'directeur' | 'manager' | 'commercial';

export interface NetworkUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  parentId: string | null; // who manages this user
  zoneIds: string[]; // assigned zones
  isActive: boolean;
  createdAt: string;
  leadsCount: number;
  conversionRate: number;
}

export interface Zone {
  id: string;
  name: string;
  departments: string[];
  color: string;
}

// ── French departments ─────────────────────────────────
export const frenchDepartments: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes',
  '09': 'Ariège', '10': 'Aube', '11': 'Aude', '12': 'Aveyron',
  '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal', '16': 'Charente',
  '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '2A': 'Corse-du-Sud',
  '2B': 'Haute-Corse', '21': 'Côte-d\'Or', '22': 'Côtes-d\'Armor', '23': 'Creuse',
  '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme', '27': 'Eure',
  '28': 'Eure-et-Loir', '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne',
  '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine',
  '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire',
  '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne',
  '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne',
  '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse',
  '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme',
  '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône',
  '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie',
  '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines',
  '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
  '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne',
  '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort',
  '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne', '95': 'Val-d\'Oise',
};

// ── Role config ────────────────────────────────────────
export const roleConfig: Record<UserRole, { label: string; color: string; icon: string; level: number }> = {
  admin:      { label: 'Administrateur', color: 'bg-destructive/15 text-destructive', icon: '👑', level: 0 },
  directeur:  { label: 'Directeur',      color: 'bg-primary/15 text-primary',         icon: '🎯', level: 1 },
  manager:    { label: 'Manager',         color: 'bg-accent/15 text-accent-foreground', icon: '📋', level: 2 },
  commercial: { label: 'Commercial',      color: 'bg-tag-qualified/15 text-tag-qualified', icon: '💼', level: 3 },
};

// ── Mock zones ─────────────────────────────────────────
export const zones: Zone[] = [
  { id: 'z1', name: 'Grand Ouest', departments: ['29', '35', '44', '49', '53', '56', '22', '85', '72'], color: 'hsl(210, 80%, 55%)' },
  { id: 'z2', name: 'Île-de-France', departments: ['75', '77', '78', '91', '92', '93', '94', '95'], color: 'hsl(38, 90%, 55%)' },
  { id: 'z3', name: 'Sud-Est', departments: ['06', '13', '83', '84', '30', '34'], color: 'hsl(150, 60%, 45%)' },
  { id: 'z4', name: 'Nord', departments: ['59', '62', '80', '60', '02'], color: 'hsl(280, 60%, 55%)' },
  { id: 'z5', name: 'Sud-Ouest', departments: ['33', '40', '64', '31', '32', '47'], color: 'hsl(0, 70%, 55%)' },
];

// ── Mock users ─────────────────────────────────────────
export const networkUsers: NetworkUser[] = [
  // Admin
  {
    id: 'u0', firstName: 'Philippe', lastName: 'Moreau', email: 'p.moreau@modulahome.fr',
    phone: '06 10 00 00 01', avatar: 'PM', role: 'admin', parentId: null,
    zoneIds: [], isActive: true, createdAt: '2023-01-01', leadsCount: 0, conversionRate: 0,
  },
  // Directeurs
  {
    id: 'u1', firstName: 'Marie', lastName: 'Dupont', email: 'marie.dupont@modulahome.fr',
    phone: '06 12 34 56 78', avatar: 'MD', role: 'directeur', parentId: 'u0',
    zoneIds: ['z1', 'z4'], isActive: true, createdAt: '2023-03-15', leadsCount: 34, conversionRate: 28,
  },
  {
    id: 'u2', firstName: 'Laurent', lastName: 'Martin', email: 'l.martin@modulahome.fr',
    phone: '06 23 45 67 89', avatar: 'LM', role: 'directeur', parentId: 'u0',
    zoneIds: ['z2', 'z3'], isActive: true, createdAt: '2023-04-01', leadsCount: 42, conversionRate: 32,
  },
  {
    id: 'u6', firstName: 'Élise', lastName: 'Bernard', email: 'e.bernard@modulahome.fr',
    phone: '06 34 56 78 90', avatar: 'ÉB', role: 'directeur', parentId: 'u0',
    zoneIds: ['z5'], isActive: true, createdAt: '2023-06-01', leadsCount: 18, conversionRate: 22,
  },
  // Managers
  {
    id: 'u3', firstName: 'Thomas', lastName: 'Bernard', email: 't.bernard@modulahome.fr',
    phone: '06 34 56 78 90', avatar: 'TB', role: 'manager', parentId: 'u1',
    zoneIds: ['z1'], isActive: true, createdAt: '2023-06-01', leadsCount: 18, conversionRate: 22,
  },
  {
    id: 'u7', firstName: 'Camille', lastName: 'Leroy', email: 'c.leroy@modulahome.fr',
    phone: '06 45 67 89 01', avatar: 'CL', role: 'manager', parentId: 'u2',
    zoneIds: ['z2'], isActive: true, createdAt: '2023-07-15', leadsCount: 22, conversionRate: 30,
  },
  // Commerciaux
  {
    id: 'u4', firstName: 'Sophie', lastName: 'Martin', email: 's.martin@modulahome.fr',
    phone: '06 45 67 89 01', avatar: 'SM', role: 'commercial', parentId: 'u3',
    zoneIds: ['z1'], isActive: true, createdAt: '2023-09-01', leadsCount: 15, conversionRate: 20,
  },
  {
    id: 'u5', firstName: 'Lucas', lastName: 'Petit', email: 'l.petit@modulahome.fr',
    phone: '06 56 78 90 12', avatar: 'LP', role: 'commercial', parentId: 'u3',
    zoneIds: ['z1'], isActive: true, createdAt: '2023-10-15', leadsCount: 8, conversionRate: 12,
  },
  {
    id: 'u8', firstName: 'Emma', lastName: 'Rousseau', email: 'e.rousseau@modulahome.fr',
    phone: '06 67 89 01 23', avatar: 'ER', role: 'commercial', parentId: 'u7',
    zoneIds: ['z2'], isActive: true, createdAt: '2024-01-10', leadsCount: 10, conversionRate: 18,
  },
  {
    id: 'u9', firstName: 'Hugo', lastName: 'Faure', email: 'h.faure@modulahome.fr',
    phone: '06 78 90 12 34', avatar: 'HF', role: 'commercial', parentId: 'u1',
    zoneIds: ['z4'], isActive: true, createdAt: '2024-02-01', leadsCount: 6, conversionRate: 15,
  },
  {
    id: 'u10', firstName: 'Léa', lastName: 'Girard', email: 'l.girard@modulahome.fr',
    phone: '06 89 01 23 45', avatar: 'LG', role: 'commercial', parentId: 'u6',
    zoneIds: ['z5'], isActive: false, createdAt: '2024-01-20', leadsCount: 4, conversionRate: 10,
  },
];

// ── Helpers ────────────────────────────────────────────
export function getChildren(userId: string): NetworkUser[] {
  return networkUsers.filter(u => u.parentId === userId);
}

export function getZoneName(zoneId: string): string {
  return zones.find(z => z.id === zoneId)?.name ?? 'Non assigné';
}

export function getUserFullName(user: NetworkUser): string {
  return `${user.firstName} ${user.lastName}`;
}

export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return roleConfig[managerRole].level < roleConfig[targetRole].level;
}
