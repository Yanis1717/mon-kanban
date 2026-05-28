// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
export default function ProfilePage({ session }) {
const user = session.user;
// ── États : infos générales ────────────────────────────────────
const [fullName, setFullName] = useState(user.user_metadata?.full_name ||
'');
const [infoMsg, setInfoMsg] = useState('');
const [infoErr, setInfoErr] = useState('');
// ── États : mot de passe ───────────────────────────────────────
const [newPass, setNewPass] = useState('');
const [passMsg, setPassMsg] = useState('');
const [passErr, setPassErr] = useState('');
// ── États : avatar ─────────────────────────────────────────────
const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url
|| '');
const [uploading, setUploading] = useState(false);
// ── Sauvegarder le nom ─────────────────────────────────────────
async function handleSaveInfo(e) {
e.preventDefault();
setInfoErr(''); setInfoMsg('');
const { error } = await supabase.auth.updateUser({
data: { full_name: fullName } // stocké dans user_metadata
});
if (error) setInfoErr(error.message);
else setInfoMsg('✅ Profil mis à jour !');
}}