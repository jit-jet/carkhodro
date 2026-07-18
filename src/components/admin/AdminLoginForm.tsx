"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLogin } from "@/actions/admin-auth";
import { Button, FormError, Input, Label } from "@/src/components/admin/AdminUI";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await adminLogin(username, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/admin") ? redirect : "/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <FormError message={error} />

      <div>
        <Label>نام کاربری</Label>
        <Input
          type="text"
          autoComplete="username"
          placeholder="admin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div>
        <Label>رمز عبور</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ورود…" : "ورود به پنل مدیریت"}
      </Button>
    </form>
  );
}
