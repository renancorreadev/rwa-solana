import { FC, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { DocContent, TableOfContentsItem } from '../../docs/types';

interface Props {
  content: DocContent[];
}

export const TableOfContents: FC<Props> = ({ content }) => {
  const [activeId, setActiveId] = useState<string>('');
  const { t } = useTranslation();

  // Extract headings from content
  const headings: TableOfContentsItem[] = content
    .filter((item): item is DocContent & { type: 'heading' } => item.type === 'heading')
    .map((item) => ({
      id: item.id,
      title: item.text,
      level: item.level,
    }));

  // Track scroll position and update active heading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block fixed right-0 top-0 bottom-0 w-64 pt-24 pb-8 overflow-y-auto">
      <div className="px-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {t('docs.onThisPage')}
        </h4>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => handleClick(heading.id)}
              className={clsx(
                'block w-full text-left text-sm py-1 transition-colors duration-200',
                heading.level === 1 && 'font-medium',
                heading.level === 2 && 'pl-3',
                heading.level === 3 && 'pl-6',
                heading.level === 4 && 'pl-9',
                activeId === heading.id
                  ? 'text-purple-400 border-l-2 border-purple-400 -ml-px pl-3'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {heading.title}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};
