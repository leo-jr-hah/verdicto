import { Routes, Route } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { LandingLayout } from './layouts/LandingLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardView } from './pages/DashboardView';
import { AssessView } from './pages/AssessView';
import { ReputationView } from './pages/ReputationView';
import { TransactionsView } from './pages/TransactionsView';
import { ArchitectureView } from './pages/ArchitectureView';
import { PredictionView } from './pages/PredictionView';
import { BorrowView } from './pages/BorrowView';
import { InsureView } from './pages/InsureView';
import { HowItWorksView } from './pages/HowItWorksView';
import { RoadmapView } from './pages/RoadmapView';
import { OracleView } from './pages/OracleView';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="assess" element={<AssessView />} />
        <Route path="predict" element={<PredictionView />} />
        <Route path="borrow" element={<BorrowView />} />
        <Route path="insure" element={<InsureView />} />
        <Route path="reputation" element={<ReputationView />} />
        <Route path="transactions" element={<TransactionsView />} />
        <Route path="how-it-works" element={<HowItWorksView />} />
        <Route path="architecture" element={<ArchitectureView />} />
        <Route path="roadmap" element={<RoadmapView />} />
        <Route path="oracle" element={<OracleView />} />
      </Route>
    </Routes>
  );
}

export default App;
