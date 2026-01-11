import { DocSection } from './types';

export type { DocSection } from './types';

const navigationPT: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Primeiros Passos',
    icon: 'rocket',
    children: [
      { id: 'introduction', title: 'Introdução' },
      { id: 'quickstart', title: 'Quickstart' },
      { id: 'architecture', title: 'Arquitetura' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Conceitos Fundamentais',
    icon: 'book',
    children: [
      { id: 'tokenization', title: 'Tokenização de Imóveis' },
      { id: 'investment-flow', title: 'Fluxo de Investimento' },
      { id: 'dividends', title: 'Distribuição de Dividendos' },
      { id: 'kyc-credentials', title: 'KYC e Credenciais' },
      { id: 'transfer-hook', title: 'Transfer Hook' },
    ],
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    icon: 'code',
    children: [
      { id: 'kota-program', title: 'Kota Program' },
      { id: 'credential-program', title: 'Credential Program' },
      { id: 'instructions', title: 'Instruções' },
      { id: 'accounts', title: 'Contas e PDAs' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend Services',
    icon: 'server',
    children: [
      { id: 'api-overview', title: 'Visão Geral das APIs' },
      { id: 'api-principal', title: 'API Principal' },
      { id: 'api-kyc', title: 'API KYC' },
      { id: 'indexer', title: 'Indexador' },
    ],
  },
  {
    id: 'api-reference',
    title: 'Referência da API',
    icon: 'api',
    children: [
      { id: 'endpoints-properties', title: 'Properties' },
      { id: 'endpoints-investment', title: 'Investment' },
      { id: 'endpoints-auth', title: 'Authentication' },
      { id: 'endpoints-kyc', title: 'KYC Sessions' },
      { id: 'endpoints-credentials', title: 'Credentials' },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infraestrutura',
    icon: 'cloud',
    children: [
      { id: 'docker', title: 'Docker & Containers' },
      { id: 'environment', title: 'Variáveis de Ambiente' },
      { id: 'deployment', title: 'Deploy' },
    ],
  },
  {
    id: 'guides',
    title: 'Guias',
    icon: 'guide',
    children: [
      { id: 'local-development', title: 'Desenvolvimento Local' },
      { id: 'testing', title: 'Testes' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
    ],
  },
];

const navigationEN: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket',
    children: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'quickstart', title: 'Quickstart' },
      { id: 'architecture', title: 'Architecture' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: 'book',
    children: [
      { id: 'tokenization', title: 'Real Estate Tokenization' },
      { id: 'investment-flow', title: 'Investment Flow' },
      { id: 'dividends', title: 'Dividend Distribution' },
      { id: 'kyc-credentials', title: 'KYC & Credentials' },
      { id: 'transfer-hook', title: 'Transfer Hook' },
    ],
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    icon: 'code',
    children: [
      { id: 'kota-program', title: 'Kota Program' },
      { id: 'credential-program', title: 'Credential Program' },
      { id: 'instructions', title: 'Instructions' },
      { id: 'accounts', title: 'Accounts & PDAs' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend Services',
    icon: 'server',
    children: [
      { id: 'api-overview', title: 'API Overview' },
      { id: 'api-principal', title: 'Main API' },
      { id: 'api-kyc', title: 'KYC API' },
      { id: 'indexer', title: 'Indexer' },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: 'api',
    children: [
      { id: 'endpoints-properties', title: 'Properties' },
      { id: 'endpoints-investment', title: 'Investment' },
      { id: 'endpoints-auth', title: 'Authentication' },
      { id: 'endpoints-kyc', title: 'KYC Sessions' },
      { id: 'endpoints-credentials', title: 'Credentials' },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    icon: 'cloud',
    children: [
      { id: 'docker', title: 'Docker & Containers' },
      { id: 'environment', title: 'Environment Variables' },
      { id: 'deployment', title: 'Deployment' },
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    icon: 'guide',
    children: [
      { id: 'local-development', title: 'Local Development' },
      { id: 'testing', title: 'Testing' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
    ],
  },
];

export const getDocsNavigation = (lang: string): DocSection[] => {
  return lang === 'en' ? navigationEN : navigationPT;
};

// Keep for backward compatibility
export const docsNavigation = navigationPT;

export const flattenNavigation = (sections: DocSection[], parentId = ''): { id: string; title: string; parentId: string }[] => {
  const result: { id: string; title: string; parentId: string }[] = [];

  for (const section of sections) {
    result.push({ id: section.id, title: section.title, parentId });
    if (section.children) {
      result.push(...flattenNavigation(section.children, section.id));
    }
  }

  return result;
};

export const findPageById = (id: string, lang = 'pt'): DocSection | undefined => {
  const navigation = getDocsNavigation(lang);
  const search = (sections: DocSection[]): DocSection | undefined => {
    for (const section of sections) {
      if (section.id === id) return section;
      if (section.children) {
        const found = search(section.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return search(navigation);
};

export const getAdjacentPages = (currentId: string, lang = 'pt'): { prev?: { id: string; title: string }; next?: { id: string; title: string } } => {
  const navigation = getDocsNavigation(lang);
  const flat = flattenNavigation(navigation);
  const currentIndex = flat.findIndex(p => p.id === currentId);

  return {
    prev: currentIndex > 0 ? { id: flat[currentIndex - 1].id, title: flat[currentIndex - 1].title } : undefined,
    next: currentIndex < flat.length - 1 ? { id: flat[currentIndex + 1].id, title: flat[currentIndex + 1].title } : undefined,
  };
};
