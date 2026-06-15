// src/pages/ProfilePage.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

export default function ProfilePage({ session }) {
  const user = session.user;

  // ── États : infos générales ────────────────────────────────────
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '');
  const [infoMsg, setInfoMsg] = useState('');
  const [infoErr, setInfoErr] = useState('');

  // ── États : mot de passe ───────────────────────────────────────
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  // ── États : avatar ─────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || '');
  const [uploading, setUploading] = useState(false);

  // ── Sauvegarder le nom ─────────────────────────────────────────
  async function handleSaveInfo(e) {
    e.preventDefault();
    setInfoErr(''); 
    setInfoMsg('');
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName } // stocké dans user_metadata
    });
    
    if (error) setInfoErr(error.message);
    else setInfoMsg('✅ Profil mis à jour !');
  }

  // ── Sauvegarder le mot de passe ──────────────────────────────────
  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPassErr(''); 
    setPassMsg('');

    if (newPass.length < 6) {
      setPassErr('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPass
    });

    if (error) setPassErr(error.message);
    else {
      setPassMsg('✅ Mot de passe mis à jour !');
      setNewPass('');
    }
  }

  // ── Upload de l'avatar (TD4 - Partie C) ──────────────────────────
  async function handleUploadAvatar(e) {
    try {
      setUploading(true);
      setInfoErr('');
      setInfoMsg('');

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("Vous devez sélectionner une image pour l'uploader.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Génération d'un nom de fichier unique basé sur l'ID utilisateur
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload du fichier dans le bucket Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Récupération de l'URL publique du fichier
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // 3. Mise à jour de l'avatar_url dans user_metadata de Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // Mettre à jour l'état local pour rafraîchir l'affichage du cercle
      setAvatarUrl(publicUrl);
      setInfoMsg('✅ Photo de profil mise à jour !');
    } catch (error) {
      setInfoErr(error.message);
    } {
      setUploading(false);
    }
  }

  // ── RENDU DE LA PAGE ───────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Navbar session={session} />
      
      <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#1A8C82', marginBottom: '1.5rem' }}>⚙️ Mon Profil</h2>
        
        {/* Section Avatar (Cercle d'affichage + Input d'upload) */}
        <div style={{ ...formStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ marginTop: 0, color: '#1A8C82', width: '100%', textAlign: 'left' }}>Photo de profil</h3>
          
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            overflow: 'hidden',
            border: '2px solid #1A8C82'
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '👤'
            )}
          </div>

          <label style={{
            background: '#1A8C82',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            {uploading ? 'Envoi en cours...' : 'Choisir une image'}
            <input type="file" accept="image/*" onChange={handleUploadAvatar} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Formulaire : Informations Générales */}
        <form onSubmit={handleSaveInfo} style={formStyle}>
          <h3 style={{ marginTop: 0, color: '#1A8C82' }}>Informations générales</h3>
          {infoMsg && <p style={{ color: '#16A34A', fontWeight: 600 }}>{infoMsg}</p>}
          {infoErr && <p style={{ color: '#DC2626' }}>{infoErr}</p>}
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Adresse e-mail</label>
            <input type="text" value={user.email} disabled style={{ ...inputStyle, background: '#F1F5F9', cursor: 'not-allowed' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Nom complet</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Ex: Yanis LAÏD" />
          </div>
          
          <button type="submit" style={btnStyle}>
            Sauvegarder le nom
          </button>
        </form>

        {/* Formulaire : Sécurité / Mot de passe */}
        <form onSubmit={handleUpdatePassword} style={formStyle}>
          <h3 style={{ marginTop: 0, color: '#1A8C82' }}>Sécurité</h3>
          {passMsg && <p style={{ color: '#16A34A', fontWeight: 600 }}>{passMsg}</p>}
          {passErr && <p style={{ color: '#DC2626' }}>{passErr}</p>}
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={inputStyle} placeholder="Minimum 6 caractères" />
          </div>
          
          <button type="submit" style={btnStyle}>
            Modifier le mot de passe
          </button>
        </form>
      </main>
    </div>
  );
}

const formStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '10px',
  marginBottom: '1.5rem',
  border: '1px solid #E2E8F0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const inputStyle = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #CBD5E1',
  borderRadius: '6px',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.3rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#64748B'
};

const btnStyle = {
  background: '#1A8C82',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1.2rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600
};