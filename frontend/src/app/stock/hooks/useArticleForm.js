import { useState } from "react";

const initialFormState = {
  id: "",
  nom_article: "",
  prix: 0,
  quantite: 0,
  address: "",
  fournisseur_id: "",
  min_stock: 10,
};

export const useArticleForm = (defaultSupplierId = "") => {
  const [formData, setFormData] = useState({ ...initialFormState, fournisseur_id: defaultSupplierId });
  const [editArticleId, setEditArticleId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === "prix" || name === "quantite" || name === "min_stock") 
        ? (value === "" ? "" : Number(value) || 0) 
        : value,
    }));
  };

  const openCreateModal = () => {
    setEditArticleId(null);
    setFormData({ ...initialFormState, fournisseur_id: defaultSupplierId });
    setModalError("");
    setModalOpen(true);
  };

  const openEditModal = (article) => {
    setEditArticleId(article.id);
    setFormData({
      id: article.id,
      nom_article: article.nom_article,
      prix: article.prix,
      quantite: article.quantite,
      address: article.address,
      fournisseur_id: article.fournisseur_id,
      min_stock: article.min_stock || 10,
    });
    setModalError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalError("");
  };

  return {
    formData,
    editArticleId,
    modalOpen,
    modalError,
    setModalError,
    handleInputChange,
    openCreateModal,
    openEditModal,
    closeModal,
  };
};
