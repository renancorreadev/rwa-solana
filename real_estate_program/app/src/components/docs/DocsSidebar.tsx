import { FC, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, Rocket, Book, Code, Server, Cloud, HelpCircle, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { getDocsNavigation, DocSection } from '../../docs/navigation';

const iconMap: Record<string, FC<{ className?: string }>> = {
  rocket: Rocket,
  book: Book,
  code: Code,
  server: Server,
  cloud: Cloud,
  api: Layers,
  guide: HelpCircle,
};

interface SidebarItemProps {
  section: DocSection;
  level?: number;
}

const SidebarItem: FC<SidebarItemProps> = ({ section, level = 0 }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if current page is in this section
    const currentPath = location.pathname.replace('/docs/', '').replace('/docs', '');
    if (section.id === currentPath) return true;
    if (section.children?.some((child: DocSection) => child.id === currentPath)) return true;
    return true; // Default expanded
  });

  const hasChildren = section.children && section.children.length > 0;
  const Icon = section.icon ? iconMap[section.icon] : null;
  const isParent = level === 0;
  const currentPageId = location.pathname.replace('/docs/', '').replace('/docs', '') || 'introduction';

  if (hasChildren) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200',
            isParent
              ? 'text-gray-200 hover:text-white font-medium text-sm'
              : 'text-gray-400 hover:text-gray-200 text-sm'
          )}
        >
          {Icon && <Icon className="w-4 h-4 text-purple-400" />}
          <span className="flex-1">{section.title}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 border-l border-gray-800 pl-2">
            {section.children!.map((child: DocSection) => (
              <SidebarItem key={child.id} section={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = currentPageId === section.id;

  return (
    <NavLink
      to={`/docs/${section.id}`}
      className={clsx(
        'block px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
        isActive
          ? 'bg-purple-500/20 text-purple-300 font-medium border-l-2 border-purple-500 -ml-0.5 pl-3.5'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
      )}
    >
      {section.title}
    </NavLink>
  );
};

export const DocsSidebar: FC = () => {
  const { t, i18n } = useTranslation();
  const docsNavigation = getDocsNavigation(i18n.language);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  return (
    <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 bg-gray-950 border-r border-gray-800 overflow-y-auto pt-16 z-40">
      {/* Logo/Title */}
      <div className="px-4 py-6 border-b border-gray-800">
        <NavLink to="/docs" className="flex items-center gap-3">
          {/* <img src="/kota-logo.svg" alt="Kota Logo" className="h-8" /> */}
          <div>
            <div className="text-white font-semibold">Kota</div>
            <div className="text-xs text-gray-500">{t('docs.title')}</div>
          </div>
        </NavLink>
      </div>

      {/* Language Selector */}
      <div className="px-4 py-3 border-b border-gray-800">
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 hover:border-purple-500/50 transition-colors"
        >
          <span>{i18n.language === 'pt' ? 'Português' : 'English'}</span>
          <span className="text-gray-500 text-xs">{i18n.language === 'pt' ? 'EN' : 'PT'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder={t('docs.search')}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1">
        {docsNavigation.map((section) => (
          <SidebarItem key={section.id} section={section} />
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-950">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          {t('docs.backToApp')}
        </NavLink>
      </div>
    </aside>
  );
};
