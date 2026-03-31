export interface Idea {
  title: string;
  description: string;
  tags: string[];
  color: string;
}

export const ideas: Idea[] = [
  {
    title: "Dashboard e Gestionali Interni",
    description:
      "Pannelli di controllo su misura per gestire dati, team e processi aziendali. Tutto in un unico posto, accessibile e chiaro.",
    tags: ["Web App", "Dati", "Automazione"],
    color: "#007BFF",
  },
  {
    title: "Landing Page Vetrine",
    description:
      "Pagine web d'impatto che raccontano il tuo brand e convertono visitatori in clienti. Veloci, belle, ottimizzate.",
    tags: ["Web", "SEO", "Conversione"],
    color: "#8A2BE2",
  },
  {
    title: "Gestione Prenotazioni",
    description:
      "Un sistema di prenotazione che lavora per te 24/7. Perfetto per ristoranti, studi professionali, servizi.",
    tags: ["Web", "Mobile", "Automazione"],
    color: "#00D4AA",
  },
  {
    title: "Tutto quello che è innovativo per la tua azienda",
    description:
      "Hai un'idea che non rientra nelle categorie classiche? Ancora meglio. Parliamone e costruiamo qualcosa di unico.",
    tags: ["Innovazione", "Su Misura", "Consulenza"],
    color: "#FF6B35",
  },
];
