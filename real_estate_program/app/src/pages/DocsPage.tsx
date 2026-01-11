import { FC, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Home, ExternalLink, Github, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { DocsSidebar } from '../components/docs/DocsSidebar';
import { DocsContent } from '../components/docs/DocsContent';
import { TableOfContents } from '../components/docs/TableOfContents';
import { getDocsContent, getPageTitle } from '../docs/content';
import { getAdjacentPages } from '../docs/navigation';

export const DocsPage: FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Default to introduction if no pageId
  const currentPageId = pageId || 'introduction';

  // Get content for current page
  const content = getDocsContent(currentPageId, i18n.language);
  const pageTitle = getPageTitle(currentPageId, i18n.language);
  const { prev, next } = getAdjacentPages(currentPageId, i18n.language);

  // Redirect if page doesn't exist
  useEffect(() => {
    if (pageId && !getDocsContent(pageId, i18n.language)) {
      navigate('/docs/introduction');
    }
  }, [pageId, navigate, i18n.language]);

  // Update document title
  useEffect(() => {
    document.title = `${pageTitle} | Kota Docs`;
  }, [pageTitle]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageId]);

  // Generate breadcrumbs
  const breadcrumbs = [
    { label: 'Docs', to: '/docs' },
    { label: pageTitle, to: `/docs/${currentPageId}` },
  ];

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{t('docs.pageNotFound')}</h1>
          <Link to="/docs" className="text-purple-400 hover:text-purple-300">
            {t('docs.backToDocs')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 z-50">
        <div className="h-full flex items-center justify-between px-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/kota-logo.svg" alt="Kota Logo" className="h-8" />
            </Link>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <ChevronRight className="w-4 h-4 text-gray-600" />
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.to} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                  <Link
                    to={crumb.to}
                    className={clsx(
                      index === breadcrumbs.length - 1
                        ? 'text-gray-300'
                        : 'text-gray-500 hover:text-gray-300'
                    )}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>App</span>
            </Link>
            <a
              href="https://github.com/kota-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={clsx(
          'fixed top-0 left-0 bottom-0 w-72 bg-gray-950 z-50 transform transition-transform duration-300 lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <DocsSidebar />
      </div>

      {/* Desktop sidebar */}
      <DocsSidebar />

      {/* Main content */}
      <main className="lg:pl-72 xl:pr-64 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Content */}
          <article className="prose prose-invert max-w-none">
            <DocsContent content={content} />
          </article>

          {/* Navigation footer */}
          <nav className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex items-center justify-between">
              {prev ? (
                <Link
                  to={`/docs/${prev.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-gray-800 hover:border-purple-500/50 hover:bg-gray-900/50 transition-all max-w-[45%]"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 mb-1">{t('docs.previous')}</div>
                    <div className="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                      {prev.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {next ? (
                <Link
                  to={`/docs/${next.id}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-gray-800 hover:border-purple-500/50 hover:bg-gray-900/50 transition-all max-w-[45%] text-right ml-auto"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 mb-1">{t('docs.next')}</div>
                    <div className="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                      {next.title}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </nav>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              Kota Documentation &copy; {new Date().getFullYear()}
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <a
                href="https://github.com/kota-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1"
              >
                GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://discord.gg/kota"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1"
              >
                Discord
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </footer>
        </div>
      </main>

      {/* Table of Contents (desktop only) */}
      <TableOfContents content={content} />
    </div>
  );
};
