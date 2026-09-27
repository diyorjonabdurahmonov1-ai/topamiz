"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Pencil, X } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n";
import Avatar from "./Avatar";

export default function ProfileEditForm({ user, dict }: { user: AuthUser; dict: Dictionary }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarUrl = avatarPreview ?? user.avatarUrl;

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? dict.profile.genericError);

      const patchRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: uploadData.url }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error ?? dict.profile.genericError);

      setAvatarPreview(uploadData.url as string);
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : dict.profile.genericError);
    } finally {
      setAvatarUploading(false);
    }
  }

  const avatarPicker = (
    <div className="relative">
      <Avatar name={name || user.name} color={user.avatarColor} avatarUrl={avatarUrl} size={88} />
      {avatarUploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      )}
      <button
        type="button"
        onClick={() => avatarInputRef.current?.click()}
        aria-label={dict.profile.changePhoto}
        className="btn-brand absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={handleAvatarChange}
      />
    </div>
  );

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
      if (!res.ok) throw new Error(data.error ?? dict.profile.genericError);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.profile.genericError);
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col items-center text-center">
        {avatarPicker}
        {avatarError && <p className="mt-2 text-xs font-medium text-danger">{avatarError}</p>}
        <h1 className="mt-4 text-xl font-extrabold">{user.name}</h1>
        <p className="text-sm text-muted">{user.email}</p>
        <p className="mt-3 max-w-sm text-sm text-muted">{user.bio || dict.profile.noBio}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          <Pencil className="h-3.5 w-3.5" />
          {dict.profile.editProfile}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 text-center">
      {avatarPicker}
      {avatarError && <p className="text-xs font-medium text-danger">{avatarError}</p>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={dict.profile.namePlaceholder}
        className="w-full max-w-xs rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-via/40"
      />
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder={dict.profile.bioPlaceholder}
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
          {dict.profile.cancel}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {dict.profile.save}
        </button>
      </div>
    </form>
  );
}
