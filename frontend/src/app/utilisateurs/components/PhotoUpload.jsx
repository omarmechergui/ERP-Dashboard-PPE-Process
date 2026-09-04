/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import API from '../../../lib/api';

export function PhotoUpload({ userId, currentPhotoUrl, onUploadSuccess, className = '' }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const displayUrl = preview || (currentPhotoUrl ? (currentPhotoUrl.startsWith('http') ? currentPhotoUrl : `${API_URL}${currentPhotoUrl}`) : null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format invalide. Utilisez JPG, PNG ou WEBP.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image dépasse la limite de 5MB.');
      return;
    }

    setError('');
    
    // Si c'est un nouvel utilisateur (pas encore d'ID), on garde juste la preview
    if (!userId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        if (onUploadSuccess) onUploadSuccess(file); // On renvoie le fichier pour l'upload lors de la création
      };
      reader.readAsDataURL(file);
      return;
    }

    // Si on a un ID, on upload direct
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await API.post(`/users/${userId}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (onUploadSuccess) onUploadSuccess(response.data.photoUrl);
      setPreview(null);
    } catch (err) {
      setError(err.message || err.error || "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative group">
        <div 
          className={`w-24 h-24 rounded-full overflow-hidden border-2 border-dashed ${error ? 'border-red-400' : 'border-gray-300'} flex items-center justify-center bg-gray-50 cursor-pointer transition-colors group-hover:border-blue-400`}
          onClick={triggerSelect}
        >
          {displayUrl ? (
            <img src={displayUrl} alt="Photo" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      
      {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/jpeg,image/png,image/webp" 
        className="hidden" 
      />
    </div>
  );
}
