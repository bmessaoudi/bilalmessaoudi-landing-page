import "../globals.css";
import { buildMetadata, RootDocument } from "@/components/root-document";

export { viewport } from "@/components/root-document";
export const metadata = buildMetadata("it");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="it">{children}</RootDocument>;
}
