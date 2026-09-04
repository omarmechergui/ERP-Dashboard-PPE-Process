import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/fournisseurs");
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les fournisseurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await API.get("/fournisseurs");
        if (!cancelled) setSuppliers(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Impossible de charger les fournisseurs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addSupplier = async (name) => {
    if (!name || !name.trim()) return;
    try {
      setIsAdding(true);
      const res = await API.post("/fournisseurs", { nom: name.trim() });
      setSuppliers((prev) => {
        if (prev.some(s => s.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      return res.data;
    } catch (err) {
      console.error(err);
      throw new Error(err.error || "Erreur lors de l'ajout du fournisseur.");
    } finally {
      setIsAdding(false);
    }
  };

  return { suppliers, loading, error, addSupplier, isAdding };
};
