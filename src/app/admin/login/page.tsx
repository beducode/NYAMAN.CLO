"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@nyaman.clo");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login gagal");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface-card rounded-2xl shadow-sm p-8 border border-forest-primary/10">
        <div className="flex items-center gap-3 mb-6">
          <img src="/data/LOGO.png" alt="nyaman.clo" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-display font-bold text-forest-primary">NYAMAN FLOW</h1>
            <p className="text-sm text-ink-primary/60">Admin Panel</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full rounded-lg border border-forest-primary/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full rounded-lg border border-forest-primary/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-primary" />
          </div>
          {error && <p className="text-sm text-status-out">{error}</p>}
          <button disabled={loading} className="w-full bg-forest-primary text-white rounded-lg py-2.5 font-semibold hover:bg-forest-dark transition disabled:opacity-60">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}