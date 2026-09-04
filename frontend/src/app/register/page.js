'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import API from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATEUR');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom || !email || !matricule || !password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await API.post('/auth/register', {
        nom,
        email,
        matricule,
        mot_de_passe: password,
        role,
      });
      if (res.data && res.data.success) {
        router.replace('/login');
      } else {
        setError(res.data?.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue pendant l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Créer un compte</h2>
          <p className="text-xs text-slate-400">Enregistrement d&apos;un nouvel opérateur</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-rose-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nom complet</label>
            <input
              type="text"
              placeholder="Ex: Ahmed Kacem"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              placeholder="Ex: a.kacem@usine.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matricule</label>
            <input
              type="text"
              placeholder="Ex: MAT-001"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="GL">GL</option>
              <option value="SUPERVISEUR">SUPERVISEUR</option>
              <option value="OPERATEUR">OPERATEUR</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-500 active:bg-green-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                <span>Enregistrement...</span>
              </>
            ) : (
              'Créer le compte'
            )}
          </button>
        </form>
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-400">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
              Se connecter
            </Link>
          </p>
          <p className="text-[11px] text-slate-600">Câblage MES © 2026. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
