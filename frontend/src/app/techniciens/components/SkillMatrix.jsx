'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal, Eye, Edit, GraduationCap, History, FileDown, Search } from 'lucide-react';



const LEVEL_CONFIG = {
  0: { label: 'Not Trained', color: 'bg-slate-200', text: 'text-slate-500', ring: 'ring-slate-300' },
  1: { label: 'Beginner', color: 'bg-yellow-400', text: 'text-yellow-700', ring: 'ring-yellow-300' },
  2: { label: 'Confirmed', color: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-300' },
  3: { label: 'Expert', color: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-300' },
};

/* ─── Skill Cell with hover tooltip ────────────────── */
function SkillCell({ skillName, skillData }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef(null);
  
  // Default to level 0 if skillData is undefined
  const data = skillData || { level: 0 };
  const cfg = LEVEL_CONFIG[data.level] || LEVEL_CONFIG[0];

  return (
    <td className="px-3 py-3 text-center relative">
      <div
        ref={ref}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center justify-center cursor-pointer"
      >
        <motion.div
          whileHover={{ scale: 1.25 }}
          className={`w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-offset-1 ${cfg.ring}`}
        >
          {data.level}
        </motion.div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-3 text-left pointer-events-none"
          >
            <p className="text-xs font-semibold text-slate-800 mb-1.5">{skillName}</p>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Level</span><span className={`font-medium ${cfg.text}`}>{cfg.label} ({data.level}/3)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Last Training</span><span>{data.lastTraining || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Trainer</span><span>{data.trainer || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Last Eval</span><span>{data.lastEval || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Cert. Expires</span>
                <span className={data.certExpiration && new Date(data.certExpiration) < new Date() ? 'text-red-500 font-medium' : ''}>
                  {data.certExpiration || 'None'}
                </span>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-slate-100 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </td>
  );
}

/* ─── Average Level Badge ──────────────────────────── */
function AvgBadge({ techn, skillKeys }) {
  const numSkills = skillKeys?.length > 0 ? skillKeys.length : 1;
  const avg = Object.values(techn.skills).reduce((sum, s) => sum + s.level, 0) / numSkills;
  const rounded = avg.toFixed(1);
  const pct = (avg / 3) * 100;
  let barColor = 'bg-slate-300';
  if (avg >= 2.5) barColor = 'bg-emerald-500';
  else if (avg >= 1.5) barColor = 'bg-blue-500';
  else if (avg > 0) barColor = 'bg-yellow-400';

  return (
    <td className="px-3 py-3">
      <div className="flex items-center gap-2 min-w-[80px]">
        <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${barColor}`} />
        </div>
        <span className="text-xs font-semibold text-slate-700 w-7 text-right">{rounded}</span>
      </div>
    </td>
  );
}

/* ─── Cert Status Badge ────────────────────────────── */
function CertBadge({ techn }) {
  const now = new Date();
  const expirations = Object.values(techn.skills).map(s => s.certExpiration).filter(Boolean);
  const hasExpired = expirations.some(d => new Date(d) < now);
  const hasExpiringSoon = expirations.some(d => { const diff = (new Date(d) - now) / (1000 * 60 * 60 * 24); return diff > 0 && diff <= 30; });

  let label = 'Valid';
  let cls = 'bg-green-100 text-green-700';
  if (hasExpired) { label = 'Expired'; cls = 'bg-red-100 text-red-700'; }
  else if (hasExpiringSoon) { label = 'Expiring'; cls = 'bg-orange-100 text-orange-700'; }
  else if (expirations.length === 0) { label = 'None'; cls = 'bg-slate-100 text-slate-500'; }

  return (
    <td className="px-3 py-3">
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>{label}</span>
    </td>
  );
}

/* ─── Actions dropdown ─────────────────────────────── */
function ActionsMenu({ onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <td className="px-3 py-3 text-right relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-1.5 overflow-hidden"
            >
              {[
                { icon: Eye, label: 'View Profile', action: 'view' },
                { icon: Edit, label: 'Edit', action: 'edit' },
                { icon: GraduationCap, label: 'Assign Training', action: 'assign' },
                { icon: History, label: 'View History', action: 'history' },
                { icon: FileDown, label: 'Export PDF', action: 'export' },
              ].map(item => (
                <button key={item.action} onClick={() => { onSelect(item.action); setOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <item.icon size={14} className="text-slate-400" /> {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </td>
  );
}

/* ─── Legend ────────────────────────────────────────── */
function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
      {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => (
        <span key={lvl} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full ${cfg.color} inline-block`} />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}

/* ─── Empty State ──────────────────────────────────── */
function EmptyState() {
  return (
    <div className="p-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Search size={28} className="text-slate-300" />
      </div>
      <h3 className="text-base font-medium text-slate-700 mb-1">No technicians found</h3>
      <p className="text-sm text-slate-400">Try adjusting your filters or search terms.</p>
    </div>
  );
}

/* ─── Main SkillMatrix ─────────────────────────────── */
export default function SkillMatrix({ techniciens, onViewTech, skillKeys = [] }) {
  const data = techniciens || [];
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') { va = a.name; vb = b.name; }
      else if (sortKey === 'department') { va = a.department; vb = b.department; }
      else if (sortKey === 'avg') {
        va = Object.values(a.skills).reduce((s, sk) => s + sk.level, 0);
        vb = Object.values(b.skills).reduce((s, sk) => s + sk.level, 0);
      } else if (skillKeys.includes(sortKey)) {
        va = a.skills[sortKey]?.level ?? 0;
        vb = b.skills[sortKey]?.level ?? 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortKey, sortDir]);

  const renderSortIcon = (col) => {
    if (sortKey !== col) return <ChevronDown size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
  };

  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <Legend />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2.5 cursor-pointer group" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Technician {renderSortIcon('name')}</div>
              </th>
              <th className="px-3 py-2.5 cursor-pointer group" onClick={() => handleSort('department')}>
                <div className="flex items-center gap-1">Dept {renderSortIcon('department')}</div>
              </th>
              {skillKeys.map(sk => (
                <th key={sk} className="px-3 py-2.5 text-center cursor-pointer group" onClick={() => handleSort(sk)}>
                  <div className="flex items-center justify-center gap-1">{sk.length > 12 ? sk.substring(0, 10) + '…' : sk} {renderSortIcon(sk)}</div>
                </th>
              ))}
              <th className="px-3 py-2.5 cursor-pointer group" onClick={() => handleSort('avg')}>
                <div className="flex items-center gap-1">Avg {renderSortIcon('avg')}</div>
              </th>
              <th className="px-3 py-2.5">Cert</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map(tech => (
              <motion.tr
                key={tech.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                onClick={() => onViewTech(tech)}
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tech.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-100 ring-1 ring-slate-200" />
                    <div>
                      <p className="font-medium text-slate-800 text-sm leading-tight">{tech.name}</p>
                      <p className="text-[11px] text-slate-400">{tech.empNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{tech.department}</span>
                </td>
                {skillKeys.map(sk => (
                  <SkillCell key={sk} skillName={sk} skillData={tech.skills[sk]} />
                ))}
                <AvgBadge techn={tech} skillKeys={skillKeys} />
                <CertBadge techn={tech} />
                <ActionsMenu onSelect={(action) => { if (action === 'view') onViewTech(tech); }} />
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination footer */}
      <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
        <span className="text-xs text-slate-500">Showing 1–{sorted.length} of {sorted.length}</span>
        <div className="flex gap-1">
          <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-400 text-xs bg-white cursor-not-allowed">Prev</button>
          <button className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-medium">1</button>
          <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs bg-white">Next</button>
        </div>
      </div>
    </div>
  );
}
