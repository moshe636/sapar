import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scissors, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PunchCard, History } from "@/components/PunchCard";
import { ExperienceNav } from "@/components/ExperienceNav";
import { normalizePhone } from "@/lib/phone";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "הכרטיסייה שלי | כרטיסיית תספורות" },
      { name: "description", content: "הזינו מספר טלפון וצפו בכרטיסיית 10 התספורות שלכם." },
      { property: "og:title", content: "הכרטיסייה שלי | כרטיסיית תספורות" },
      { property: "og:description", content: "הזינו מספר טלפון וצפו בכרטיסיית 10 התספורות שלכם." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Card = { full_name: string; shop_name: string | null; punches: string[]; history: string[]; completed_cards: number };

function Index() {
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function load(p: string, silent = false) {
    if (!silent) setLoading(true);
    const { data } = await supabase.rpc("get_card_by_phone", { _phone: p, _include_shop: true });
    const c = (data as Card[] | null)?.[0] ?? null;
    setCard(c); setNotFound(!c); setLoading(false);
  }

  useEffect(() => {
    if (!query) return;
    const t = setInterval(() => load(query, true), 10000);
    return () => clearInterval(t);
  }, [query]);

  return (
    <>
    <ExperienceNav />
    <main className="mx-auto min-h-screen max-w-md px-4 pb-10 pt-8">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brass text-primary-foreground shadow-glow"><Scissors /></div>
        <h1 className="text-3xl text-foreground">הכרטיסייה שלי</h1>
        <p className="mt-1 text-sm text-muted-foreground">הזינו את מספר הטלפון כדי לראות את הכרטיסייה</p>
      </header>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const p = normalizePhone(phone); if (p.length < 9) { setNotFound(true); setCard(null); return; } setQuery(p); load(p); }}>
        <Input inputMode="tel" dir="ltr" placeholder="050-123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 text-center text-lg" />
        <Button type="submit" size="lg" className="h-12" disabled={loading}><Search /> הצג</Button>
      </form>
      <div className="mt-8 space-y-6">
        {card && (<>
          <PunchCard name={card.full_name} shopName={card.shop_name} punches={card.punches} completed={card.completed_cards} />
          <section><h3 className="mb-2 text-lg text-foreground">היסטוריית תספורות</h3><History history={card.history} /></section>
        </>)}
        {notFound && !card && <p className="rounded-xl border border-border bg-card p-4 text-center text-muted-foreground">לא נמצאה כרטיסייה למספר הזה. פנו לספר כדי לפתוח כרטיסייה.</p>}
      </div>
    </main>
    </>
  );
}
