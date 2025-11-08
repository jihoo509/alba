// components/UserBar.tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function UserBar() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/"; // 필요 시 router.replace("/")
  };

  return (
    <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 12 }}>
      <span>{email}</span>
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
}
