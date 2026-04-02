export type LeadStatus = 'nouveau' | 'contacté' | 'qualifié' | 'proposition' | 'négociation' | 'gagné' | 'perdu';

export type HouseModel = 'Studio 25m²' | 'Duo 35m²' | 'Family 45m²' | 'Tiny 20m²' | 'Loft 40m²';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  status: LeadStatus;
  tags: string[];
  assignedTo: string;
  houseModel: HouseModel;
  budget: number;
  surface: number;
  source: string;
  createdAt: string;
  lastContact: string;
  notes: Note[];
  messages: ChatMessage[];
  score: number;
}

export interface Note {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  role: string;
  leadsCount: number;
}

export const salesReps: SalesRep[] = [
  { id: '1', name: 'Marie Dupont', avatar: 'MD', role: 'Directrice Commerciale', leadsCount: 12 },
  { id: '2', name: 'Thomas Bernard', avatar: 'TB', role: 'Commercial Senior', leadsCount: 8 },
  { id: '3', name: 'Sophie Martin', avatar: 'SM', role: 'Commerciale', leadsCount: 15 },
  { id: '4', name: 'Lucas Petit', avatar: 'LP', role: 'Commercial Junior', leadsCount: 6 },
];

export const houseModels: HouseModel[] = ['Studio 25m²', 'Duo 35m²', 'Family 45m²', 'Tiny 20m²', 'Loft 40m²'];

export const statusConfig: Record<LeadStatus, { label: string; color: string; bgClass: string }> = {
  'nouveau': { label: 'Nouveau', color: 'tag-new', bgClass: 'bg-tag-new/15 text-tag-new' },
  'contacté': { label: 'Contacté', color: 'tag-contacted', bgClass: 'bg-tag-contacted/15 text-tag-contacted' },
  'qualifié': { label: 'Qualifié', color: 'tag-qualified', bgClass: 'bg-tag-qualified/15 text-tag-qualified' },
  'proposition': { label: 'Proposition', color: 'tag-proposal', bgClass: 'bg-tag-proposal/15 text-tag-proposal' },
  'négociation': { label: 'Négociation', color: 'tag-negotiation', bgClass: 'bg-tag-negotiation/15 text-tag-negotiation' },
  'gagné': { label: 'Gagné', color: 'tag-won', bgClass: 'bg-tag-won/15 text-tag-won' },
  'perdu': { label: 'Perdu', color: 'tag-lost', bgClass: 'bg-tag-lost/15 text-tag-lost' },
};

export const leads: Lead[] = [
  {
    id: '1', firstName: 'Jean', lastName: 'Moreau', email: 'jean.moreau@email.fr', phone: '06 12 34 56 78',
    address: '15 Rue de la Paix', city: 'Paris', postalCode: '75002', lat: 48.8698, lng: 2.3311,
    status: 'qualifié', tags: ['Terrain disponible', 'Urgent'], assignedTo: '1', houseModel: 'Family 45m²',
    budget: 85000, surface: 45, source: 'Site web', createdAt: '2024-03-15', lastContact: '2024-03-28',
    score: 85, notes: [{ id: 'n1', author: 'Marie Dupont', content: 'Terrain de 400m² à Vincennes, PLU vérifié. Client très motivé, souhaite emménager avant septembre.', createdAt: '2024-03-20' }],
    messages: [{ id: 'm1', author: 'Marie Dupont', content: 'Premier appel effectué, très intéressé par le modèle Family.', createdAt: '2024-03-16', isInternal: true }],
  },
  {
    id: '2', firstName: 'Claire', lastName: 'Dubois', email: 'claire.dubois@email.fr', phone: '06 98 76 54 32',
    address: '8 Avenue des Champs', city: 'Lyon', postalCode: '69003', lat: 45.7578, lng: 4.8320,
    status: 'proposition', tags: ['Premium', 'Financement OK'], assignedTo: '2', houseModel: 'Loft 40m²',
    budget: 72000, surface: 40, source: 'Salon immobilier', createdAt: '2024-03-10', lastContact: '2024-03-27',
    score: 92, notes: [], messages: [],
  },
  {
    id: '3', firstName: 'Pierre', lastName: 'Laurent', email: 'p.laurent@email.fr', phone: '06 55 44 33 22',
    address: '22 Rue du Port', city: 'Nantes', postalCode: '44000', lat: 47.2184, lng: -1.5536,
    status: 'nouveau', tags: ['Premier achat'], assignedTo: '3', houseModel: 'Studio 25m²',
    budget: 42000, surface: 25, source: 'Facebook Ads', createdAt: '2024-03-25', lastContact: '2024-03-25',
    score: 45, notes: [], messages: [],
  },
  {
    id: '4', firstName: 'Isabelle', lastName: 'Roux', email: 'i.roux@email.fr', phone: '06 11 22 33 44',
    address: '5 Place de la Comédie', city: 'Montpellier', postalCode: '34000', lat: 43.6087, lng: 3.8795,
    status: 'contacté', tags: ['Investisseur', 'Multi-projets'], assignedTo: '1', houseModel: 'Duo 35m²',
    budget: 58000, surface: 35, source: 'Recommandation', createdAt: '2024-03-18', lastContact: '2024-03-26',
    score: 68, notes: [{ id: 'n2', author: 'Marie Dupont', content: 'Investisseuse, souhaite acheter 3 maisons pour de la location saisonnière.', createdAt: '2024-03-19' }],
    messages: [],
  },
  {
    id: '5', firstName: 'Marc', lastName: 'Lefèvre', email: 'marc.l@email.fr', phone: '06 77 88 99 00',
    address: '12 Cours Mirabeau', city: 'Aix-en-Provence', postalCode: '13100', lat: 43.5263, lng: 5.4454,
    status: 'négociation', tags: ['Terrain disponible', 'Financement OK'], assignedTo: '2', houseModel: 'Family 45m²',
    budget: 89000, surface: 45, source: 'Google Ads', createdAt: '2024-03-05', lastContact: '2024-03-29',
    score: 88, notes: [], messages: [],
  },
  {
    id: '6', firstName: 'Anne', lastName: 'Petit', email: 'anne.petit@email.fr', phone: '06 33 22 11 00',
    address: '3 Rue Nationale', city: 'Lille', postalCode: '59000', lat: 50.6292, lng: 3.0573,
    status: 'gagné', tags: ['Premium', 'Terrain disponible'], assignedTo: '3', houseModel: 'Loft 40m²',
    budget: 76000, surface: 40, source: 'Site web', createdAt: '2024-02-20', lastContact: '2024-03-28',
    score: 100, notes: [], messages: [],
  },
  {
    id: '7', firstName: 'François', lastName: 'Simon', email: 'f.simon@email.fr', phone: '06 44 55 66 77',
    address: '18 Quai des Chartrons', city: 'Bordeaux', postalCode: '33000', lat: 44.8525, lng: -0.5695,
    status: 'perdu', tags: ['Budget limité'], assignedTo: '4', houseModel: 'Tiny 20m²',
    budget: 32000, surface: 20, source: 'Instagram', createdAt: '2024-03-01', lastContact: '2024-03-15',
    score: 20, notes: [{ id: 'n3', author: 'Lucas Petit', content: 'Budget insuffisant, pas de terrain. Relancer dans 6 mois.', createdAt: '2024-03-15' }],
    messages: [],
  },
  {
    id: '8', firstName: 'Sophie', lastName: 'Garcia', email: 's.garcia@email.fr', phone: '06 99 88 77 66',
    address: '7 Place du Capitole', city: 'Toulouse', postalCode: '31000', lat: 43.6047, lng: 1.4442,
    status: 'qualifié', tags: ['Urgent', 'Permis en cours'], assignedTo: '4', houseModel: 'Duo 35m²',
    budget: 55000, surface: 35, source: 'Salon immobilier', createdAt: '2024-03-12', lastContact: '2024-03-27',
    score: 72, notes: [], messages: [],
  },
  {
    id: '9', firstName: 'David', lastName: 'Mercier', email: 'd.mercier@email.fr', phone: '06 22 33 44 55',
    address: '10 Rue de Siam', city: 'Brest', postalCode: '29200', lat: 48.3904, lng: -4.4861,
    status: 'contacté', tags: ['Retraité'], assignedTo: '3', houseModel: 'Studio 25m²',
    budget: 45000, surface: 25, source: 'Recommandation', createdAt: '2024-03-22', lastContact: '2024-03-26',
    score: 55, notes: [], messages: [],
  },
  {
    id: '10', firstName: 'Nathalie', lastName: 'Fournier', email: 'n.fournier@email.fr', phone: '06 66 55 44 33',
    address: '25 Promenade des Anglais', city: 'Nice', postalCode: '06000', lat: 43.6961, lng: 7.2661,
    status: 'nouveau', tags: ['Résidence secondaire'], assignedTo: '2', houseModel: 'Tiny 20m²',
    budget: 38000, surface: 20, source: 'Site web', createdAt: '2024-03-28', lastContact: '2024-03-28',
    score: 40, notes: [], messages: [],
  },
];
