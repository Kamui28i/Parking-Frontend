"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { authApi } from "@/lib/api";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CITIZEN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await authApi.register(email, password, role);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      router.push(user.role === "ADMIN" ? "/admin/zones" : "/map");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5EA] w-full max-w-sm mx-4 p-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white font-bold text-base">
            P
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#1D1D1F]">Digital Parking</h1>
            <p className="text-sm text-[#86868B] mt-0.5">Create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="Enter value..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter value..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Role toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#1D1D1F]">Role</label>
            <div className="flex rounded-xl border border-[#D2D2D7] overflow-hidden">
              {(["CITIZEN", "ADMIN"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`
                    flex-1 py-2 text-sm font-medium transition-colors
                    ${role === r
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-white text-[#86868B] hover:bg-[#F5F5F7]"
                    }
                  `}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#FF3B30]">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading} className="mt-2">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-[#86868B] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1D1D1F] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
