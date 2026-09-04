'use client';

import React, { useEffect, useState, use } from 'react';
import API from '@/lib/api';
import { ShieldCheck, XCircle, Award, Calendar, User as UserIcon, Copy, Check, Printer, Share2, RefreshCw } from 'lucide-react';

export default function BadgeVerificationPage({ params }) {
  const unwrappedParams = use(params);
  const badgeId = unwrappedParams.badgeId;
  
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchBadge = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/certification/badges/${badgeId}`);
      setBadge(res.data);
    } catch (err) {
      setError("Ce badge est introuvable ou invalide.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadge();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeId]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(badgeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy ID', err);
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Certification Authentique',
          text: 'Vérifiez cette certification.',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleCopyId();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-auto md:h-[400px]">
          <div className="w-full md:w-1/3 bg-slate-200 animate-pulse h-64 md:h-auto"></div>
          <div className="w-full md:w-2/3 p-8 flex flex-col justify-center space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-20 bg-slate-200 rounded w-full animate-pulse mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Badge Invalide</h1>
          <p className="text-slate-500 mb-8">{error}</p>
          <button 
            onClick={fetchBadge}
            className="flex items-center justify-center w-full gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const badgeConfig = {
    'BRONZE': { gradient: 'from-amber-600 to-orange-500', color: 'text-orange-600', bg: 'bg-orange-50' },
    'SILVER': { gradient: 'from-slate-400 to-slate-600', color: 'text-slate-600', bg: 'bg-slate-50' },
    'GOLD': { gradient: 'from-yellow-400 to-amber-500', color: 'text-amber-500', bg: 'bg-amber-50' },
    'EXPERT': { gradient: 'from-purple-500 to-indigo-600', color: 'text-indigo-600', bg: 'bg-indigo-50' }
  };

  const style = badgeConfig[badge.badgeType] || badgeConfig['BRONZE'];

  const formattedDate = new Date(badge.dateObtention).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-slate-50 print:bg-white print:py-0 print:justify-center">
      
      {/* Header - Hidden on Print */}
      <div className="text-center mb-10 print:hidden">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Vérification de Certification</h1>
        <p className="text-slate-500 text-lg">Vérifiez l&apos;authenticité de cette certification.</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 flex flex-col md:flex-row print:shadow-none print:border-slate-300">
        
        {/* Left Section - Badge */}
        <div className={`md:w-1/3 bg-gradient-to-br ${style.gradient} p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group print:break-inside-avoid`}>
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute top-10 right-10 w-4 h-4 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-12 left-12 w-6 h-6 bg-white/20 rounded-full"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-2xl border border-white/20">
              <Award className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
            <h2 className="text-4xl font-black text-white drop-shadow-md uppercase tracking-widest mb-2">{badge.badgeType}</h2>
            <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
              <p className="text-white font-medium text-lg tracking-wide">{badge.niveau}</p>
            </div>
          </div>
        </div>

        {/* Middle Section - Technician */}
        <div className="md:w-1/3 p-8 lg:p-10 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center bg-white print:break-inside-avoid">
          <div className="mb-8 hidden md:flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg self-start">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-semibold text-sm">Certifié et Validé</span>
          </div>

          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Informations du Titulaire</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                <UserIcon className={`w-6 h-6 ${style.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Technicien</p>
                <p className="font-bold text-slate-900 text-xl leading-tight">
                  {badge.technicien?.nom || 'Non spécifié'}
                </p>
                {badge.technicien?.matricule && (
                  <p className="text-sm font-medium text-slate-400 mt-1">ID: {badge.technicien.matricule}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <Calendar className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-0.5">Date d&apos;obtention</p>
                <p className="font-bold text-slate-900 text-lg leading-tight">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Verification */}
        <div className="md:w-1/3 p-8 lg:p-10 flex flex-col justify-center bg-slate-50/50 print:break-inside-avoid print:bg-white">
          <div className="flex flex-col h-full justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Certificat Authentique</h3>
              </div>
              <p className="text-slate-500 leading-relaxed text-sm">
                Ce badge numérique a été vérifié par notre système. Il atteste de la réussite et des compétences acquises par le titulaire.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identifiant Unique</p>
              <div className="relative group">
                <div className="font-mono text-sm md:text-base text-slate-700 bg-white border border-slate-200 p-3 rounded-xl break-all pr-12 shadow-sm print:border-none print:shadow-none print:p-0">
                  {badge.badgeId}
                </div>
                <button 
                  onClick={handleCopyId}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors print:hidden"
                  title="Copier l'ID"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
                {copied && (
                  <div className="absolute -top-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                    Copié !
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions - Hidden on Print */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md print:hidden">
        <button 
          onClick={handleDownloadPdf}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-semibold rounded-xl shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all w-full"
        >
          <Printer className="w-5 h-5" />
          Imprimer / PDF
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl shadow-md hover:bg-slate-50 hover:shadow-lg transition-all w-full border border-slate-200"
        >
          <Share2 className="w-5 h-5" />
          Partager
        </button>
      </div>

    </div>
  );
}
