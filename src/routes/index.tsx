import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cpu, MessageSquare, Heart, Star, Search, Flame, Send } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CheckPoint — Tecnologia, Hardware e Comunidade" },
      { name: "description", content: "Reviews de hardware, notícias de tecnologia e conversa entre entusiastas no CheckPoint." },
      { property: "og:title", content: "CheckPoint — Tecnologia, Hardware e Comunidade" },
      { property: "og:description", content: "Reviews de hardware, notícias de tecnologia e conversa entre entusiastas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const reviews = [
  { name: "RTX 5080 Super", cat: "GPU", score: 9.1, by: "@marina.oc", summary: "Desempenho 4K absurdo, consumo controlado." },
  { name: "Ryzen 9 9950X3D", cat: "CPU", score: 9.4, by: "@vlad", summary: "O novo rei dos games com V-Cache duplo." },
  { name: "Samsung 990 Evo Plus", cat: "SSD", score: 8.2, by: "@rafa_tech", summary: "Ótimo custo-benefício em PCIe 5.0." },
  { name: "ASUS ROG Strix B850", cat: "Placa-mãe", score: 8.7, by: "@lucas.hw", summary: "VRM robusto e BIOS amigável." },
];

const news = [
  "Intel confirma nova geração Nova Lake para 2027",
  "DDR6 chega aos primeiros protótipos de laboratório",
  "Monitores OLED 480Hz ficam mais baratos no Brasil",
];

type Post = { user: string; text: string; likes: number; replies: number };

function Index() {
  const [posts, setPosts] = useState<Post[]>([
    { user: "@marina.oc", text: "Alguém já testou undervolt na 5080? Consegui -60W sem perder FPS 🔥", likes: 42, replies: 12 },
    { user: "@pedro_build", text: "Montando meu primeiro PC. 650W é suficiente para uma 9070 XT?", likes: 18, replies: 23 },
    { user: "@lucas.hw", text: "Review completo da B850 saiu! Feedback é bem-vindo.", likes: 31, replies: 7 },
  ]);
  const [draft, setDraft] = useState("");

  const publish = () => {
    if (!draft.trim()) return;
    setPosts([{ user: "@voce", text: draft.trim(), likes: 0, replies: 0 }, ...posts]);
    setDraft("");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-lg font-semibold">
            <span className="grid size-8 place-items-center rounded bg-primary text-primary-foreground"><Cpu className="size-5" /></span>
            Check<span className="text-primary">Point</span>
          </div>
          <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
            <a href="#reviews" className="hover:text-foreground">Reviews</a>
            <a href="#noticias" className="hover:text-foreground">Notícias</a>
            <a href="#comunidade" className="hover:text-foreground">Comunidade</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            <Search className="size-4" /><input placeholder="Buscar hardware..." className="w-40 bg-transparent outline-none" />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-mono text-sm text-primary">// tecnologia • hardware • comunidade</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
          Salve seu progresso. <span className="text-primary">Compartilhe seu setup.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Reviews feitos por quem usa de verdade, notícias do mundo do hardware e uma comunidade pronta para ajudar no seu próximo build.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="#comunidade" className="rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90">Entrar na conversa</a>
          <a href="#reviews" className="rounded-md border px-5 py-2.5 font-medium hover:bg-secondary">Ver reviews</a>
        </div>
      </section>

      <section id="reviews" className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><Star className="size-5 text-primary" /> Reviews em destaque</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r) => (
            <article key={r.name} className="rounded-lg border bg-card p-5 transition hover:border-primary">
              <div className="flex items-center justify-between">
                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">{r.cat}</span>
                <span className="font-mono text-2xl font-semibold text-primary">{r.score}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{r.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.summary}</p>
              <p className="mt-4 font-mono text-xs text-muted-foreground">por {r.by}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-3">
        <div id="comunidade" className="lg:col-span-2">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><MessageSquare className="size-5 text-primary" /> Comunidade</h2>
          <div className="mb-4 rounded-lg border bg-card p-4">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
              placeholder="Pergunte algo ou mostre seu setup..."
              className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground" />
            <div className="flex justify-end">
              <button onClick={publish} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <Send className="size-4" /> Publicar
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {posts.map((p, i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <p className="font-mono text-sm text-primary">{p.user}</p>
                <p className="mt-1">{p.text}</p>
                <div className="mt-3 flex gap-5 text-sm text-muted-foreground">
                  <button onClick={() => setPosts(posts.map((x, j) => j === i ? { ...x, likes: x.likes + 1 } : x))}
                    className="flex items-center gap-1 hover:text-accent"><Heart className="size-4" /> {p.likes}</button>
                  <span className="flex items-center gap-1"><MessageSquare className="size-4" /> {p.replies}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside id="noticias">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><Flame className="size-5 text-accent" /> Em alta</h2>
          <ol className="space-y-3">
            {news.map((n, i) => (
              <li key={n} className="flex gap-3 rounded-lg border bg-card p-4">
                <span className="font-mono text-xl font-semibold text-muted-foreground">0{i + 1}</span>
                <span className="font-medium">{n}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <footer className="mt-10 border-t py-8 text-center font-mono text-xs text-muted-foreground">
        © 2026 CheckPoint — feito por entusiastas, para entusiastas.
      </footer>
    </div>
  );
}
