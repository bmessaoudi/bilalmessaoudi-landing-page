import "../../globals.css";
import { buildMetadata, RootDocument } from "@/components/root-document";

export { viewport } from "@/components/root-document";
export const metadata = buildMetadata("en");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
