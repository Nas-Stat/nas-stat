-- =============================================================================
-- Seed data for local development
-- Runs automatically on `supabase db reset`
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Categories
-- ---------------------------------------------------------------------------
INSERT INTO categories (slug, label, sort_order) VALUES
  ('zivotni-prostredi',    'Životní prostředí',    1),
  ('skolstvi',             'Školství',              2),
  ('zdravotnictvi',        'Zdravotnictví',         3),
  ('dopravni-infrastruktura', 'Dopravní infrastruktura', 4),
  ('energetika',           'Energetika',            5),
  ('fungovani-uradu',      'Fungování úřadu',       6),
  ('bezpecnost',           'Bezpečnost',            7),
  ('jine',                 'Jiné',                  8)
ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 1. Test users (10)
-- ---------------------------------------------------------------------------
-- Password for all users: password123
-- The handle_new_user trigger auto-creates profiles with role + role_verified.

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'jan.novak@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"jan_novak","full_name":"Jan Novák","role":"citizen"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'petra.svobodova@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"petra_svobodova","full_name":"Petra Svobodová","role":"citizen"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'martin.dvorak@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"martin_dvorak","full_name":"Martin Dvořák","role":"citizen"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'eva.cerna@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"eva_cerna","full_name":"Eva Černá","role":"citizen"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
   'tomas.horak@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"tomas_horak","full_name":"Tomáš Horák","role":"citizen"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
   'starosta.prahy@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"starosta_prahy","full_name":"Starosta Prahy","role":"obec"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated',
   'starosta.brna@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"starosta_brna","full_name":"Starosta Brna","role":"obec"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated',
   'hejtman.stredocesky@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"hejtman_stredocesky","full_name":"Hejtman Středočeský","role":"kraj"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated',
   'hejtman.jihomoravsky@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"hejtman_jihomoravsky","full_name":"Hejtman Jihomoravský","role":"kraj"}',
   NOW(), NOW(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated',
   'ministr.dopravy@test.cz', crypt('password123', gen_salt('bf')),
   NOW(), '{"provider":"email","providers":["email"]}',
   '{"username":"ministr_dopravy","full_name":"Ministr Dopravy","role":"ministerstvo"}',
   NOW(), NOW(), '', '', '', '');

-- Create identities for each user (required by Supabase Auth)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  id, id, id,
  json_build_object('sub', id, 'email', email, 'email_verified', true)::jsonb,
  'email', NOW(), NOW(), NOW()
FROM auth.users
WHERE id IN (
  'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-000000000010'
);

-- Verify officials (the trigger sets role_verified=false for non-citizens)
UPDATE public.profiles SET role_verified = true
WHERE id IN (
  'a1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-000000000010'
);

-- ---------------------------------------------------------------------------
-- 2. Reports (120)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  user_ids UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005'
  ];
  official_ids UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000010'
  ];
  categories TEXT[] := ARRAY['dopravni-infrastruktura', 'zivotni-prostredi', 'skolstvi', 'zdravotnictvi', 'energetika', 'fungovani-uradu', 'bezpecnost', 'jine'];
  statuses TEXT[] := ARRAY['pending', 'in_review', 'resolved', 'rejected', 'escalated'];
  escalation_roles TEXT[] := ARRAY['obec', 'kraj', 'ministerstvo'];

  -- 10 Czech cities: [lng, lat]
  city_lngs FLOAT[] := ARRAY[14.4378, 16.6068, 18.2625, 13.3776, 17.2509, 15.0543, 14.4747, 15.8327, 15.7781, 17.6668];
  city_lats FLOAT[] := ARRAY[50.0755, 49.1951, 49.8209, 49.7384, 49.5938, 50.7663, 48.9745, 50.2092, 50.0343, 49.2264];

  titles TEXT[] := ARRAY[
    'Rozbitý chodník na hlavní ulici',
    'Nefunkční pouliční osvětlení',
    'Díra v silnici u školy',
    'Přeplněné kontejnery na odpad',
    'Chybějící přechod pro chodce',
    'Poškozená autobusová zastávka',
    'Graffiti na historické budově',
    'Nebezpečná křižovatka bez semaforu',
    'Spadlý strom blokuje cestu',
    'Znečištěná řeka ve městě',
    'Rozbitá lavička v parku',
    'Nefunkční fontána na náměstí',
    'Poškozený plot u hřiště',
    'Zanedbané dětské hřiště',
    'Zaplavená podchod po dešti',
    'Prasklé vodovodní potrubí',
    'Výtluky na cyklostezce',
    'Chybějící dopravní značka',
    'Poškozená střecha zastávky',
    'Zarostlý chodník vegetací',
    'Nefunkční odvodňovací kanál',
    'Popraskané schody u metra',
    'Nedostatečné osvětlení podchodu',
    'Rozbité sklo na zastávce',
    'Uvolněné dlaždice na náměstí',
    'Poškozená silnice po zimě',
    'Nefunkční semafor na křižovatce',
    'Špinavá fasáda radnice',
    'Vandalismus na veřejném WC',
    'Zanesené odtokové kanály'
  ];

  descriptions TEXT[] := ARRAY[
    'Chodník je v dezolátním stavu, hrozí úraz chodcům. Prosím o opravu.',
    'Lampa nesvítí už přes měsíc, úsek je v noci nebezpečný.',
    'Velká díra přímo u přechodu, nebezpečí pro děti cestou do školy.',
    'Kontejnery přetékají, odpad se válí po zemi. Potřeba častějšího svozu.',
    'Na frekventovaném místě chybí přechod, lidé přebíhají silnici.',
    'Střecha zastávky je proražená, při dešti neplní svůj účel.',
    'Sprejeři pomalovali fasádu chráněné budovy, prosím o vyčištění.',
    'Každý den tu dochází k nebezpečným situacím, je potřeba semafor.',
    'Strom spadl při bouřce a blokuje průjezd. Nutná okamžitá akce.',
    'V řece plavou odpady, zápach je cítit z daleka.',
    'Lavička v parku je rozlámaná, nelze na ní sedět.',
    'Fontána na náměstí neteče již několik týdnů.',
    'Plot kolem dětského hřiště je poškozený, děti mohou vběhnout do silnice.',
    'Hřiště je zanedbané, prolézačky rezavé a pískoviště znečištěné.',
    'Po každém větším dešti je podchod pod vodou.',
    'Z prasklého potrubí teče voda na chodník, v zimě námraza.',
    'Cyklostezka má výtluky, cyklisté musí objíždět po silnici.',
    'Na křižovatce chybí značka přednosti v jízdě.',
    'Plexisklo na zastávce je rozbité a trčí ostré hrany.',
    'Chodník je zarostlý keři, chodci musí chodit po silnici.',
    'Odvodňovací kanál je ucpaný, při dešti se tvoří kaluže.',
    'Schody u stanice metra jsou popraskané a kluzké.',
    'V podchodu je tma i přes den, lidé se tam bojí chodit.',
    'Rozbité sklo na zastávce může poranit čekající cestující.',
    'Dlaždice na náměstí jsou uvolněné, hrozí zakopnutí.',
    'Silnice je po zimě plná výmolů, poškozuje auta.',
    'Semafor na křižovatce bliká oranžově už týden.',
    'Fasáda radnice je špinavá a omítka opadává.',
    'Veřejné WC je zdevastované vandaly, nefunkční.',
    'Odtokové kanály jsou zanesené listím, voda stojí na silnici.'
  ];

  i INT;
  city_idx INT;
  lng FLOAT;
  lat FLOAT;
  report_status TEXT;
  report_id UUID;
BEGIN
  FOR i IN 1..120 LOOP
    city_idx := ((i - 1) % 10) + 1;
    lng := city_lngs[city_idx] + (random() - 0.5) * 0.05;
    lat := city_lats[city_idx] + (random() - 0.5) * 0.05;
    report_status := statuses[((i - 1) % 5) + 1];

    INSERT INTO public.reports (
      profile_id, title, description, location, rating, category, status,
      assigned_to, escalated_to_role,
      created_at, updated_at
    ) VALUES (
      user_ids[((i - 1) % 5) + 1],
      titles[((i - 1) % 30) + 1],
      descriptions[((i - 1) % 30) + 1],
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      (i % 5) + 1,
      categories[((i - 1) % 6) + 1],
      report_status,
      CASE WHEN report_status = 'escalated' THEN official_ids[((i - 1) % 5) + 1] ELSE NULL END,
      CASE WHEN report_status = 'escalated' THEN escalation_roles[((i - 1) % 3) + 1] ELSE NULL END,
      NOW() - ((120 - i) || ' days')::interval,
      NOW() - ((120 - i) || ' days')::interval + interval '2 hours'
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Topics (20)
-- ---------------------------------------------------------------------------
INSERT INTO public.topics (title, description, created_by, created_at) VALUES
  ('Cyklostezky ve městě', 'Diskuse o rozvoji cyklistické infrastruktury v našem městě.', 'a1000000-0000-0000-0000-000000000001', NOW() - interval '90 days'),
  ('Parkování v centru', 'Jak řešit nedostatek parkovacích míst v historickém centru?', 'a1000000-0000-0000-0000-000000000002', NOW() - interval '85 days'),
  ('Svoz odpadu', 'Diskuse o frekvenci a kvalitě svozu komunálního odpadu.', 'a1000000-0000-0000-0000-000000000003', NOW() - interval '80 days'),
  ('Veřejná zeleň', 'Návrhy na údržbu a rozšíření parků a zelených ploch.', 'a1000000-0000-0000-0000-000000000004', NOW() - interval '75 days'),
  ('Bezpečnost na silnicích', 'Co můžeme udělat pro zvýšení bezpečnosti chodců a cyklistů?', 'a1000000-0000-0000-0000-000000000005', NOW() - interval '70 days'),
  ('Veřejná doprava', 'Zlepšení spojů a komfortu městské hromadné dopravy.', 'a1000000-0000-0000-0000-000000000001', NOW() - interval '65 days'),
  ('Kulturní akce', 'Jaké kulturní akce byste uvítali ve vašem městě?', 'a1000000-0000-0000-0000-000000000002', NOW() - interval '60 days'),
  ('Sportovní zázemí', 'Diskuse o dostupnosti sportovišť a jejich stavu.', 'a1000000-0000-0000-0000-000000000003', NOW() - interval '55 days'),
  ('Kvalita ovzduší', 'Monitoring a opatření pro zlepšení kvality ovzduší.', 'a1000000-0000-0000-0000-000000000004', NOW() - interval '50 days'),
  ('Rekonstrukce náměstí', 'Plány na revitalizaci hlavního náměstí — co byste změnili?', 'a1000000-0000-0000-0000-000000000005', NOW() - interval '45 days'),
  ('Psí výběhy', 'Potřebujeme více oplocených výběhů pro psy?', 'a1000000-0000-0000-0000-000000000001', NOW() - interval '40 days'),
  ('Školy a školky', 'Kapacity a kvalita vzdělávacích zařízení v okolí.', 'a1000000-0000-0000-0000-000000000002', NOW() - interval '35 days'),
  ('Nová výstavba', 'Developer plánuje nový bytový komplex — vaše názory?', 'a1000000-0000-0000-0000-000000000003', NOW() - interval '30 days'),
  ('Hluk z dopravy', 'Problém s nadměrným hlukem z frekventovaných silnic.', 'a1000000-0000-0000-0000-000000000004', NOW() - interval '25 days'),
  ('Čistota ulic', 'Jak zlepšit čistotu veřejných prostranství?', 'a1000000-0000-0000-0000-000000000005', NOW() - interval '20 days'),
  ('Wifi v parcích', 'Mělo by město nabízet veřejné wifi v parcích?', 'a1000000-0000-0000-0000-000000000001', NOW() - interval '15 days'),
  ('Bezbariérovost', 'Přístupnost veřejných budov pro osoby s handicapem.', 'a1000000-0000-0000-0000-000000000002', NOW() - interval '12 days'),
  ('Komunitní zahrady', 'Zájem o komunitní zahrádkaření na městských pozemcích.', 'a1000000-0000-0000-0000-000000000003', NOW() - interval '8 days'),
  ('Noční život a rušení klidu', 'Konflikty mezi nočními podniky a rezidenty.', 'a1000000-0000-0000-0000-000000000004', NOW() - interval '5 days'),
  ('Rozpočet města', 'Transparentnost městského rozpočtu — kde vidíte plýtvání?', 'a1000000-0000-0000-0000-000000000005', NOW() - interval '2 days');

-- ---------------------------------------------------------------------------
-- 4. Comments (~100)
-- ---------------------------------------------------------------------------
-- 4a. Comments on topics (2–5 per topic, ~60 total)
DO $$
DECLARE
  topic_rec RECORD;
  all_users UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000010'
  ];
  topic_comments TEXT[] := ARRAY[
    'Souhlasím, tohle je důležité téma pro naše město.',
    'Měli bychom uspořádat veřejné setkání k tomuto tématu.',
    'Jako zástupce obce mohu potvrdit, že se na tom pracuje.',
    'Děkuji za nastolení tohoto tématu, řeším to již dlouho.',
    'Mám konkrétní návrh — napíšu detailněji v příštím příspěvku.',
    'V jiném městě to vyřešili pomocí participativního rozpočtu.',
    'Tohle by mělo být priorita číslo jedna!',
    'Zajímavý pohled, ale je potřeba zvážit i druhou stranu.',
    'Na krajské úrovni se tím zabýváme, brzy budou výsledky.',
    'Bylo by dobré udělat anketu mezi občany.',
    'Osobně s tím mám špatnou zkušenost, je třeba jednat.',
    'Děkuji všem za konstruktivní diskusi.',
    'Z pozice ministerstva mohu říct, že připravujeme novou legislativu.',
    'Navrhuju zřídit pracovní skupinu z řad občanů.',
    'Skvělý nápad, plně ho podporuji!'
  ];
  i INT;
  num_comments INT;
  topic_idx INT := 0;
BEGIN
  FOR topic_rec IN SELECT id FROM public.topics ORDER BY created_at LOOP
    topic_idx := topic_idx + 1;
    num_comments := 2 + (topic_idx % 4); -- 2 to 5 comments per topic
    FOR i IN 1..num_comments LOOP
      INSERT INTO public.comments (profile_id, topic_id, content, created_at)
      VALUES (
        all_users[((topic_idx + i - 1) % 10) + 1],
        topic_rec.id,
        topic_comments[((topic_idx * 3 + i) % 15) + 1],
        NOW() - ((60 - topic_idx * 2 - i) || ' days')::interval
      );
    END LOOP;
  END LOOP;
END $$;

-- 4b. Comments on reports (~40, on first 20 reports)
DO $$
DECLARE
  report_rec RECORD;
  all_users UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000010'
  ];
  report_comments TEXT[] := ARRAY[
    'Potvrzuji, tento problém trvá už dlouho.',
    'Díky za nahlášení, budeme se tím zabývat.',
    'Oprava byla zařazena do plánu na příští měsíc.',
    'Stejný problém je i o ulici dál.',
    'Mám fotky, můžu doplnit.',
    'Už jsem to hlásil na úřad, bez odezvy.',
    'Jako starosta potvrzuji přijetí podnětu.',
    'Předáno příslušnému odboru k řešení.',
    'Situace se zhoršuje, prosím o urychlení.',
    'Oprava dokončena, děkujeme za podnět!'
  ];
  i INT;
  num_comments INT;
  report_idx INT := 0;
BEGIN
  FOR report_rec IN SELECT id FROM public.reports ORDER BY created_at LIMIT 20 LOOP
    report_idx := report_idx + 1;
    num_comments := 1 + (report_idx % 3); -- 1 to 3 comments
    FOR i IN 1..num_comments LOOP
      INSERT INTO public.comments (profile_id, report_id, content, created_at)
      VALUES (
        all_users[((report_idx + i + 2) % 10) + 1],
        report_rec.id,
        report_comments[((report_idx * 2 + i) % 10) + 1],
        NOW() - ((100 - report_idx * 3 - i) || ' days')::interval
      );
    END LOOP;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Votes (~200)
-- ---------------------------------------------------------------------------
-- 5a. Votes on reports (~120, spread across reports)
DO $$
DECLARE
  report_rec RECORD;
  voter_ids UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000010'
  ];
  report_idx INT := 0;
  num_voters INT;
  j INT;
  voter_offset INT;
BEGIN
  FOR report_rec IN SELECT id FROM public.reports ORDER BY created_at LOOP
    report_idx := report_idx + 1;
    -- 0-3 voters per report, cycling
    num_voters := report_idx % 4;
    voter_offset := (report_idx * 3) % 10;
    FOR j IN 1..num_voters LOOP
      INSERT INTO public.votes (profile_id, report_id, vote_type)
      VALUES (
        voter_ids[((voter_offset + j - 1) % 10) + 1],
        report_rec.id,
        CASE WHEN (report_idx + j) % 5 = 0 THEN 'down' ELSE 'up' END
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 5b. Votes on topics (~80, spread across topics)
DO $$
DECLARE
  topic_rec RECORD;
  voter_ids UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000010'
  ];
  topic_idx INT := 0;
  num_voters INT;
  j INT;
  voter_offset INT;
BEGIN
  FOR topic_rec IN SELECT id FROM public.topics ORDER BY created_at LOOP
    topic_idx := topic_idx + 1;
    -- 2-6 voters per topic
    num_voters := 2 + (topic_idx % 5);
    voter_offset := (topic_idx * 7) % 10;
    FOR j IN 1..num_voters LOOP
      INSERT INTO public.votes (profile_id, topic_id, vote_type)
      VALUES (
        voter_ids[((voter_offset + j - 1) % 10) + 1],
        topic_rec.id,
        CASE WHEN (topic_idx + j) % 7 = 0 THEN 'down' ELSE 'up' END
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
