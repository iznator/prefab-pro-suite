import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  houseModels, finishOptions, exteriorStyles, interiorStyles, extraOptions,
  defaultDeliveryConfig, calculateDistance, frenchCities, formatPrice, TVA_RATE,
  type HouseModelConfig, type FinishOption, type StyleOption, type ExtraOption, type ClientInfo,
} from "@/data/configuratorData";
import {
  Home, Paintbrush, Palette, Truck, User, FileText,
  Check, ChevronLeft, ChevronRight, Maximize, BedDouble, Bath,
  Plus, Minus, MapPin, Package, Trash2, X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types for multi-house configurator ──
interface HouseConfig {
  id: string;
  model: HouseModelConfig;
  quantity: number;
  finish: FinishOption;
  exteriorStyle: StyleOption;
  interiorStyle: StyleOption;
  extras: ExtraOption[];
}

function createHouseConfig(model: HouseModelConfig): HouseConfig {
  return {
    id: `house-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    model,
    quantity: 1,
    finish: finishOptions[0],
    exteriorStyle: exteriorStyles[0],
    interiorStyle: interiorStyles[0],
    extras: [],
  };
}

function getHouseUnitPrice(h: HouseConfig): number {
  return h.model.basePrice + h.finish.priceModifier + h.exteriorStyle.priceModifier
    + h.interiorStyle.priceModifier + h.extras.reduce((s, e) => s + e.price, 0);
}

const STEPS = [
  { id: 'models', label: 'Maisons', icon: Home },
  { id: 'options', label: 'Options', icon: Paintbrush },
  { id: 'delivery', label: 'Livraison', icon: Truck },
  { id: 'client', label: 'Client', icon: User },
  { id: 'summary', label: 'Devis', icon: FileText },
];

export default function ConfigurateurPage() {
  const [step, setStep] = useState(0);
  const [houses, setHouses] = useState<HouseConfig[]>([]);
  const [activeHouseTab, setActiveHouseTab] = useState(0);

  // Delivery
  const [clientCity, setClientCity] = useState("");
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);

  // Client
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', postalCode: ''
  });

  // ── House management ──
  const addHouse = (model: HouseModelConfig) => {
    const existing = houses.find(h => h.model.id === model.id);
    if (existing) {
      updateHouse(existing.id, { quantity: existing.quantity + 1 });
    } else {
      setHouses(prev => [...prev, createHouseConfig(model)]);
      setActiveHouseTab(houses.length); // switch to new tab
    }
  };

  const removeHouse = (id: string) => {
    setHouses(prev => prev.filter(h => h.id !== id));
    setActiveHouseTab(0);
  };

  const updateHouse = (id: string, updates: Partial<HouseConfig>) => {
    setHouses(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const toggleExtra = (houseId: string, extra: ExtraOption) => {
    setHouses(prev => prev.map(h => {
      if (h.id !== houseId) return h;
      const has = h.extras.some(e => e.id === extra.id);
      return { ...h, extras: has ? h.extras.filter(e => e.id !== extra.id) : [...h.extras, extra] };
    }));
  };

  // ── Delivery ──
  const estimateDelivery = () => {
    const cityKey = clientCity.toLowerCase().trim();
    const coords = frenchCities[cityKey];
    if (coords) {
      const dist = calculateDistance(defaultDeliveryConfig.baseLat, defaultDeliveryConfig.baseLng, coords.lat, coords.lng);
      setDeliveryDistance(dist);
      setClientInfo(prev => ({ ...prev, city: clientCity }));
      toast.success(`Distance estimée : ${dist} km depuis ${defaultDeliveryConfig.baseCity}`);
    } else {
      toast.error("Ville non reconnue. Essayez une grande ville française.");
    }
  };

  // ── Totals ──
  const totals = useMemo(() => {
    const housesSubtotal = houses.reduce((s, h) => s + getHouseUnitPrice(h) * h.quantity, 0);
    const totalQty = houses.reduce((s, h) => s + h.quantity, 0);
    const rawDelivery = (deliveryDistance || 0) * defaultDeliveryConfig.pricePerKm * totalQty;
    const deliveryFee = totalQty > 0 && deliveryDistance ? Math.max(rawDelivery, defaultDeliveryConfig.minimumDeliveryFee) : 0;
    const subtotalHT = housesSubtotal + deliveryFee;
    const tva = subtotalHT * TVA_RATE;
    const totalTTC = subtotalHT + tva;
    return { housesSubtotal, deliveryFee, subtotalHT, tva, totalTTC, totalQty };
  }, [houses, deliveryDistance]);

  const canProceed = () => {
    switch (step) {
      case 0: return houses.length > 0;
      case 1: return true;
      case 2: return deliveryDistance !== null;
      case 3: return !!(clientInfo.firstName && clientInfo.lastName && clientInfo.email && clientInfo.phone);
      default: return true;
    }
  };

  const activeHouse = houses[activeHouseTab] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configurateur de devis</h1>
        <p className="text-muted-foreground mt-1">Créez un devis multi-maisons en quelques clics.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={s.id}
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                isActive && "bg-primary text-primary-foreground shadow-sm",
                isDone && "bg-primary/10 text-primary cursor-pointer",
                !isActive && !isDone && "text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                isActive && "bg-primary-foreground/20",
                isDone && "bg-primary/20"
              )}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
              {i === 0 && houses.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] h-5">{houses.length}</Badge>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">

              {/* ════════ STEP 0: Sélection des maisons ════════ */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Choisissez les maisons</h2>
                    <p className="text-sm text-muted-foreground">Cliquez pour ajouter un modèle au devis. Ajustez la quantité ensuite.</p>
                  </div>

                  {/* Models grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {houseModels.map(model => {
                      const inCart = houses.find(h => h.model.id === model.id);
                      return (
                        <button
                          key={model.id}
                          onClick={() => addHouse(model)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all hover:shadow-md relative",
                            inCart ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                          )}
                        >
                          {inCart && (
                            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                              ×{inCart.quantity}
                            </Badge>
                          )}
                          <h3 className="font-display font-semibold text-foreground">{model.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 mb-3">{model.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" />{model.surface}m²</span>
                            <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{model.bedrooms} ch.</span>
                            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{model.bathrooms} sdb</span>
                          </div>
                          <p className="font-display font-bold text-lg text-foreground">
                            {formatPrice(model.basePrice)} <span className="text-xs font-normal text-muted-foreground">HT</span>
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected houses list */}
                  {houses.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium text-foreground mb-3">Maisons sélectionnées ({totals.totalQty} unité{totals.totalQty > 1 ? 's' : ''})</h3>
                        <div className="space-y-2">
                          {houses.map(h => (
                            <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">{h.model.name}</p>
                                <p className="text-xs text-muted-foreground">{formatPrice(h.model.basePrice)} HT/unité</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-7 h-7"
                                  onClick={(e) => { e.stopPropagation(); updateHouse(h.id, { quantity: Math.max(1, h.quantity - 1) }); }}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-semibold text-sm">{h.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-7 h-7"
                                  onClick={(e) => { e.stopPropagation(); updateHouse(h.id, { quantity: h.quantity + 1 }); }}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); removeHouse(h.id); }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ════════ STEP 1: Options par maison (onglets horizontaux) ════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Personnalisez chaque maison</h2>
                    <p className="text-sm text-muted-foreground">Sélectionnez un onglet pour configurer les options de chaque modèle.</p>
                  </div>

                  {/* Horizontal tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1 border-b">
                    {houses.map((h, idx) => (
                      <button
                        key={h.id}
                        onClick={() => setActiveHouseTab(idx)}
                        className={cn(
                          "px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-all border-b-2 -mb-px",
                          idx === activeHouseTab
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Home className="w-3.5 h-3.5" />
                          {h.model.name}
                          {h.quantity > 1 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">×{h.quantity}</Badge>}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Active house options */}
                  {activeHouse && (
                    <div className="space-y-6">
                      {/* Finition */}
                      <div>
                        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <Paintbrush className="w-4 h-4 text-primary" /> Finition
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {finishOptions.map(finish => (
                            <button
                              key={finish.id}
                              onClick={() => updateHouse(activeHouse.id, { finish })}
                              className={cn(
                                "p-3 rounded-lg border-2 text-left transition-all",
                                activeHouse.finish.id === finish.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-foreground text-sm">{finish.name}</h4>
                                {activeHouse.finish.id === finish.id && (
                                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{finish.description}</p>
                              <p className="text-xs font-semibold mt-2">
                                {finish.priceModifier === 0 ? 'Inclus' : `+${formatPrice(finish.priceModifier)}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Style extérieur */}
                      <div>
                        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <Home className="w-4 h-4 text-primary" /> Style extérieur
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {exteriorStyles.map(style => (
                            <button
                              key={style.id}
                              onClick={() => updateHouse(activeHouse.id, { exteriorStyle: style })}
                              className={cn(
                                "p-3 rounded-lg border-2 text-left transition-all",
                                activeHouse.exteriorStyle.id === style.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-foreground text-sm">{style.name}</h4>
                                {activeHouse.exteriorStyle.id === style.id && (
                                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{style.description}</p>
                              <p className="text-xs font-semibold mt-1.5">
                                {style.priceModifier === 0 ? 'Inclus' : `+${formatPrice(style.priceModifier)}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Style intérieur */}
                      <div>
                        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-primary" /> Style intérieur
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {interiorStyles.map(style => (
                            <button
                              key={style.id}
                              onClick={() => updateHouse(activeHouse.id, { interiorStyle: style })}
                              className={cn(
                                "p-3 rounded-lg border-2 text-left transition-all",
                                activeHouse.interiorStyle.id === style.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-foreground text-sm">{style.name}</h4>
                                {activeHouse.interiorStyle.id === style.id && (
                                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{style.description}</p>
                              <p className="text-xs font-semibold mt-1.5">
                                {style.priceModifier === 0 ? 'Inclus' : `+${formatPrice(style.priceModifier)}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Extras */}
                      <div>
                        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" /> Options supplémentaires
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {extraOptions.map(extra => {
                            const isSelected = activeHouse.extras.some(e => e.id === extra.id);
                            return (
                              <button
                                key={extra.id}
                                onClick={() => toggleExtra(activeHouse.id, extra)}
                                className={cn(
                                  "p-3 rounded-lg border-2 text-left transition-all",
                                  isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground text-sm">{extra.name}</h4>
                                    <p className="text-xs text-muted-foreground">{extra.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2 shrink-0">
                                    <span className="text-xs font-semibold">{formatPrice(extra.price)}</span>
                                    <div className={cn(
                                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                    )}>
                                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Per-house subtotal */}
                      <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Sous-total {activeHouse.model.name} × {activeHouse.quantity}
                        </span>
                        <span className="font-display font-bold text-foreground">
                          {formatPrice(getHouseUnitPrice(activeHouse) * activeHouse.quantity)} HT
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ STEP 2: Livraison ════════ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Livraison</h2>
                    <p className="text-sm text-muted-foreground">
                      Coût calculé depuis {defaultDeliveryConfig.baseCity} — {totals.totalQty} unité{totals.totalQty > 1 ? 's' : ''} à livrer.
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> <strong>Départ :</strong> {defaultDeliveryConfig.baseCity}</p>
                    <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /> <strong>Tarif :</strong> {formatPrice(defaultDeliveryConfig.pricePerKm)}/km × {totals.totalQty} unité{totals.totalQty > 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Minimum : {formatPrice(defaultDeliveryConfig.minimumDeliveryFee)}</p>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Ville du client (ex: Paris, Lyon, Bordeaux...)"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && estimateDelivery()}
                      className="flex-1"
                    />
                    <Button onClick={estimateDelivery}>Calculer</Button>
                  </div>
                  {deliveryDistance !== null && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-foreground">📍 Distance estimée : {deliveryDistance} km</p>
                      <p className="text-foreground">💰 Coût de livraison : <strong>{formatPrice(totals.deliveryFee)} HT</strong></p>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ STEP 3: Client ════════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Informations client</h2>
                    <p className="text-sm text-muted-foreground">Renseignez les coordonnées du client pour le devis.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom *</Label>
                      <Input value={clientInfo.firstName} onChange={e => setClientInfo(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Jean" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input value={clientInfo.lastName} onChange={e => setClientInfo(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Dupont" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={clientInfo.email} onChange={e => setClientInfo(prev => ({ ...prev, email: e.target.value }))} placeholder="jean@example.fr" />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone *</Label>
                      <Input value={clientInfo.phone} onChange={e => setClientInfo(prev => ({ ...prev, phone: e.target.value }))} placeholder="06 12 34 56 78" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Adresse</Label>
                      <Input value={clientInfo.address} onChange={e => setClientInfo(prev => ({ ...prev, address: e.target.value }))} placeholder="15 Rue de la Paix" />
                    </div>
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input value={clientInfo.city || clientCity} onChange={e => setClientInfo(prev => ({ ...prev, city: e.target.value }))} placeholder="Paris" />
                    </div>
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input value={clientInfo.postalCode} onChange={e => setClientInfo(prev => ({ ...prev, postalCode: e.target.value }))} placeholder="75001" />
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ STEP 4: Récapitulatif ════════ */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Récapitulatif du devis</h2>
                    <p className="text-sm text-muted-foreground">Vérifiez les détails avant de générer le PDF.</p>
                  </div>

                  <div className="space-y-4">
                    {houses.map(h => {
                      const unitPrice = getHouseUnitPrice(h);
                      return (
                        <div key={h.id} className="bg-muted/30 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-foreground">{h.model.name} × {h.quantity}</p>
                              <p className="text-xs text-muted-foreground">
                                {h.finish.name} · {h.exteriorStyle.name} · {h.interiorStyle.name}
                              </p>
                            </div>
                            <span className="font-display font-bold">{formatPrice(unitPrice * h.quantity)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5 pl-2 border-l-2 border-primary/20">
                            <p>Base : {formatPrice(h.model.basePrice)}</p>
                            {h.finish.priceModifier > 0 && <p>Finition {h.finish.name} : +{formatPrice(h.finish.priceModifier)}</p>}
                            {h.exteriorStyle.priceModifier > 0 && <p>Ext. {h.exteriorStyle.name} : +{formatPrice(h.exteriorStyle.priceModifier)}</p>}
                            {h.interiorStyle.priceModifier > 0 && <p>Int. {h.interiorStyle.name} : +{formatPrice(h.interiorStyle.priceModifier)}</p>}
                            {h.extras.map(e => <p key={e.id}>{e.name} : +{formatPrice(e.price)}</p>)}
                            <p className="font-medium text-foreground pt-1">= {formatPrice(unitPrice)}/unité × {h.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total maisons</span>
                      <span className="font-medium">{formatPrice(totals.housesSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Livraison ({deliveryDistance} km × {totals.totalQty})</span>
                      <span className="font-medium">{formatPrice(totals.deliveryFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total HT</span>
                      <span>{formatPrice(totals.subtotalHT)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>TVA (20%)</span>
                      <span>{formatPrice(totals.tva)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-display font-bold border-t pt-3">
                      <span>Total TTC</span>
                      <span className="text-primary">{formatPrice(totals.totalTTC)}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                    <p><strong>Client :</strong> {clientInfo.firstName} {clientInfo.lastName}</p>
                    <p><strong>Email :</strong> {clientInfo.email}</p>
                    <p><strong>Tél :</strong> {clientInfo.phone}</p>
                    {clientInfo.address && <p><strong>Adresse :</strong> {clientInfo.address}, {clientInfo.city || clientCity} {clientInfo.postalCode}</p>}
                  </div>

                  <Button
                    onClick={() => toast.success("Devis généré ! L'intégration Yousign enverra le PDF pour signature électronique.")}
                    className="w-full"
                    size="lg"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Générer le PDF & envoyer pour signature
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Le devis sera envoyé au client par email via Yousign pour signature électronique certifiée.
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                </Button>
                {step < STEPS.length - 1 && (
                  <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                    Suivant <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: live total */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Estimation en direct</CardTitle>
              <CardDescription>{totals.totalQty} maison{totals.totalQty > 1 ? 's' : ''} au devis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {houses.length > 0 ? (
                <>
                  {houses.map(h => (
                    <div key={h.id} className="flex justify-between">
                      <span className="text-muted-foreground truncate mr-2">
                        {h.model.name}{h.quantity > 1 ? ` ×${h.quantity}` : ''}
                      </span>
                      <span className="font-medium shrink-0">{formatPrice(getHouseUnitPrice(h) * h.quantity)}</span>
                    </div>
                  ))}
                  {deliveryDistance !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span className="font-medium">{formatPrice(totals.deliveryFee)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total HT</span>
                    <span>{formatPrice(totals.subtotalHT)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>TVA 20%</span>
                    <span>{formatPrice(totals.tva)}</span>
                  </div>
                  <div className="flex justify-between font-display font-bold text-lg pt-2 border-t">
                    <span>TTC</span>
                    <span className="text-primary">{formatPrice(totals.totalTTC)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">Ajoutez des maisons pour voir l'estimation</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
