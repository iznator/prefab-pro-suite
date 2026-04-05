// ===== Configurator Data & Pricing Logic =====

export interface HouseModelConfig {
  id: string;
  name: string;
  surface: number;
  basePrice: number; // HT
  description: string;
  bedrooms: number;
  bathrooms: number;
  image?: string;
}

export interface FinishOption {
  id: string;
  name: string;
  description: string;
  priceModifier: number; // flat amount added HT
  category: 'finish';
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  priceModifier: number;
  category: 'exterior' | 'interior';
}

export interface ExtraOption {
  id: string;
  name: string;
  description: string;
  price: number; // HT
  category: 'extra';
}

export interface DeliveryConfig {
  baseAddress: string;
  baseCity: string;
  baseLat: number;
  baseLng: number;
  pricePerKm: number; // €/km HT
  minimumDeliveryFee: number;
}

export interface QuoteResult {
  model: HouseModelConfig;
  finish: FinishOption;
  exteriorStyle: StyleOption;
  interiorStyle: StyleOption;
  extras: ExtraOption[];
  deliveryDistanceKm: number;
  deliveryFee: number;
  subtotalHT: number;
  tva: number;
  totalTTC: number;
  clientInfo: ClientInfo;
}

export interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

// ===== Models =====
export const houseModels: HouseModelConfig[] = [
  {
    id: 'tiny-20',
    name: 'Tiny 20m²',
    surface: 20,
    basePrice: 28000,
    description: 'Compact et fonctionnel. Idéal pour un studio, un bureau de jardin ou une résidence secondaire.',
    bedrooms: 0,
    bathrooms: 1,
  },
  {
    id: 'studio-25',
    name: 'Studio 25m²',
    surface: 25,
    basePrice: 35000,
    description: 'Un espace optimisé avec coin nuit séparé. Parfait pour un premier achat ou un investissement locatif.',
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: 'duo-35',
    name: 'Duo 35m²',
    surface: 35,
    basePrice: 48000,
    description: 'Deux espaces de vie distincts, idéal pour un couple. Salon lumineux et chambre spacieuse.',
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: 'loft-40',
    name: 'Loft 40m²',
    surface: 40,
    basePrice: 58000,
    description: 'Grand volume ouvert avec mezzanine. Design contemporain et luminosité maximale.',
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: 'family-45',
    name: 'Family 45m²',
    surface: 45,
    basePrice: 68000,
    description: 'Notre modèle le plus spacieux. Deux chambres, un vrai séjour et une cuisine équipée.',
    bedrooms: 2,
    bathrooms: 1,
  },
];

// ===== Finitions =====
export const finishOptions: FinishOption[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Finitions de qualité : sol vinyle, peinture blanche, cuisine basique, salle de bain fonctionnelle.',
    priceModifier: 0,
    category: 'finish',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Parquet chêne clair, peinture premium, cuisine équipée complète, salle de bain design.',
    priceModifier: 8500,
    category: 'finish',
  },
  {
    id: 'luxe',
    name: 'Luxe',
    description: 'Matériaux haut de gamme, domotique intégrée, cuisine sur mesure, salle de bain italienne.',
    priceModifier: 18000,
    category: 'finish',
  },
];

// ===== Styles extérieurs =====
export const exteriorStyles: StyleOption[] = [
  {
    id: 'ext-moderne',
    name: 'Moderne',
    description: 'Bardage composite gris anthracite, lignes épurées, grandes baies vitrées.',
    priceModifier: 0,
    category: 'exterior',
  },
  {
    id: 'ext-bois',
    name: 'Bois naturel',
    description: 'Bardage bois Douglas traité, aspect chaleureux et naturel.',
    priceModifier: 3200,
    category: 'exterior',
  },
  {
    id: 'ext-scandinave',
    name: 'Scandinave',
    description: 'Bardage bois peint, couleurs douces, toiture végétalisée en option.',
    priceModifier: 4500,
    category: 'exterior',
  },
  {
    id: 'ext-industriel',
    name: 'Industriel',
    description: 'Métal et verre, aspect container revisité, toiture plate.',
    priceModifier: 2800,
    category: 'exterior',
  },
];

// ===== Styles intérieurs =====
export const interiorStyles: StyleOption[] = [
  {
    id: 'int-contemporain',
    name: 'Contemporain',
    description: 'Blanc et bois clair, minimaliste et lumineux.',
    priceModifier: 0,
    category: 'interior',
  },
  {
    id: 'int-cosy',
    name: 'Cosy',
    description: 'Tons chauds, bois apparent, ambiance chaleureuse.',
    priceModifier: 2200,
    category: 'interior',
  },
  {
    id: 'int-design',
    name: 'Design',
    description: 'Noir mat, béton ciré, touches dorées, ultra moderne.',
    priceModifier: 4800,
    category: 'interior',
  },
  {
    id: 'int-nature',
    name: 'Nature',
    description: 'Matériaux naturels, pierre, bois brut, palette terreuse.',
    priceModifier: 3500,
    category: 'interior',
  },
];

// ===== Options supplémentaires =====
export const extraOptions: ExtraOption[] = [
  { id: 'solar', name: 'Panneaux solaires', description: '4 panneaux (1.6 kWc), autoconsommation', price: 6500, category: 'extra' },
  { id: 'battery', name: 'Batterie de stockage', description: 'Batterie lithium 5kWh pour autonomie', price: 4200, category: 'extra' },
  { id: 'heatpump', name: 'Pompe à chaleur', description: 'PAC air/air réversible chaud/froid', price: 5800, category: 'extra' },
  { id: 'terrace', name: 'Terrasse bois', description: 'Terrasse en bois composite 15m²', price: 3800, category: 'extra' },
  { id: 'pergola', name: 'Pergola bioclimatique', description: 'Pergola lames orientables 12m²', price: 7200, category: 'extra' },
  { id: 'carport', name: 'Carport', description: 'Abri voiture assorti au style extérieur', price: 4500, category: 'extra' },
  { id: 'domotic', name: 'Pack domotique', description: 'Volets, éclairage, chauffage connectés', price: 3200, category: 'extra' },
  { id: 'water-recovery', name: 'Récupérateur d\'eau', description: 'Cuve enterrée 3000L + raccordement', price: 2800, category: 'extra' },
];

// ===== Configuration livraison =====
export const defaultDeliveryConfig: DeliveryConfig = {
  baseAddress: '12 Zone Industrielle',
  baseCity: 'Nantes',
  baseLat: 47.2184,
  baseLng: -1.5536,
  pricePerKm: 3.50,
  minimumDeliveryFee: 500,
};

// ===== TVA =====
export const TVA_RATE = 0.20;

// ===== Pricing Calculator =====
export function calculateQuote(params: {
  model: HouseModelConfig;
  finish: FinishOption;
  exteriorStyle: StyleOption;
  interiorStyle: StyleOption;
  extras: ExtraOption[];
  deliveryDistanceKm: number;
  deliveryConfig?: DeliveryConfig;
}): { basePrice: number; finishPrice: number; exteriorPrice: number; interiorPrice: number; extrasTotal: number; deliveryFee: number; subtotalHT: number; tva: number; totalTTC: number } {
  const config = params.deliveryConfig || defaultDeliveryConfig;

  const basePrice = params.model.basePrice;
  const finishPrice = params.finish.priceModifier;
  const exteriorPrice = params.exteriorStyle.priceModifier;
  const interiorPrice = params.interiorStyle.priceModifier;
  const extrasTotal = params.extras.reduce((sum, e) => sum + e.price, 0);

  const rawDelivery = params.deliveryDistanceKm * config.pricePerKm;
  const deliveryFee = Math.max(rawDelivery, config.minimumDeliveryFee);

  const subtotalHT = basePrice + finishPrice + exteriorPrice + interiorPrice + extrasTotal + deliveryFee;
  const tva = subtotalHT * TVA_RATE;
  const totalTTC = subtotalHT + tva;

  return {
    basePrice,
    finishPrice,
    exteriorPrice,
    interiorPrice,
    extrasTotal,
    deliveryFee,
    subtotalHT,
    tva,
    totalTTC,
  };
}

// ===== Distance calculation (Haversine) =====
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.3); // x1.3 for road factor
}

// ===== French city coordinates (common) =====
export const frenchCities: Record<string, { lat: number; lng: number }> = {
  'paris': { lat: 48.8566, lng: 2.3522 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'toulouse': { lat: 43.6047, lng: 1.4442 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'montpellier': { lat: 43.6108, lng: 3.8767 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  'lille': { lat: 50.6292, lng: 3.0573 },
  'rennes': { lat: 48.1173, lng: -1.6778 },
  'reims': { lat: 49.2583, lng: 3.5235 },
  'le havre': { lat: 49.4944, lng: 0.1079 },
  'saint-étienne': { lat: 45.4397, lng: 4.3872 },
  'toulon': { lat: 43.1242, lng: 5.9280 },
  'grenoble': { lat: 45.1885, lng: 5.7245 },
  'dijon': { lat: 47.3220, lng: 5.0415 },
  'angers': { lat: 47.4784, lng: -0.5632 },
  'nîmes': { lat: 43.8367, lng: 4.3601 },
  'aix-en-provence': { lat: 43.5297, lng: 5.4474 },
  'brest': { lat: 48.3904, lng: -4.4861 },
  'clermont-ferrand': { lat: 45.7772, lng: 3.0870 },
  'tours': { lat: 47.3941, lng: 0.6848 },
  'limoges': { lat: 45.8336, lng: 1.2611 },
  'amiens': { lat: 49.8941, lng: 2.2958 },
  'perpignan': { lat: 42.6887, lng: 2.8948 },
  'metz': { lat: 49.1193, lng: 6.1757 },
  'besançon': { lat: 47.2378, lng: 6.0241 },
  'orléans': { lat: 47.9029, lng: 1.9093 },
  'rouen': { lat: 49.4432, lng: 1.0993 },
  'caen': { lat: 49.1829, lng: -0.3707 },
  'nancy': { lat: 48.6921, lng: 6.1844 },
  'pau': { lat: 43.2951, lng: -0.3708 },
  'la rochelle': { lat: 46.1603, lng: -1.1511 },
  'poitiers': { lat: 46.5802, lng: 0.3404 },
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
