import { canvasFonts } from "@/components/root-document";
import { Portfolio } from "@/components/portfolio";
import { getCopy } from "@/lib/content/copy";
import { getProjects } from "@/lib/content/projects";

export default function Page() {
  return <Portfolio locale="it" copy={getCopy("it")} projects={getProjects("it")} fonts={canvasFonts} />;
}
