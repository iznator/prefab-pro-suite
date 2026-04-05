import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  houseModels, finishOptions, exteriorStyles, interiorStyles, extraOptions,
  defaultDeliveryConfig, calculateQuote, calculateDistance, frenchCities, formatPrice,
  type HouseModelConfig, type FinishOption, type StyleOption, type ExtraOption, type ClientInfo,
} from "@/data/configuratorData";
import {
  Home, Paintbrush, Palette, Truck, User, FileText,
  Check, ChevronLeft, ChevronRight, Maximize, BedDouble, Bath,
  Plus, Minus, MapPin, Package
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 'model', label: 'Modèle', icon: Home },
  { id: 'finish', label: 'Finitions', icon: Paintbrush },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'extras', label: 'Options', icon: Package },
  { id: 'delivery', label: 'Livraison', icon: Truck },
  { id: 'client', label: 'Client', icon: User },
  { id: 'summary', label: 'Devis', icon: FileText },
];

export default function ConfigurateurPage() {
  const [step, setStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState<HouseModelConfig | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<FinishOption>(finishOptions[0]);
  const [selectedExterior, setSelectedExterior] = useState<StyleOption>(exteriorStyles[0]);
  const [selectedInterior, setSelectedInterior] = useState<StyleOption>(interiorStyles[0]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraOption[]>([]);
  const [clientCity, setClientCity] = useState("");
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', postalCode: ''
  });

  const toggleExtra = (extra: ExtraOption) => {
    setSelectedExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const estimateDelivery = () => {
    const cityKey = clientCity.toLowerCase().trim();
    const coords = frenchCities[cityKey];
    if (coords) {
      const dist = calculateDistance(
        defaultDeliveryConfig.baseLat, defaultDeliveryConfig.baseLng,
        coords.lat, coords.lng
      );
      setDeliveryDistance(dist);
      setClientInfo(prev => ({ ...prev, city: clientCity }));
      toast.success(`Distance estimée : ${dist} km depuis ${defaultDeliveryConfig.baseCity}`);
    } else {
      toast.error("Ville non reconnue. Essayez une grande ville française.");
    }
  };

  const quote = useMemo(() => {
    if (!selectedModel) return null;
    return calculateQuote({
      model: selectedModel,
      finish: selectedFinish,
      exteriorStyle: selectedExterior,
      interiorStyle: selectedInterior,
      extras: selectedExtras,
      deliveryDistanceKm: deliveryDistance || 0,
    });
  }, [selectedModel, selectedFinish, selectedExterior, selectedInterior, selectedExtras, deliveryDistance]);

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedModel;
      case 1: return !!selectedFinish;
      case 2: return !!selectedExterior && !!selectedInterior;
      case 3: return true;
      case 4: return deliveryDistance !== null;
      case 5: return clientInfo.firstName && clientInfo.lastName && clientInfo.email && clientInfo.phone;
      default: return true;
    }
  };

  const handleGenerateQuote = () => {
    toast.success("Devis généré ! L'intégration Yousign enverra le PDF pour signature électronique.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configurateur de devis</h1>
        <p className="text-muted-foreground mt-1">Créez un devis en quelques clics — modèle, finitions, livraison et prix calculés automatiquement.</p>
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
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Step 0: Model */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Choisissez le modèle</h2>
                    <p className="text-sm text-muted-foreground">Sélectionnez la maison modulaire qui correspond au projet du client.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {houseModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all hover:shadow-md",
                          selectedModel?.id === model.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-display font-semibold text-foreground">{model.name}</h3>
                          {selectedModel?.id === model.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" />{model.surface}m²</span>
                          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{model.bedrooms} ch.</span>
                          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{model.bathrooms} sdb</span>
                        </div>
                        <p className="font-display font-bold text-lg text-foreground">
                          {formatPrice(model.basePrice)} <span className="text-xs font-normal text-muted-foreground">HT</span>
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Finitions */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Niveau de finition</h2>
                    <p className="text-sm text-muted-foreground">Choisissez le niveau de qualité des matériaux et équipements.</p>
                  </div>
                  <div className="space-y-3">
                    {finishOptions.map(finish => (
                      <button
                        key={finish.id}
                        onClick={() => setSelectedFinish(finish)}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all hover:shadow-md",
                          selectedFinish.id === finish.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{finish.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{finish.description}</p>
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            {finish.priceModifier === 0 ? (
                              <Badge variant="secondary">Inclus</Badge>
                            ) : (
                              <span className="font-display font-bold text-foreground">+{formatPrice(finish.priceModifier)}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Styles */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Style extérieur & intérieur</h2>
                    <p className="text-sm text-muted-foreground">Personnalisez l'apparence de la maison.</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground mb-3">🏠 Style extérieur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {exteriorStyles.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedExterior(style)}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            selectedExterior.id === style.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-foreground">{style.name}</h4>
                            {style.priceModifier === 0 ? (
                              <Badge variant="secondary" className="text-[10px]">Inclus</Badge>
                            ) : (
                              <span className="text-sm font-semibold">+{formatPrice(style.priceModifier)}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-foreground mb-3">🛋️ Style intérieur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {interiorStyles.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedInterior(style)}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            selectedInterior.id === style.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-foreground">{style.name}</h4>
                            {style.priceModifier === 0 ? (
                              <Badge variant="secondary" className="text-[10px]">Inclus</Badge>
                            ) : (
                              <span className="text-sm font-semibold">+{formatPrice(style.priceModifier)}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Extras */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Options supplémentaires</h2>
                    <p className="text-sm text-muted-foreground">Ajoutez des équipements complémentaires au projet.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {extraOptions.map(extra => {
                      const isSelected = selectedExtras.some(e => e.id === extra.id);
                      return (
                        <button
                          key={extra.id}
                          onClick={() => toggleExtra(extra)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{extra.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{extra.description}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              <span className="font-semibold text-sm">{formatPrice(extra.price)}</span>
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
              )}

              {/* Step 4: Delivery */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Livraison</h2>
                    <p className="text-sm text-muted-foreground">
                      Entrez la ville du client pour calculer le coût de livraison depuis {defaultDeliveryConfig.baseCity}.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> <strong>Départ :</strong> {defaultDeliveryConfig.baseCity}</p>
                    <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /> <strong>Tarif :</strong> {formatPrice(defaultDeliveryConfig.pricePerKm)}/km</p>
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

                  {deliveryDistance !== null && quote && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-foreground">📍 Distance estimée : {deliveryDistance} km</p>
                      <p className="text-foreground">💰 Coût de livraison : <strong>{formatPrice(quote.deliveryFee)} HT</strong></p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Client info */}
              {step === 5 && (
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

              {/* Step 6: Summary */}
              {step === 6 && selectedModel && quote && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Récapitulatif du devis</h2>
                    <p className="text-sm text-muted-foreground">Vérifiez les détails avant de générer le PDF.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modèle {selectedModel.name}</span>
                      <span className="font-medium">{formatPrice(quote.basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Finition {selectedFinish.name}</span>
                      <span className="font-medium">{quote.finishPrice === 0 ? 'Inclus' : `+${formatPrice(quote.finishPrice)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Extérieur {selectedExterior.name}</span>
                      <span className="font-medium">{quote.exteriorPrice === 0 ? 'Inclus' : `+${formatPrice(quote.exteriorPrice)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Intérieur {selectedInterior.name}</span>
                      <span className="font-medium">{quote.interiorPrice === 0 ? 'Inclus' : `+${formatPrice(quote.interiorPrice)}`}</span>
                    </div>
                    {selectedExtras.length > 0 && (
                      <>
                        <Separator />
                        {selectedExtras.map(extra => (
                          <div key={extra.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{extra.name}</span>
                            <span className="font-medium">+{formatPrice(extra.price)}</span>
                          </div>
                        ))}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Livraison ({deliveryDistance} km)</span>
                      <span className="font-medium">{formatPrice(quote.deliveryFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total HT</span>
                      <span>{formatPrice(quote.subtotalHT)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>TVA (20%)</span>
                      <span>{formatPrice(quote.tva)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-display font-bold border-t pt-3">
                      <span>Total TTC</span>
                      <span className="text-primary">{formatPrice(quote.totalTTC)}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                    <p><strong>Client :</strong> {clientInfo.firstName} {clientInfo.lastName}</p>
                    <p><strong>Email :</strong> {clientInfo.email}</p>
                    <p><strong>Tél :</strong> {clientInfo.phone}</p>
                    {clientInfo.address && <p><strong>Adresse :</strong> {clientInfo.address}, {clientInfo.city || clientCity} {clientInfo.postalCode}</p>}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleGenerateQuote} className="flex-1" size="lg">
                      <FileText className="w-4 h-4 mr-2" />
                      Générer le PDF & envoyer pour signature
                    </Button>
                  </div>
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

        {/* Sidebar: live price */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Estimation en direct</CardTitle>
              <CardDescription>Le prix se met à jour à chaque choix</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selectedModel ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modèle</span>
                    <span className="font-medium">{selectedModel.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base</span>
                    <span>{formatPrice(selectedModel.basePrice)}</span>
                  </div>
                  {selectedFinish.priceModifier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Finition {selectedFinish.name}</span>
                      <span>+{formatPrice(selectedFinish.priceModifier)}</span>
                    </div>
                  )}
                  {selectedExterior.priceModifier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ext. {selectedExterior.name}</span>
                      <span>+{formatPrice(selectedExterior.priceModifier)}</span>
                    </div>
                  )}
                  {selectedInterior.priceModifier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Int. {selectedInterior.name}</span>
                      <span>+{formatPrice(selectedInterior.priceModifier)}</span>
                    </div>
                  )}
                  {selectedExtras.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{selectedExtras.length} option(s)</span>
                      <span>+{formatPrice(selectedExtras.reduce((s, e) => s + e.price, 0))}</span>
                    </div>
                  )}
                  {deliveryDistance !== null && quote && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span>{formatPrice(quote.deliveryFee)}</span>
                    </div>
                  )}
                  <Separator />
                  {quote && (
                    <>
                      <div className="flex justify-between font-semibold">
                        <span>Total HT</span>
                        <span>{formatPrice(quote.subtotalHT)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>TVA 20%</span>
                        <span>{formatPrice(quote.tva)}</span>
                      </div>
                      <div className="flex justify-between font-display font-bold text-lg pt-2 border-t">
                        <span>TTC</span>
                        <span className="text-primary">{formatPrice(quote.totalTTC)}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sélectionnez un modèle pour voir l'estimation</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
