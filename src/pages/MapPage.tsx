import { useState, useEffect } from "react";
import { statusConfig } from "@/data/mockData";
import { useLeads, type Lead } from "@/contexts/LeadsContext";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Home, Euro, MapPin } from "lucide-react";

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const statusColors: Record<string, string> = {
  nouveau: '#3B82F6',
  contacté: '#D97706',
  qualifié: '#16A34A',
  proposition: '#8B5CF6',
  négociation: '#EA580C',
  gagné: '#15803D',
  perdu: '#DC2626',
};

function createIcon(status: string) {
  const color = statusColors[status] || '#3B82F6';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function MapPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Carte des leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} leads répartis sur la France</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[key] }} />
              <span className="text-[10px] text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ height: 'calc(100vh - 220px)' }}>
        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {leads.map(lead => (
            <Marker
              key={lead.id}
              position={[lead.lat, lead.lng]}
              icon={createIcon(lead.status)}
              eventHandlers={{ click: () => setSelectedLead(lead) }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <p className="font-bold text-sm">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-gray-500">{lead.address}, {lead.city}</p>
                  <p className="text-xs mt-1">{lead.houseModel} • {lead.budget.toLocaleString('fr-FR')} €</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
