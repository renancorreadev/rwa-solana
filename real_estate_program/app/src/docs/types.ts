export interface DocSection {
  id: string;
  title: string;
  icon?: string;
  children?: DocSection[];
}

export interface DocPage {
  id: string;
  title: string;
  description?: string;
  content: DocContent[];
  previousPage?: { id: string; title: string };
  nextPage?: { id: string; title: string };
}

export type DocContent =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; language: string; code: string; filename?: string }
  | { type: 'callout'; variant: 'info' | 'warning' | 'success' | 'error'; title?: string; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'divider' }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'diagram'; mermaid: string }
  | { type: 'tabs'; tabs: { label: string; content: DocContent[] }[] }
  | { type: 'card-grid'; cards: { title: string; description: string; icon?: string; link?: string }[] }
  | { type: 'steps'; steps: { title: string; content: string }[] };

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}
