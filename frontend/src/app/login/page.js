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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary/10 p-3 rounded-xl shadow-sm">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">ERP Dashboard</h2>
          <p className="text-sm text-secondary-foreground font-medium">Authentification de l&apos;opérateur et du personnel</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex items-start gap-2.5 text-danger text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">
              Email ou Matricule
            </label>
            <input
              type="text"
              placeholder="Ex: a.kacem@usine.tn ou MAT-001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all font-medium"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary/30 border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all font-medium"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-secondary-foreground hover:text-foreground font-medium transition-colors">
            ← Retour au tableau de bord
          </Link>
          <p className="text-[11px] text-slate-600 mt-4">
            Câblage MES © 2026. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
