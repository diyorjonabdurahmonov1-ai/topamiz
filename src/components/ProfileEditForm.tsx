"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import Avatar from "./Avatar";

export default function ProfileEditForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col items-center text-center">
        <Avatar name={user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={88} />
        <h1 className="mt-4 text-xl font-extrabold">{user.name}</h1>
        <p className="text-sm text-muted">{user.email}</p>
        <p className="mt-3 max-w-sm text-sm text-muted">
          {user.bio || "Hali bio qo'shilmagan."}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          <Pencil className="h-3.5 w-3.5" />
          Profilni tahrirlash
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 text-center">
      <Avatar name={name || user.name} color={user.avatarColor} avatarUrl={user.avatarUrl} size={88} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ismingiz"
        className="w-full max-w-xs rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
      />
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder="O'zingiz haqingizda qisqacha..."
        className="w-full max-w-xs rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
      />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          <X className="h-3.5 w-3.5" />
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Saqlash
        </button>
      </div>
    </form>
  );
}
