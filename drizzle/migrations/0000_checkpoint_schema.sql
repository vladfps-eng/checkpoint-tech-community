create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1));
  if exists (select 1 from public.profiles where username = v_username) then
    v_username := v_username || '_' || substr(md5(random()::text), 1, 4);
  end if;
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    v_username,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), v_username)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  product_name text not null,
  brand text,
  category text not null,
  title text not null,
  summary text not null,
  content text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  content text not null,
  category text not null default 'Notícias',
  published_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null check (char_length(content) <= 1000),
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.profiles(id) on delete cascade not null,
  user_b uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  check (user_a <> user_b),
  unique (user_a, user_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

-- Grants
grant select on public.profiles to anon, authenticated;
grant update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;

grant select on public.news_items to anon, authenticated;
grant insert, update, delete on public.news_items to authenticated;
grant all on public.news_items to service_role;

grant select on public.posts to anon, authenticated;
grant insert, delete on public.posts to authenticated;
grant all on public.posts to service_role;

grant select on public.post_likes to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;
grant all on public.post_likes to service_role;

grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;

grant select, insert on public.conversations to authenticated;
grant all on public.conversations to service_role;

grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.reviews enable row level security;
alter table public.news_items enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select to anon, authenticated
  using (true);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "Reviews are viewable by everyone"
  on public.reviews for select to anon, authenticated
  using (true);
create policy "Users can create own reviews"
  on public.reviews for insert to authenticated
  with check (author_id = auth.uid());
create policy "Users can update own reviews"
  on public.reviews for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Users can delete own reviews"
  on public.reviews for delete to authenticated
  using (author_id = auth.uid());

create policy "News are viewable by everyone"
  on public.news_items for select to anon, authenticated
  using (true);
create policy "Admins manage news"
  on public.news_items for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Posts are viewable by everyone"
  on public.posts for select to anon, authenticated
  using (true);
create policy "Users can create own posts"
  on public.posts for insert to authenticated
  with check (author_id = auth.uid());
create policy "Users can delete own posts"
  on public.posts for delete to authenticated
  using (author_id = auth.uid());

create policy "Likes are viewable by everyone"
  on public.post_likes for select to anon, authenticated
  using (true);
create policy "Users can like as themselves"
  on public.post_likes for insert to authenticated
  with check (user_id = auth.uid());
create policy "Users can remove own likes"
  on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

create policy "Comments are viewable by everyone"
  on public.comments for select to anon, authenticated
  using (true);
create policy "Users can comment as themselves"
  on public.comments for insert to authenticated
  with check (author_id = auth.uid());
create policy "Users can delete own comments"
  on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(), 'moderator') or public.has_role(auth.uid(), 'admin'));

create policy "Users can view own conversations"
  on public.conversations for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());
create policy "Users can start conversations"
  on public.conversations for insert to authenticated
  with check (user_a = auth.uid() or user_b = auth.uid());

create policy "Members can view messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );
create policy "Members can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Realtime para o chat
alter publication supabase_realtime add table public.messages;

-- Conteúdo de exemplo
insert into public.news_items (slug, title, summary, content, category, published_at) values
('rtx-6090-preco-confirmado', 'NVIDIA confirma RTX 6090 com memória 3GB e preço recorde', 'A nova flagship da NVIDIA chega em novembro com 28 GB de VRAM e preço inicial de US$ 2.499.', 'A NVIDIA confirmou os detalhes finais da RTX 6090, a nova flagship da geração. A placa chega com 28 GB de memória GDDR7 mais rápida, dissipador reformulado e consumo de até 575 W.

O preço inicial nos Estados Unidos ficou em US$ 2.499, e as versões de parceiros devem custar ainda mais. No Brasil, a expectativa é de preço a partir de R$ 14 mil nas primeiras semanas.

A companhia aposta em DLSS 5 e em melhora forte de ray tracing para justificar o salto. O primeiro estoque chega às lojas na primeira semana de novembro.', 'Hardware', now() - interval '4 hours'),
('ryzen-9950x3d-games', 'Ryzen 9 9950X3D lidera testes de jogos com folga', 'Com 3D V-Cache de segunda geração, o topo da AMD abre 14% de vantagem sobre o concorrente direto.', 'Os primeiros reviews do Ryzen 9 9950X3D confirmaram o esperado: em jogos, a 3D V-Cache de segunda geração dá ao processador uma vantagem média de 14% sobre o rival direto em 1080p.

O chip mantém 16 núcleos e chega a 5,7 GHz, mas agora o cache extra ficou no CCD com melhor frequência, reduzindo a penalidade em aplicativos.

O preço sugerido é de US$ 699, e a AMD indica que não há necessidade de trocar o cooler em relação à geração anterior.', 'Processadores', now() - interval '1 day'),
('ssd-pcie-60-chegando', 'SSDs PCIe 6.0 prometem 28 GB/s ainda em 2027', 'Fabricantes mostram protótipos de controladores que dobram a velocidade dos SSDs atuais.', 'Durante a atualização de linha, os grandes fabricantes de armazenamento exibiram protótipos de controladores PCIe 6.0 capazes de passar de 28 GB/s de leitura sequencial.

O salto depende da nova plataforma de desktops, que trará as primeiras linhas M.2 com suporte completo ao padrão.

Os primeiros modelos devem chegar ao varejo no fim de 2027, com preços iniciais salgados, como acontece em toda transição de padrão.', 'Armazenamento', now() - interval '2 days'),
('monitores-oled-480hz', 'Monitores OLED de 480 Hz começam a chegar ao Brasil', 'Painéis de 27" com 1440p e 480 Hz chegam com preços entre R$ 7 mil e R$ 9 mil.', 'Os primeiros monitores OLED de 480 Hz desembarcam no Brasil nas próximas semanas. Os modelos de 27 polegadas com resolução 1440p vêm de marcas como Samsung, LG e ASUS.

Além da taxa de atualização absurda, os painéis trazem tempos de resposta de 0,03 ms e brilho maior que a geração passada.

Os preços iniciais devem ficar entre R$ 7 mil e R$ 9 mil, com queda gradual ao longo de 2027.', 'Monitores', now() - interval '3 days'),
('directstorage-20-anunciado', 'DirectStorage 2.0 chega com carregamento quase instantâneo', 'A nova API da Microsoft corta o tempo de load em até 70% nos testes internos.', 'A Microsoft anunciou o DirectStorage 2.0, nova versão da API que acelera o carregamento de jogos em PCs com SSDs NVMe.

Nos testes internos, títulos otimizados carregaram até 70% mais rápido que com a versão 1.x. A grande novidade é o suporte a descompressão direta na GPU e fila única simplificada.

A API chega primeiro aos jogos com engine própria; adaptações para Unreal Engine devem sair no início de 2027.', 'Software', now() - interval '5 days');

insert into public.reviews (product_name, brand, category, title, summary, content, rating, created_at) values
('GeForce RTX 6080', 'NVIDIA', 'Placas de vídeo', 'RTX 6080: a placa 1440p definitiva', 'Desempenho enorme em 1440p, DLSS 5 impecável e consumo controlado. O preço continua sendo o único obstáculo.', 'Depois de três semanas de testes, a RTX 6080 se confirma como a melhor placa para quem joga em 1440p e não pretende trocar de monitor tão cedo.

Nos nossos 15 jogos testados, ela mantém média de 142 fps em 1440p no máximo, e com DLSS 5 o número sobe para mais de 200 fps. O ray tracing continua sendo o ponto forte da arquitetura.

O consumo ficou em torno de 320 W em jogos, um alívio perto da geração passada. O problema segue sendo o preço sugerido de US$ 999, que no Brasil deve começar em R$ 6 mil.', 4, now() - interval '6 days'),
('Ryzen 9 9950X3D', 'AMD', 'Processadores', 'Ryzen 9 9950X3D: o rei dos jogos assumiu o trono', 'Cache 3D de segunda geração entrega a maior média de fps que já medimos em um desktop.', 'O 9950X3D é o processador mais rápido para jogos que já passou pela nossa bancada. Em 1080p com RTX 6080, a média nos nossos 12 jogos ficou 11% acima do modelo anterior.

E diferente do primeiro 3D V-Cache, aqui não existe mais a penalidade grande em aplicativos pesados: a frequência máxima subiu para 5,7 GHz e o agendamento do Windows 12 lida bem com os dois CCDs.

É caro, exige placa AM5 e consome 170 W, mas para quem quer o topo absoluto, não há discussão.', 5, now() - interval '8 days'),
('Odyssey OLED G8 480Hz', 'Samsung', 'Monitores', 'Odyssey OLED G8: 480 Hz que você realmente percebe', 'O primeiro OLED de 480 Hz transforma a sensação de resposta em jogos competitivos.', 'A diferença entre 240 Hz e 480 Hz parecia marketing, mas em jogos competitivos a diferença é sentida de verdade. O painel responde em 0,03 ms e o motion blur praticamente desaparece.

O brilho do OLED melhorou bastante: 1.000 nits em janelas pequenas resolvem a maioria das críticas da geração passada. O modo de cuidado com burn-in é completo e o painel tem garantia de 3 anos.

Contra ele pesam apenas o preço de R$ 8.499 e o fato de 1440p não ser para todos. Para jogadores competitivos, é o melhor monitor já feito.', 5, now() - interval '10 days'),
('9100 Pro 2TB', 'Samsung', 'Armazenamento', 'Samsung 9100 Pro: velocidade bruta sem sustos', '14,8 GB/s de leitura, dissipador eficiente e firmware maduro desde o dia um.', 'O 9100 Pro é o SSD que a linha 990 tentou ser. Com PCIe 5.0 de verdade, ele crava 14,8 GB/s de leitura e 13,5 GB/s de escrita sequencial.

Nos nossos testes de cópia de 100 GB, ele manteve o desempenho sem queda por temperatura graças ao dissipador de fábrica. O firmware da versão de lançamento já está maduro, sem os problemas da geração anterior.

O custo por GB ainda é alto, mas para quem edita vídeo ou quer o melhor carregamento de jogos, é a compra mais futura-prova do mercado.', 5, now() - interval '12 days'),
('Q3 Max', 'Keychron', 'Periféricos', 'Keychron Q3 Max: o teclado que você ajusta tudo', 'Gasket mount, QMK/VIA, conectividade tri-mode e acabamento de alumínio por um preço justo.', 'O Q3 Max é o teclado para quem gosta de mexer. Corpo todo em alumínio, gasket mount com espuma em camadas e estabilizadores pré-lubrificados de fábrica.

A conectividade tri-mode (cabo, Bluetooth e 2.4 GHz) funciona sem falhas, e o VIA permite remapear tudo pelo navegador. O som stock já é ótimo, com thock discreto.

Só pesa: 2 kg no total. É um tijolo com teclas, e o preço de US$ 199 no Brasil chega perto de R$ 1.400. Ainda assim, é dificílimo encontrar algo melhor montado de fábrica.', 4, now() - interval '14 days'),
('Cloud III', 'HyperX', 'Periféricos', 'HyperX Cloud III: conforto acima de tudo', 'O headset continua sendo a referência em conforto para sessões longas, agora com som levemente mais quente.', 'O Cloud III mantém a receita que fez a linha famosa: espuma de memória generosa, arco de aço e grampos que não apertam. Depois de 6 horas seguidas de uso, você esquece que está usando.

O som foi ajustado para jogos: graves mais presentes e médios levemente abaixados. O microfone segue sendo um dos melhores da categoria, com cancelamento decente de teclado.

Ainda não tem Bluetooth e o USB DAC é vendido separado, mas por R$ 699 é a escolha segura para quem joga muitas horas por dia.', 4, now() - interval '16 days');

insert into public.posts (author_id, content, created_at) values
(null, 'Gente, vale a pena pagar mais caro numa RTX 6080 ou pego uma geração anterior usada? Meu foco é 1440p 165 Hz.', now() - interval '9 hours'),
(null, 'Testei o 9950X3D essa semana e a diferença em simulação de voo é absurdamente boa. Quem tá em dúvida de upgrade de CPU pra jogos, esse é o ano.', now() - interval '2 days'),
(null, 'Dica: SSD PCIe 5.0 tá com preço bom no Brasil pela primeira vez. Pra quem edita 4K, a cópia de projetos caiu pela metade aqui.', now() - interval '3 days');
