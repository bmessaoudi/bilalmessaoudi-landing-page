export type Locale = "it" | "en";

export type Shot = {
  src: string;
  width: number;
  height: number;
  caption: string;
};

export type Project = {
  slug: string;
  group: GroupId;
  /** Short title printed on the book spine in the 3D bookshelf. */
  spine: string;
  /** Spine colour, also used for the sheet edge and the index swatch. */
  color: string;
  title: string;
  who: string;
  tag: string;
  /** Who it was for, short, for the index table. */
  client: string;
  year: number;
  owner: Owner;
  status: Status;
  body: string[];
  facts: { label: string; value: string; todo?: boolean }[];
  shots: Shot[];
};

export type Owner = "client" | "mine";

export type Status = "production" | "delivered" | "development" | "demo";

export type GroupId = "ai" | "business" | "experiences" | "mine";

export type SectionId = "ciao" | "lavori" | "metodo" | "chi" | "contatti";

export type LogLine = { kind: "$" | ">" | "·" | " "; text: string };
