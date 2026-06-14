import { Routes, Route } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { LandingPage } from './pages/LandingPage';
import { DashboardView } from './pages/DashboardView';
import { DisputesView } from './pages/DisputesView';
import { DeliberationView } from './pages/DeliberationView';
import { ReputationView } from './pages/ReputationView';
import { TransactionsView } from './pages/TransactionsView';
import { ArchitectureView } from './pages/ArchitectureView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="disputes" element={<DisputesView />} />
        <Route path="deliberation" element={<DeliberationView />} />
        <Route path="reputation" element={<ReputationView />} />
        <Route path="transactions" element={<TransactionsView />} />
        <Route path="architecture" element={<ArchitectureView />} />
      </Route>
    </Routes>
  );
}

export default App;
