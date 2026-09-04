'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(identifier, password);
      if (!res.success) {
        setError(res.error);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion.');
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
          <h2 className="text-xl font-bold text-slate-100">ERP Dashboard</h2>
          <p className="text-xs text-slate-400">Authentification de l&apos;opérateur et du personnel</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-rose-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email ou Matricule
            </label>
            <input
              type="text"
              placeholder="Ex: a.kacem@usine.tn ou MAT-001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Connexion en cours...</span>
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-slate-400">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
              Créer un compte
            </Link>
          </p>
          <p className="text-[11px] text-slate-600">
            Câblage MES © 2026. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
