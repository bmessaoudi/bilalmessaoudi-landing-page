import type { IconName, StickerName } from "@/components/doodles";
import type { TechArea } from "./tech";
import type { GroupId, Locale, LogLine, Owner, Status } from "./types";

type Step = { icon: IconName; title: string; text: string; note?: string };
type Para = { text: string; note?: string; sticker?: StickerName };
type StickerItem = { name: StickerName; label: string };

// Vercel sets the production domain at build time, so a custom domain added later is picked up on its own
const productionHost = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE = {
  url: productionHost ? `https://${productionHost.replace(/^https?:\/\//, "")}` : "https://www.bilalmessaoudi.it",
  email: "bilelmessaudi@gmail.com",
  github: "https://github.com/bmessaoudi",
  linkedin: "https://www.linkedin.com/in/bilal-messaoudi-877a6a183",
};

const it = {
  meta: {
    title: "Bilal Messaoudi, sviluppatore full stack",
    description:
      "Gestionali, siti e agenti AI per aziende, con Next.js, FastAPI e Claude. Sviluppatore full stack freelance: progetti, metodo di lavoro e contatti.",
  },
  nav: { lavori: "Lavori", metodo: "Metodo", chi: "Chi sono", contatti: "Contatti", sections: "Sezioni" },
  otherLocale: { label: "EN", href: "/en", name: "English" },
  loading: "Carico la stanza",
  noWebgl: "Il 3D non è disponibile su questo dispositivo. Il resto del sito funziona lo stesso.",
  ciao: {
    name: "Bilal Messaoudi",
    role: "Sviluppatore full stack, freelance.",
    lead: "Faccio gestionali, siti e agenti AI per aziende. Qui sotto ci sono i progetti, il modo in cui lavoro e i contatti.",
    hint: {
      wide: "Scorri per entrare nella stanza. Gli oggetti sulla scrivania e i libri sullo scaffale si possono cliccare.",
      touch: "Scorri per entrare nella stanza. Gli oggetti sulla scrivania e i libri si possono toccare.",
    },
  },
  lavori: {
    title: "Lavori",
    lead: "Dodici progetti, gli stessi che sono sullo scaffale: sette fatti per clienti e cinque miei. Aprine uno per leggere cosa ho fatto e con quali strumenti.",
    hint: "Passando sopra un titolo, la camera va al suo libro.",
  },
  groups: {
    ai: "AI e automazione",
    business: "Gestionali",
    experiences: "Siti e 3D",
    mine: "App e negozi online",
  } satisfies Record<GroupId, string>,
  owners: {
    client: "Per clienti",
    mine: "Progetti miei",
  } satisfies Record<Owner, string>,
  owner: {
    client: "Lavoro per un cliente",
    mine: "Progetto mio",
  } satisfies Record<Owner, string>,
  status: {
    production: "In produzione",
    delivered: "Consegnato",
    development: "In sviluppo",
    demo: "Demo",
  } satisfies Record<Status, string>,
  statusNote: "I clienti non sono nominati e loghi e marchi negli screenshot sono coperti.",
  ownerNotes: {
    client: "usati ogni giorno da persone vere",
    mine: "le idee che provo la sera e nei weekend",
  } satisfies Record<Owner, string>,
  soon: "foto in arrivo",
  tech: {
    title: "Con cosa lavoro",
    lead: "Scelgo gli strumenti in base al progetto, ma questi sono quelli che tornano più spesso. Il numerino accanto dice in quanti dei progetti qui sopra compare.",
    hint: {
      wide: "passaci sopra per vedere i libri, cliccalo per i progetti",
      touch: "toccane uno per vedere i libri e i progetti",
    },
    usedIn: "Lo trovi in:",
    areas: {
      web: "Siti e interfacce",
      backend: "Backend e dati",
      ai: "AI e agenti",
      apps: "App e 3D",
      services: "Pagamenti, contenuti e messaggi",
    } satisfies Record<TechArea, string>,
    // the copy crosses into client components, so no functions here
    count: { one: "in 1 progetto", many: "in {n} progetti" },
  },
  metodo: {
    title: "Come lavoro",
    steps: [
      {
        icon: "search",
        title: "Capisco il problema",
        text: "Parlo con chi userà lo strumento, guardo come lavora oggi e **dove perde tempo**.",
        note: "spesso non è quello scritto nella prima email",
      },
      {
        icon: "plan",
        title: "Pianifico e preparo una demo",
        text: "Divido il lavoro, studio le tecnologie giuste per quel progetto e preparo **una demo da provare insieme**, per verificare che vada verso il risultato che volevate.",
        note: "niente sorprese alla consegna",
      },
      {
        icon: "code",
        title: "Sviluppo con l'aiuto dell'AI",
        text: "Mi faccio aiutare da assistenti AI per scrivere il codice, così il tempo va sulle parti che contano.",
      },
      {
        icon: "check",
        title: "Rivedo e provo tutto a mano",
        text: "Prima di andare online **provo ogni schermata** come la userebbe il cliente.",
      },
      {
        icon: "dashboard",
        title: "Vi lascio il controllo",
        text: "Ogni progetto ha **una dashboard** da cui gestite la soluzione in autonomia: dati, utenti, impostazioni e, quando c'è un sito, anche testi e foto.",
        note: "così non dovete chiamarmi per cambiare una foto",
      },
    ] as Step[],
  },
  chi: {
    title: "Chi sono",
    body: [
      {
        text: "Sviluppo **dal 2019**. Ho cominciato come sviluppatore junior in un'azienda che fa gestionali WMS per la logistica. Nel 2023 mi sono messo in proprio: prima siti per piccole attività e bot Telegram, poi gestionali per eventi, formazione e marketplace.",
        note: "sì, quando il codice si scriveva tutto a mano",
      },
      {
        text: "Oggi lavoro anche in **Becreatives**, uno studio che progetta e sviluppa prodotti digitali per startup e aziende, dall'idea al lancio. Quest'anno mi occupo soprattutto di agenti AI, server MCP e progetti in 3D. Questa stanza l'ho modellata e illuminata in Blender, il pupazzo arancione sulla scrivania è Clawd, la mascotte di Claude Code.",
      },
      {
        text: "Da tre anni lavoro **in full remote**, ma mi trovo spesso tra Brescia, Bergamo e Milano.",
        sticker: "pin",
      },
      {
        text: "Mi piace tutto quello che riguarda la tecnologia e l'innovazione. Passo parecchio tempo su X a cercare **idee e strumenti nuovi**, e seguo volentieri cosa succede nel mondo, nelle aziende e sui mercati.",
      },
      {
        text: "Quando non programmo gioco a basket e ai videogiochi, guardo i film Marvel, esco con gli amici e viaggio appena posso. Sono **di buona forchetta**: provare cucine diverse e ristoranti nuovi è una delle parti dei viaggi che preferisco.",
      },
    ] as Para[],
    stickers: [
      { name: "basket", label: "basket" },
      { name: "controller", label: "videogiochi" },
      { name: "film", label: "Marvel" },
      { name: "plane", label: "viaggi" },
      { name: "pizza", label: "ristoranti" },
      { name: "chart", label: "mercati" },
    ] as StickerItem[],
    stickersNote: "quando non programmo",
  },
  contatti: {
    title: "Contatti",
    lead: "Scrivimi due righe sul progetto, o sul processo che in azienda vi porta via più tempo.",
    copy: "Copia",
    copied: "Copiato",
    call: "Chiedi una call",
    callSubject: "Una call per un progetto",
    signoff: "a presto!",
    credits: "Stanza modellata e cotta in Blender. Clawd è la mascotte di Claude Code di Anthropic.",
  },
  sheet: {
    close: "Chiudi",
    prev: "Precedente",
    next: "Successivo",
    of: "di",
    noShots: "Gli screenshot di questo progetto arrivano presto.",
    keys: "Frecce per sfogliare, Esc per chiudere",
  },
  scene: { monitor: "Come lavoro", robot: "Clawd", moka: "Chi sono", phone: "Contatti", ball: "Basket", shield: "Marvel", map: "Viaggi", pad: "Videogiochi", posters: "Con cosa lavoro", ironman: "Iron Man" },
  log: [
    { kind: "$", text: "claude" },
    { kind: ">", text: "aggiungi l'export in Word ai ricorsi" },
    { kind: "·", text: "leggo templates/ricorso.docx" },
    { kind: "·", text: "modifico api/export.py" },
    { kind: "·", text: "modifico editor/Toolbar.tsx" },
    { kind: "$", text: "pytest tests/estrazioni" },
    { kind: " ", text: "  tutti i test passano" },
    { kind: ">", text: "il pulsante va accanto a Salva" },
    { kind: "·", text: "spostato, 1 file modificato" },
  ] satisfies LogLine[],
};

export type Copy = typeof it;

const en: Copy = {
  meta: {
    title: "Bilal Messaoudi, full stack developer",
    description:
      "Business software, websites and AI agents for companies, built with Next.js, FastAPI and Claude. Freelance full stack developer: projects, process and contact.",
  },
  nav: { lavori: "Work", metodo: "Process", chi: "About", contatti: "Contact", sections: "Sections" },
  otherLocale: { label: "IT", href: "/", name: "Italiano" },
  loading: "Loading the room",
  noWebgl: "3D is not available on this device. Everything else still works.",
  ciao: {
    name: "Bilal Messaoudi",
    role: "Full stack developer, freelance.",
    lead: "I build business software, websites and AI agents for companies. Below you will find my projects, how I work and how to reach me.",
    hint: {
      wide: "Scroll to walk into the room. You can click the objects on the desk and the books on the shelf.",
      touch: "Scroll to walk into the room. You can tap the objects on the desk and the books.",
    },
  },
  lavori: {
    title: "Work",
    lead: "Twelve projects, the same ones on the shelf: seven for clients and five of my own. Open one to read what I did and which tools I used.",
    hint: "Hover a title and the camera moves to its book.",
  },
  groups: {
    ai: "AI and automation",
    business: "Business software",
    experiences: "Websites and 3D",
    mine: "Apps and online shops",
  },
  owners: { client: "For clients", mine: "My own projects" },
  owner: { client: "Client work", mine: "My own project" },
  status: { production: "Live", delivered: "Delivered", development: "In development", demo: "Demo" },
  statusNote: "Clients are not named, and logos and brands in the screenshots are covered.",
  ownerNotes: { client: "used every day by real people", mine: "ideas I try out in the evenings and at weekends" },
  soon: "photos soon",
  tech: {
    title: "What I work with",
    lead: "I pick the tools for each project, but these are the ones that keep coming back. The small number next to each one says how many of the projects above use it.",
    hint: {
      wide: "hover one to see the books, click it for the projects",
      touch: "tap one to see the books and the projects",
    },
    usedIn: "You'll find it in:",
    areas: {
      web: "Sites and interfaces",
      backend: "Backend and data",
      ai: "AI and agents",
      apps: "Apps and 3D",
      services: "Payments, content and messaging",
    },
    count: { one: "in 1 project", many: "in {n} projects" },
  },
  metodo: {
    title: "How I work",
    steps: [
      {
        icon: "search",
        title: "I get to the problem",
        text: "I talk to the people who will use the tool, look at how they work today and **where the time goes**.",
        note: "often not the one in the first email",
      },
      {
        icon: "plan",
        title: "I plan and build a demo",
        text: "I split the work, look into the right technologies for that project and build **a demo we try together**, to check it is heading towards the result you wanted.",
        note: "no surprises on delivery day",
      },
      {
        icon: "code",
        title: "I develop with AI help",
        text: "AI assistants help me write the code, so the time goes into the parts that matter.",
      },
      {
        icon: "check",
        title: "I review and test by hand",
        text: "Before going live I **try every screen** the way the client would use it.",
      },
      {
        icon: "dashboard",
        title: "You keep control",
        text: "Every project comes with **a dashboard** where you run the solution on your own: data, users, settings and, when there is a website, its copy and photos too.",
        note: "so you never need me to swap a photo",
      },
    ],
  },
  chi: {
    title: "About",
    body: [
      {
        text: "I have been writing software **since 2019**. I started as a junior developer at a company that builds WMS software for logistics. In 2023 I went freelance: first websites for small businesses and Telegram bots, then business systems for events, training and marketplaces.",
        note: "yes, back when code was all typed by hand",
      },
      {
        text: "Today I also work at **Becreatives**, a studio that designs and builds digital products for startups and companies, from the idea to launch. This year I mostly work on AI agents, MCP servers and 3D projects. I modelled and lit this room in Blender; the orange figure on the desk is Clawd, the Claude Code mascot.",
      },
      {
        text: "I have worked **fully remote** for three years, but I am often around Brescia, Bergamo and Milan.",
        sticker: "pin",
      },
      {
        text: "I like anything to do with technology and new ideas. I spend a fair amount of time on X looking for **new ideas and tools**, and I like keeping up with what happens in the world, in companies and in the markets.",
      },
      {
        text: "When I am not coding I play basketball and video games, watch Marvel films, go out with friends and travel whenever I can. I am **a big eater**: trying different cuisines and new restaurants is one of my favourite parts of travelling.",
      },
    ],
    stickers: [
      { name: "basket", label: "basketball" },
      { name: "controller", label: "video games" },
      { name: "film", label: "Marvel" },
      { name: "plane", label: "travel" },
      { name: "pizza", label: "restaurants" },
      { name: "chart", label: "markets" },
    ],
    stickersNote: "when I am not coding",
  },
  contatti: {
    title: "Contact",
    lead: "Write me a couple of lines about the project, or about the process that takes up most of your team's time.",
    copy: "Copy",
    copied: "Copied",
    call: "Ask for a call",
    callSubject: "A call about a project",
    signoff: "talk soon!",
    credits: "Room modelled and baked in Blender. Clawd is the Claude Code mascot by Anthropic.",
  },
  sheet: {
    close: "Close",
    prev: "Previous",
    next: "Next",
    of: "of",
    noShots: "Screenshots for this project are coming soon.",
    keys: "Arrow keys to browse, Esc to close",
  },
  scene: { monitor: "How I work", robot: "Clawd", moka: "About", phone: "Contact", ball: "Basketball", shield: "Marvel", map: "Travel", pad: "Video games", posters: "What I work with", ironman: "Iron Man" },
  log: it.log,
};

export function getCopy(locale: Locale): Copy {
  return locale === "en" ? en : it;
}
