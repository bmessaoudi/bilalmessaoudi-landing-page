import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-4">
          404
        </h1>
        <p className="text-zinc-400 text-lg mb-8">
          Questa pagina non esiste.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full border border-zinc-700 px-6 py-3 text-white hover:border-zinc-500 transition-colors font-medium"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
