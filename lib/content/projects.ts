import type { TechId } from "./tech";
import type { GroupId, Locale, Owner, Project, Shot, Status } from "./types";

type Localized = Record<Locale, Omit<Project, "slug" | "group" | "spine" | "color" | "shots" | "client" | "year" | "owner" | "status" | "stack"> & { shots: string[] }>;

type Entry = {
  slug: string;
  group: GroupId;
  spine: string;
  color: string;
  shots: Omit<Shot, "caption">[];
  text: Localized;
};

const shot = (file: string, width = 1600, height = 1000) => ({ src: `/projects/${file}`, width, height });

const ENTRIES: Entry[] = [
  // ---------------- AI e automazione ----------------
  {
    slug: "ricorsi-da-pdf",
    group: "ai",
    spine: "Decreti",
    color: "#C8634F",
    shots: [shot("decreti-04-editor.jpg"), shot("decreti-05-wizard.jpg")],
    text: {
      it: {
        title: "Ricorsi scritti da una cartella di PDF",
        who: "Per uno studio legale di recupero crediti",
        tag: "AI",
        body: [
          "Per ogni pratica lo studio riceve contratti, piani di ammortamento e atti di cessione, e da lì scriveva a mano il ricorso per decreto ingiuntivo.",
          "Ora si caricano i PDF. Claude legge i documenti, estrae i dati in un formato fisso, sceglie il modello di ricorso adatto e lo compila. L'avvocato apre il testo in un editor dove i campi riempiti dall'AI sono colorati per tipo, li controlla ed esporta in Word.",
          "Le estrazioni hanno test di regressione su pratiche anonimizzate: se cambio un prompt e qualcosa si rompe, lo vedo prima del cliente.",
        ],
        facts: [
          { label: "Stack", value: "Next.js, TipTap, FastAPI, MongoDB, API di Claude con prompt caching" },
          { label: "Risultato", value: "Tempo per pratica, prima e dopo", todo: true },
        ],
        shots: [
          "L'editor: i colori indicano anagrafiche, importi, date e riferimenti compilati dall'AI.",
          "Il caricamento di una nuova pratica.",
        ],
      },
      en: {
        title: "Court filings written from a folder of PDFs",
        who: "For a debt collection law firm",
        tag: "AI",
        body: [
          "For every case the firm receives loan contracts, repayment plans and assignment deeds, and used to write the payment order application by hand.",
          "Now they upload the PDFs. Claude reads the documents, extracts the data into a fixed schema, picks the right template and fills it in. The lawyer opens the draft in an editor where every AI-filled field is colour coded by type, checks it and exports to Word.",
          "Extractions are covered by regression tests on anonymised cases, so if a prompt change breaks something I see it before the client does.",
        ],
        facts: [
          { label: "Stack", value: "Next.js, TipTap, FastAPI, MongoDB, Claude API with prompt caching" },
          { label: "Result", value: "Time per case, before and after", todo: true },
        ],
        shots: ["The editor: colours mark names, amounts, dates and references filled in by the AI.", "Uploading a new case."],
      },
    },
  },
  {
    slug: "copilota-bandi",
    group: "ai",
    spine: "Bandi",
    color: "#7FA58D",
    shots: [shot("bandi-01-ricerca-bandi.jpg"), shot("bandi-02-risposta-citata.jpg")],
    text: {
      it: {
        title: "Un copilota per i bandi pubblici",
        who: "Pensato per i consulenti di finanza agevolata",
        tag: "AI",
        body: [
          "Gli incentivi pubblici italiani sono sparsi su decine di siti. Il sistema li raccoglie da fonti ufficiali, controlla ogni scheda sulla pagina dell'ente e li rende interrogabili con domande normali.",
          "Ogni risposta cita la fonte. Se un dato non c'è, il copilota lo dice invece di inventarlo. Lo stesso motore è esposto come server MCP, quindi si può usare anche direttamente da Claude.",
        ],
        facts: [
          { label: "Stack", value: "TypeScript, Postgres con pgvector, Firecrawl, Claude, MCP" },
        ],
        shots: [
          "La domanda di un consulente e i tre bandi trovati, con stato, data di verifica e documenti ufficiali collegati.",
          "La risposta del copilota: per ogni bando requisiti, spese ammesse ed esclusioni, ognuna con il riferimento alla sezione del documento.",
        ],
      },
      en: {
        title: "A copilot for public grants",
        who: "Built for grant consultants",
        tag: "AI",
        body: [
          "Italian public incentives are spread over dozens of websites. The system collects them from official sources, checks every record against the issuing body's page and makes them searchable in plain language.",
          "Every answer cites its source. When a detail is missing the copilot says so instead of making it up. The same engine is exposed as an MCP server, so it also works straight from Claude.",
        ],
        facts: [
          { label: "Stack", value: "TypeScript, Postgres with pgvector, Firecrawl, Claude, MCP" },
        ],
        shots: [
          "A consultant's question and the three grants found, with status, verification date and linked official documents.",
          "The copilot's answer: eligibility, allowed costs and exclusions for each grant, each citing the section of the source document.",
        ],
      },
    },
  },
  {
    slug: "knowledge-mcp",
    group: "ai",
    spine: "knowledge-mcp",
    color: "#4E6E8E",
    shots: [shot("knowledge-01-home.jpg"), shot("knowledge-02-come-si-salva.jpg")],
    text: {
      it: {
        title: "Una memoria condivisa per gli agenti AI",
        who: "Lo uso ogni giorno",
        tag: "AI",
        body: [
          "Librerie, articoli e strumenti utili finivano persi tra segnalibri di X e chat. knowledge-mcp è un server MCP remoto: importa i segnalibri, permette di salvare link dal telefono, arricchisce ogni voce con un modello piccolo e la rende cercabile dagli agenti.",
        ],
        facts: [
          { label: "Stack", value: "Cloudflare Workers, D1 con ricerca full-text, OAuth 2.1, Alchemy" },
        ],
        shots: [
          "La pagina pubblica: cos'è la libreria e come funziona in tre passi.",
          "I tre modi per salvare una risorsa: dalla chat con Claude, dai segnalibri di X o dal telefono.",
        ],
      },
      en: {
        title: "A shared memory for AI agents",
        who: "I use it every day",
        tag: "AI",
        body: [
          "Useful libraries, articles and tools kept getting lost between X bookmarks and chats. knowledge-mcp is a remote MCP server: it imports bookmarks, saves links from your phone, enriches each entry with a small model and makes it searchable by agents.",
        ],
        facts: [
          { label: "Stack", value: "Cloudflare Workers, D1 full-text search, OAuth 2.1, Alchemy" },
        ],
        shots: [
          "The public page: what the library is and how it works in three steps.",
          "The three ways to save a resource: from a Claude chat, from X bookmarks or from your phone.",
        ],
      },
    },
  },
  {
    slug: "tg-sniffer",
    group: "ai",
    spine: "tg-sniffer",
    color: "#3E5C76",
    shots: [shot("tgsniffer-01-rotte.jpg"), shot("tgsniffer-02-log.jpg")],
    text: {
      it: {
        title: "Canali Telegram copiati e tradotti in tempo reale",
        who: "Per community di trading su Telegram",
        tag: "Automazione",
        body: [
          "Copia i messaggi da canali sorgente a canali di destinazione e li traduce con Claude Haiku, mantenendo formattazione e gergo. Filtra le parole bloccate e sincronizza anche le cancellazioni.",
          "C'è una dashboard per i clienti e una suite di test che gira a ogni modifica.",
        ],
        facts: [{ label: "Stack", value: "Python, Telethon, FastAPI, React, Docker" }],
        shots: [
          "Le rotte: quali canali vengono copiati verso quali, con lingua di traduzione e tempi di consegna. Dati dimostrativi.",
          "Il log dei messaggi: le copie tradotte e quelli bloccati dalle parole filtrate.",
        ],
      },
      en: {
        title: "Telegram channels mirrored and translated live",
        who: "For trading communities on Telegram",
        tag: "Automation",
        body: [
          "It copies messages from source channels to destination channels and translates them with Claude Haiku, keeping formatting and jargon intact. It filters blocked words and mirrors deletions too.",
          "Clients get a dashboard, and a test suite runs on every change.",
        ],
        facts: [{ label: "Stack", value: "Python, Telethon, FastAPI, React, Docker" }],
        shots: [
          "The routes: which channels are copied to which, with translation language and delivery times. Demo data.",
          "The message log: translated copies, and messages blocked by filtered words.",
        ],
      },
    },
  },
  {
    slug: "lead-finder",
    group: "ai",
    spine: "Lead finder",
    color: "#B98A5E",
    shots: [shot("leadfinder-01-demo.jpg")],
    text: {
      it: {
        title: "Trovare clienti che non hanno un sito",
        who: "Per trovare i miei clienti",
        tag: "Automazione",
        body: [
          "Uno scraper in quattro passaggi trova imprese locali, controlla se hanno un sito decente, ne stima il fatturato e raccoglie i contatti.",
          "Per le più promettenti prepara una demo del sito con il loro marchio, da mandare insieme alla prima email.",
        ],
        facts: [{ label: "Stack", value: "Next.js, FastAPI, Playwright, Firecrawl, MongoDB" }],
        shots: ["Una delle demo generate."],
      },
      en: {
        title: "Finding clients who have no website",
        who: "To find my own clients",
        tag: "Automation",
        body: [
          "A four-step scraper finds local businesses, checks whether they have a decent website, estimates their revenue and collects contact details.",
          "For the most promising ones it builds a demo site with their branding, sent along with the first email.",
        ],
        facts: [{ label: "Stack", value: "Next.js, FastAPI, Playwright, Firecrawl, MongoDB" }],
        shots: ["One of the generated demos."],
      },
    },
  },

  // ---------------- Gestionali e piattaforme ----------------
  {
    slug: "gestionale-eventi",
    group: "business",
    spine: "Eventi",
    color: "#E0A458",
    shots: [shot("eventi-01-dashboard.jpg"), shot("eventi-02-conto-economico.jpg")],
    text: {
      it: {
        title: "Prenotazioni, ingressi e cassa per eventi in quattro città",
        who: "Per un organizzatore di eventi con sedi all'estero",
        tag: "Gestionale",
        body: [
          "Prima c'erano fogli condivisi, contanti contati a fine serata e promoter pagati a memoria. Ora ogni prenotazione ha un QR che si scansiona all'ingresso, ogni sera si chiude la cassa separando contanti e carte, e il conto economico è diviso per sede.",
          "Sei livelli di permessi separano chi vende, chi controlla gli ingressi e chi vede i numeri.",
        ],
        facts: [
          { label: "Stack", value: "Next.js, Express, MongoDB, Stripe" },
        ],
        shots: ["La dashboard del giorno, con dati dimostrativi.", "Conto economico per sede."],
      },
      en: {
        title: "Bookings, door check-in and cash for events in four cities",
        who: "For an events company with venues abroad",
        tag: "Business software",
        body: [
          "Before: shared spreadsheets, cash counted at the end of the night, promoters paid from memory. Now every booking has a QR code scanned at the door, the till is closed every night with cash and card kept apart, and profit and loss is split by venue.",
          "Six permission levels separate who sells, who works the door and who sees the numbers.",
        ],
        facts: [
          { label: "Stack", value: "Next.js, Express, MongoDB, Stripe" },
        ],
        shots: ["Today's dashboard, with demo data.", "Profit and loss by venue."],
      },
    },
  },
  {
    slug: "borsa-calciatori",
    group: "business",
    spine: "Calciatori",
    color: "#2F4A3A",
    shots: [shot("calcio-01-valori-mercato.jpg", 1265, 1036)],
    text: {
      it: {
        title: "La borsa dei calciatori",
        who: "Per una startup nel calcio",
        tag: "Piattaforma",
        body: [
          "Una piattaforma dove ogni calciatore ha un valore di mercato che si muove come un titolo. Ho costruito la landing, il portale con statistiche e trasferimenti e l'academy.",
          "I dati sportivi arrivano live da più fornitori. I contenuti, in più lingue, li gestisce il cliente da Sanity.",
        ],
        facts: [{ label: "Stack", value: "Next.js, Sanity, Sportmonks, Zustand" }],
        shots: ["Valori di mercato."],
      },
      en: {
        title: "A stock market for footballers",
        who: "For a football startup",
        tag: "Platform",
        body: [
          "A platform where every player has a market value that moves like a share price. I built the landing page, the stats and transfers portal and the academy.",
          "Sports data comes in live from several providers. The client manages multilingual content in Sanity.",
        ],
        facts: [{ label: "Stack", value: "Next.js, Sanity, Sportmonks, Zustand" }],
        shots: ["Market values."],
      },
    },
  },
  {
    slug: "academy-online",
    group: "business",
    spine: "Academy",
    color: "#6B5B95",
    shots: [shot("academy-01-catalogo.jpg")],
    text: {
      it: {
        title: "Un'academy online con pagamenti",
        who: "Per una scuola di formazione online",
        tag: "Piattaforma",
        body: ["Catalogo corsi, area personale, risorse scaricabili e acquisto con Stripe, con backend e frontend separati."],
        facts: [{ label: "Stack", value: "Next.js, Express, MongoDB, Stripe" }],
        shots: ["Il catalogo."],
      },
      en: {
        title: "An online academy with payments",
        who: "For an online training school",
        tag: "Platform",
        body: ["Course catalogue, personal area, downloadable resources and Stripe checkout, with separate backend and frontend."],
        facts: [{ label: "Stack", value: "Next.js, Express, MongoDB, Stripe" }],
        shots: ["The catalogue."],
      },
    },
  },

  // ---------------- Siti ed esperienze 3D ----------------
  {
    slug: "noleggio-di-lusso",
    group: "experiences",
    spine: "Noleggio",
    color: "#1E2230",
    shots: [shot("noleggio-01-flotta.jpg")],
    text: {
      it: {
        title: "Noleggio di lusso, rifatto da zero",
        who: "Per un autonoleggio di lusso",
        tag: "Sito",
        body: [
          "La prima versione del sito non era piaciuta al cliente. L'ho rifatta da capo: flotta filtrabile, schede veicolo, auto per matrimoni, richiesta di preventivo, italiano e inglese.",
          "Testi e foto li cambia il cliente da solo.",
        ],
        facts: [{ label: "Stack", value: "Next.js 16, GSAP, Lenis, Sanity, next-intl, Resend" }],
        shots: ["La flotta, con targhe e marchio coperti."],
      },
      en: {
        title: "Luxury car rental, rebuilt from scratch",
        who: "For a luxury car rental company",
        tag: "Website",
        body: [
          "The client did not like the first version of the site. I rebuilt it from the ground up: filterable fleet, vehicle pages, wedding cars, quote requests, Italian and English.",
          "The client edits copy and photos on their own.",
        ],
        facts: [{ label: "Stack", value: "Next.js 16, GSAP, Lenis, Sanity, next-intl, Resend" }],
        shots: ["The fleet, with plates and branding covered."],
      },
    },
  },
  {
    slug: "yacht-guida-vocale",
    group: "experiences",
    spine: "Yacht a vela",
    color: "#D8D3C6",
    shots: [shot("yacht-01-scena.jpg", 1600, 900), shot("yacht-02-spaccato.jpg", 1600, 900)],
    text: {
      it: {
        title: "Uno yacht 3D con una guida che risponde a voce",
        who: "Per un cantiere di yacht a vela",
        tag: "3D e voce",
        body: [
          "Un museo 3D di uno yacht a vela. Chiedi a voce di vedere il pozzetto o il salone: l'agente risponde e porta la camera nel punto giusto.",
          "Riconoscimento vocale, modello linguistico e sintesi vocale lavorano in tempo reale, e il modello linguistico può muovere la scena.",
        ],
        facts: [
          { label: "Stack", value: "three.js, Blender, LiveKit Agents, Claude, Deepgram, ElevenLabs" },
        ],
        shots: ["La scena principale.", "Lo spaccato degli interni."],
      },
      en: {
        title: "A 3D sailing yacht with a guide you talk to",
        who: "For a sailing yacht builder",
        tag: "3D and voice",
        body: [
          "A 3D museum of a sailing yacht. Ask out loud to see the cockpit or the saloon: the agent answers and moves the camera there.",
          "Speech recognition, language model and speech synthesis run in real time, and the language model is allowed to move the scene.",
        ],
        facts: [
          { label: "Stack", value: "three.js, Blender, LiveKit Agents, Claude, Deepgram, ElevenLabs" },
        ],
        shots: ["The main scene.", "The interior cutaway."],
      },
    },
  },
  {
    slug: "vabbe",
    group: "mine",
    spine: "Vabbè",
    color: "#E6CF62",
    shots: [shot("tshirt-01-home.jpg", 1600, 2616)],
    text: {
      it: {
        title: "Un negozio di magliette che si gestisce da solo",
        who: "Un negozio online tutto mio",
        tag: "E-commerce",
        body: [
          "Paghi con Stripe e l'ordine parte verso lo stampatore, che stampa e spedisce. Riconciliazione, carrelli abbandonati e richieste di recensione girano da soli.",
          "Tutto sta nel piano gratuito di Cloudflare, con i limiti di CPU e di query rispettati nel codice.",
        ],
        facts: [{ label: "Stack", value: "Next.js, Hono, Cloudflare D1, Stripe" }],
        shots: ["La home del negozio."],
      },
      en: {
        title: "A T-shirt shop that runs itself",
        who: "An online shop of my own",
        tag: "E-commerce",
        body: [
          "You pay with Stripe and the order goes straight to the print partner, who prints and ships. Reconciliation, abandoned carts and review requests all run on their own.",
          "Everything fits in Cloudflare's free tier, with CPU and query limits enforced in code.",
        ],
        facts: [{ label: "Stack", value: "Next.js, Hono, Cloudflare D1, Stripe" }],
        shots: ["The shop's home page."],
      },
    },
  },
  {
    slug: "tamamoshi",
    group: "mine",
    spine: "Tamamoshi",
    color: "#A8C686",
    shots: [],
    text: {
      it: {
        title: "Un Tamagotchi con il modello linguistico sul telefono",
        who: "Un esperimento con i modelli on-device",
        tag: "App",
        body: [
          "Un animaletto in pixel art che impara a conoscerti e tiene un diario dei ricordi. Il modello linguistico gira direttamente sul telefono, anche senza connessione.",
        ],
        facts: [
          { label: "Stack", value: "Expo, llama.rn, Gemma 2 2B, SQLite" },
        ],
        shots: [],
      },
      en: {
        title: "A Tamagotchi with the language model on the phone",
        who: "An experiment with on-device models",
        tag: "App",
        body: [
          "A pixel art pet that gets to know you and keeps a diary of memories. The language model runs on the phone itself, even offline.",
        ],
        facts: [
          { label: "Stack", value: "Expo, llama.rn, Gemma 2 2B, SQLite" },
        ],
        shots: [],
      },
    },
  },
];

// owner, status, year and a generic client name for the index; clients are never named
// stack: the tools from lib/content/tech.ts, most telling first (the index shows the first four)
const META: Record<string, { year: number; owner: Owner; status: Status; stack: TechId[]; client: Record<Locale, string> }> = {
  "ricorsi-da-pdf": { year: 2026, owner: "client", status: "development", stack: ["nextjs", "fastapi", "mongodb", "claude", "tiptap", "python", "react"], client: { it: "Studio legale", en: "Law firm" } },
  "copilota-bandi": { year: 2026, owner: "mine", status: "demo", stack: ["claude", "mcp", "postgres", "firecrawl", "typescript"], client: { it: "Progetto mio", en: "Personal" } },
  "knowledge-mcp": { year: 2026, owner: "mine", status: "production", stack: ["mcp", "cloudflare", "typescript"], client: { it: "Progetto mio", en: "Personal" } },
  "tg-sniffer": { year: 2026, owner: "client", status: "production", stack: ["python", "telethon", "fastapi", "react", "docker"], client: { it: "Community di trading", en: "Trading communities" } },
  "lead-finder": { year: 2026, owner: "mine", status: "development", stack: ["nextjs", "fastapi", "playwright", "firecrawl", "mongodb", "python", "react"], client: { it: "Progetto mio", en: "Personal" } },
  "gestionale-eventi": { year: 2026, owner: "client", status: "production", stack: ["nextjs", "express", "mongodb", "stripe", "node", "react"], client: { it: "Organizzatore di eventi", en: "Events company" } },
  "borsa-calciatori": { year: 2026, owner: "client", status: "delivered", stack: ["nextjs", "sanity", "react"], client: { it: "Startup nel calcio", en: "Football startup" } },
  "academy-online": { year: 2025, owner: "client", status: "delivered", stack: ["nextjs", "express", "mongodb", "stripe", "node", "react"], client: { it: "Formazione online", en: "Online training" } },
  "noleggio-di-lusso": { year: 2026, owner: "client", status: "production", stack: ["nextjs", "gsap", "sanity", "resend", "react"], client: { it: "Autonoleggio", en: "Car rental" } },
  "yacht-guida-vocale": { year: 2026, owner: "client", status: "demo", stack: ["threejs", "blender", "livekit", "claude", "deepgram", "elevenlabs"], client: { it: "Cantiere navale", en: "Shipyard" } },
  vabbe: { year: 2026, owner: "mine", status: "development", stack: ["nextjs", "hono", "cloudflare", "stripe", "react"], client: { it: "Progetto mio", en: "Personal" } },
  tamamoshi: { year: 2026, owner: "mine", status: "development", stack: ["expo", "llama", "sqlite", "react"], client: { it: "Progetto mio", en: "Personal" } },
};

export const GROUP_ORDER: GroupId[] = ["ai", "business", "experiences", "mine"];

export function getProjects(locale: Locale): Project[] {
  return ENTRIES.map((e) => {
    const t = e.text[locale];
    return {
      slug: e.slug,
      group: e.group,
      spine: e.spine,
      color: e.color,
      title: t.title,
      who: t.who,
      tag: t.tag,
      client: META[e.slug].client[locale],
      year: META[e.slug].year,
      owner: META[e.slug].owner,
      status: META[e.slug].status,
      stack: META[e.slug].stack,
      body: t.body,
      facts: t.facts,
      shots: e.shots.map((s, i) => ({ ...s, caption: t.shots[i] ?? "" })),
    };
  });
}
