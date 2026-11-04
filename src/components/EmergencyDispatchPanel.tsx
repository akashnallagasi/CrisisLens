import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Hospital,
  MapPin,
  Phone,
  Radio,
  Shield,
  ShieldAlert,
  Siren,
} from 'lucide-react';
import { EmergencyCategory, EmergencyContact } from '../types';
import { api } from '../services/api';

const CATEGORY_FILTERS: { id: 'all' | EmergencyCategory; label: string }[] = [
  { id: 'all', label: 'All Units' },
  { id: 'police', label: 'Police' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'fema_ndma', label: 'FEMA / NDMA' },
];

const categoryMeta: Record<
  EmergencyCategory,
  { label: string; icon: React.ReactNode; accent: string }
> = {
  police: {
    label: 'Police Control',
    icon: <Shield className="w-4 h-4" />,
    accent: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  },
  hospital: {
    label: 'City Hospital',
    icon: <Hospital className="w-4 h-4" />,
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  fema_ndma: {
    label: 'FEMA / NDMA',
    icon: <Building2 className="w-4 h-4" />,
    accent: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
  },
};

export const EmergencyDispatchPanel: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [filter, setFilter] = useState<'all' | EmergencyCategory>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadContacts = async (category: 'all' | EmergencyCategory = filter) => {
    try {
      setError(null);
      const data = await api.getEmergencyContacts(category);
      setContacts(data);
    } catch (err: any) {
      setError(err.message || 'Unable to reach emergency dispatch network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadContacts(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleDispatch = async (contact: EmergencyContact) => {
    if (contact.trust_status === 'dispatched_verified' || dispatchingId) return;
    try {
      setDispatchingId(contact.id);
      setNotice(null);
      const updated = await api.dispatchEmergencyContact(
        contact.id,
        `HITL dispatch confirmed for ${contact.name}. Responder verification logged.`
      );
      setContacts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`Logged: ${updated.name} marked Dispatched & Verified.`);
    } catch (err: any) {
      setError(err.message || 'Dispatch logging failed.');
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-meta-azure/10 border border-meta-azure/30 text-meta-azure">
              <Radio className="w-4 h-4" />
            </span>
            Emergency Dispatch Network
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
              Police · Hospitals · FEMA/NDMA
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nearby control rooms and medical nodes. Human-in-the-loop verification required before rollout.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          {CATEGORY_FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === item.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
          {notice}
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 flex items-center justify-center bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Syncing nearby emergency entities…</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contacts.map((contact) => {
            const meta = categoryMeta[contact.category];
            const verified = contact.trust_status === 'dispatched_verified';
            return (
              <article
                key={contact.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-sky-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className={`p-2 rounded-lg border ${meta.accent}`}>{meta.icon}</div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {meta.label}
                      </p>
                      <h3 className="text-sm font-bold text-white leading-tight">{contact.name}</h3>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      contact.availability_status === 'Deployed'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                    }`}
                  >
                    {contact.availability_status}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${
                    verified
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {verified ? <BadgeCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>{verified ? 'Dispatched & Verified' : 'Pending Responder Verification'}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    <a href={`tel:${contact.phone}`} className="font-semibold text-sky-300 hover:underline">
                      {contact.phone}
                    </a>
                    {contact.alt_phone && <span className="text-slate-500">/ {contact.alt_phone}</span>}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{contact.address}</span>
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {contact.latitude.toFixed(4)}, {contact.longitude.toFixed(4)}
                    {typeof contact.distance_km === 'number' && (
                      <span className="ml-2 text-sky-400">{contact.distance_km} km</span>
                    )}
                  </p>
                  {contact.specialization && (
                    <p className="text-[11px] text-slate-400">{contact.specialization}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDispatch(contact)}
                  disabled={verified || dispatchingId === contact.id}
                  className={`mt-auto w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    verified
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'bg-gradient-to-r from-[#0064E0] to-[#0082FB] text-white hover:opacity-90 shadow-lg shadow-sky-900/40'
                  }`}
                >
                  <Siren className="w-3.5 h-3.5" />
                  {verified
                    ? 'Unit Verified'
                    : dispatchingId === contact.id
                      ? 'Logging dispatch…'
                      : 'Trigger Emergency Dispatch'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
