"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!form.email || !form.password) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        setError("Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      router.push("/");
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) {
        setError("Erreur lors de l'inscription. Reessaie.");
        setLoading(false);
        return;
      }

      setSuccess("Compte cree ! Verifie ton email pour confirmer ton inscription.");
      setLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900";

  return (
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxor-A</Link>
      </nav>

      <div className="max-w-sm mx-auto px-6 py-16">

        <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-8">
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-purple-700 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-purple-700 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Inscription
          </button>
        </div>

        <div className="flex flex-col gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ton@email.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Au moins 6 caracteres"
              className={inputClass}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="accent-purple-700"
              />
              <span className="text-xs text-gray-500">Afficher le mot de passe</span>
            </label>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repete ton mot de passe"
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {success && (
  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
    <p className="text-sm font-medium text-green-800 mb-1">Compte créé avec succès !</p>
    <p className="text-sm text-green-600">Un email de confirmation a été envoyé à ton adresse. Clique sur le lien dans l'email pour activer ton compte avant de te connecter.</p>
  </div>
)}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50 mt-2"
          >
            {loading
              ? "Chargement..."
              : mode === "login"
              ? "Se connecter"
              : "Creer mon compte"}
          </button>

        </div>
      </div>
    </div>
  );
}
