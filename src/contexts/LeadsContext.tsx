import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type LeadStatus } from "@/data/mockData";
import { toast } from "sonner";

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
  houseModel: string;
  budget: number;
  surface: number;
  source: string;
  createdAt: string;
  lastContact: string;
  notes: { id: string; author: string; content: string; createdAt: string }[];
  messages: { id: string; author: string; content: string; createdAt: string; isInternal: boolean }[];
  score: number;
}

interface LeadsContextValue {
  leads: Lead[];
  loading: boolean;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  addLead: (lead: Omit<Lead, 'id' | 'notes' | 'messages'>) => void;
  refreshLeads: () => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

function mapDbLead(row: any, notes: any[] = [], messages: any[] = []): Lead {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    postalCode: row.postal_code || '',
    lat: row.lat || 0,
    lng: row.lng || 0,
    status: row.status as LeadStatus,
    tags: row.tags || [],
    assignedTo: row.assigned_to || '',
    houseModel: row.house_model || '',
    budget: Number(row.budget) || 0,
    surface: Number(row.surface) || 0,
    source: row.source || '',
    createdAt: row.created_at,
    lastContact: row.last_contact || row.created_at,
    score: row.score || 0,
    notes: notes.map(n => ({ id: n.id, author: n.author, content: n.content, createdAt: n.created_at })),
    messages: messages.map(m => ({ id: m.id, author: m.author, content: m.content, createdAt: m.created_at, isInternal: m.is_internal })),
  };
}

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!leadsData || leadsData.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const leadIds = leadsData.map(l => l.id);

      const [{ data: notesData }, { data: messagesData }] = await Promise.all([
        supabase.from('lead_notes').select('*').in('lead_id', leadIds),
        supabase.from('lead_messages').select('*').in('lead_id', leadIds),
      ]);

      const notesMap = new Map<string, any[]>();
      (notesData || []).forEach(n => {
        if (!notesMap.has(n.lead_id)) notesMap.set(n.lead_id, []);
        notesMap.get(n.lead_id)!.push(n);
      });

      const messagesMap = new Map<string, any[]>();
      (messagesData || []).forEach(m => {
        if (!messagesMap.has(m.lead_id)) messagesMap.set(m.lead_id, []);
        messagesMap.get(m.lead_id)!.push(m);
      });

      const mapped = leadsData.map(row =>
        mapDbLead(row, notesMap.get(row.id) || [], messagesMap.get(row.id) || [])
      );

      setLeads(mapped);
    } catch (err) {
      console.error('Error fetching leads:', err);
      toast.error("Erreur lors du chargement des leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const updateLeadStatus = useCallback(async (leadId: string, status: LeadStatus) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));

    const { error } = await supabase
      .from('leads')
      .update({ status, last_contact: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
      fetchLeads(); // rollback
    }
  }, [fetchLeads]);

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));

    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.houseModel !== undefined) dbUpdates.house_model = updates.houseModel;
    if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
    if (updates.surface !== undefined) dbUpdates.surface = updates.surface;
    if (updates.source !== undefined) dbUpdates.source = updates.source;
    if (updates.score !== undefined) dbUpdates.score = updates.score;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('leads').update(dbUpdates).eq('id', leadId);
      if (error) {
        toast.error("Erreur lors de la mise à jour");
        fetchLeads();
      }
    }
  }, [fetchLeads]);

  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'notes' | 'messages'>) => {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        postal_code: lead.postalCode,
        lat: lead.lat,
        lng: lead.lng,
        status: lead.status,
        tags: lead.tags,
        assigned_to: lead.assignedTo,
        house_model: lead.houseModel,
        budget: lead.budget,
        surface: lead.surface,
        source: lead.source,
        score: lead.score,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la création du lead");
      return;
    }

    if (data) {
      setLeads(prev => [mapDbLead(data), ...prev]);
      toast.success("Lead créé avec succès");
    }
  }, []);

  return (
    <LeadsContext.Provider value={{ leads, loading, updateLeadStatus, updateLead, addLead, refreshLeads: fetchLeads }}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
