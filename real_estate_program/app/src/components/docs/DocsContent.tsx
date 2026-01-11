import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Link as LinkIcon, Rocket, Code, Server, Cloud, Book, HelpCircle, Building2, DollarSign, Shield, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { DocContent } from '../../docs/types';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';
import { MermaidDiagram } from './MermaidDiagram';

interface Props {
  content: DocContent[];
}

const iconMap: Record<string, FC<{ className?: string }>> = {
  rocket: Rocket,
  code: Code,
  server: Server,
  cloud: Cloud,
  book: Book,
  help: HelpCircle,
  architecture: Layers,
  api: Layers,
  building: Building2,
  dollar: DollarSign,
  lock: Shield,
  shield: Shield,
  flow: ArrowRight,
  guide: Book,
};

// Parse markdown-like text (bold, links)
const parseText = (text: string) => {
  // Parse **bold**
  let parsed = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  // Parse `code`
  parsed = parsed.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-800 rounded text-purple-300 text-sm font-mono">$1</code>');
  return parsed;
};

// Card Grid component
const CardGrid: FC<{ cards: { title: string; description: string; icon?: string; link?: string }[] }> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {cards.map((card, index) => {
        const Icon = card.icon ? iconMap[card.icon] : Rocket;
        const content = (
          <div className="group p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-purple-500/50 hover:bg-gray-900 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                {Icon && <Icon className="w-5 h-5 text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium mb-1 group-hover:text-purple-300 transition-colors">
                  {card.title}
                </h4>
                <p className="text-gray-400 text-sm">{card.description}</p>
              </div>
              {card.link && (
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              )}
            </div>
          </div>
        );

        if (card.link) {
          return (
            <Link key={index} to={card.link}>
              {content}
            </Link>
          );
        }
        return <div key={index}>{content}</div>;
      })}
    </div>
  );
};

// Steps component
const Steps: FC<{ steps: { title: string; content: string }[] }> = ({ steps }) => {
  return (
    <div className="my-6 space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {index + 1}
          </div>
          <div className="flex-1 pt-1">
            <h4 className="text-white font-medium mb-1">{step.title}</h4>
            <p
              className="text-gray-400 text-sm"
              dangerouslySetInnerHTML={{ __html: parseText(step.content) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Tabs component
const Tabs: FC<{ tabs: { label: string; content: DocContent[] }[] }> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="my-6">
      <div className="flex border-b border-gray-800">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === index
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs[activeTab] && <DocsContent content={tabs[activeTab].content} />}
      </div>
    </div>
  );
};

export const DocsContent: FC<Props> = ({ content }) => {
  return (
    <div className="docs-content">
      {content.map((item, index) => {
        switch (item.type) {
          case 'heading': {
            const HeadingTag = `h${item.level}` as keyof JSX.IntrinsicElements;
            const classes = {
              1: 'text-4xl font-bold text-white mb-6 mt-2',
              2: 'text-2xl font-semibold text-white mb-4 mt-10 pt-6 border-t border-gray-800',
              3: 'text-xl font-semibold text-white mb-3 mt-8',
              4: 'text-lg font-medium text-gray-200 mb-2 mt-6',
            };
            return (
              <HeadingTag
                key={index}
                id={item.id}
                className={clsx(classes[item.level], 'group relative scroll-mt-24')}
              >
                {item.text}
                <a
                  href={`#${item.id}`}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <LinkIcon className="w-4 h-4 text-gray-500 hover:text-purple-400" />
                </a>
              </HeadingTag>
            );
          }

          case 'paragraph':
            return (
              <p
                key={index}
                className="text-gray-300 leading-relaxed mb-4"
                dangerouslySetInnerHTML={{ __html: parseText(item.text) }}
              />
            );

          case 'code':
            return (
              <CodeBlock
                key={index}
                code={item.code}
                language={item.language}
                filename={item.filename}
              />
            );

          case 'callout':
            return (
              <Callout key={index} variant={item.variant} title={item.title}>
                <span dangerouslySetInnerHTML={{ __html: parseText(item.text) }} />
              </Callout>
            );

          case 'list':
            const ListTag = item.ordered ? 'ol' : 'ul';
            return (
              <ListTag
                key={index}
                className={clsx(
                  'my-4 space-y-2',
                  item.ordered ? 'list-decimal' : 'list-disc',
                  'pl-6'
                )}
              >
                {item.items.map((listItem, i) => (
                  <li
                    key={i}
                    className="text-gray-300"
                    dangerouslySetInnerHTML={{ __html: parseText(listItem) }}
                  />
                ))}
              </ListTag>
            );

          case 'table':
            return (
              <div key={index} className="my-6 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {item.headers.map((header, i) => (
                        <th
                          key={i}
                          className="text-left px-4 py-3 text-sm font-semibold text-gray-300 bg-gray-900/50"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-4 py-3 text-sm text-gray-400"
                            dangerouslySetInnerHTML={{ __html: parseText(cell) }}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'divider':
            return <hr key={index} className="my-8 border-gray-800" />;

          case 'diagram':
            return <MermaidDiagram key={index} chart={item.mermaid} />;

          case 'card-grid':
            return <CardGrid key={index} cards={item.cards} />;

          case 'steps':
            return <Steps key={index} steps={item.steps} />;

          case 'tabs':
            return <Tabs key={index} tabs={item.tabs} />;

          default:
            return null;
        }
      })}
    </div>
  );
};
