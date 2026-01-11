import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { RevenuePage } from './pages/RevenuePage';
import { KycPage } from './pages/KycPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DividendsPage } from './pages/DividendsPage';
import { DocsPage } from './pages/DocsPage';

function App() {
  return (
    <Routes>
      {/* Documentation - separate layout */}
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/docs/:pageId" element={<DocsPage />} />

      {/* Main App with Layout */}
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:mint" element={<PropertyDetailPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/kyc" element={<KycPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/dividends" element={<DividendsPage />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
