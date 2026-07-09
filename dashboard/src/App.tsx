import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
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
import { DisputesView } from './pages/DisputesView';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.2,
  ease: 'easeInOut' as const,
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();

  return (
    <>
      <Routes location={location}>
        <Route path="/" element={<LandingLayout />}>
          <Route index element={<AnimatedPage><LandingPage /></AnimatedPage>} />
        </Route>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<AnimatedPage><DashboardView /></AnimatedPage>} />
          <Route path="assess" element={<AnimatedPage><AssessView /></AnimatedPage>} />
          <Route path="confidence" element={<AnimatedPage><PredictionView /></AnimatedPage>} />
          <Route path="predict" element={<Navigate to="/confidence" replace />} />
          <Route path="borrow" element={<AnimatedPage><BorrowView /></AnimatedPage>} />
          <Route path="insure" element={<AnimatedPage><InsureView /></AnimatedPage>} />
          <Route path="reputation" element={<AnimatedPage><ReputationView /></AnimatedPage>} />
          <Route path="transactions" element={<AnimatedPage><TransactionsView /></AnimatedPage>} />
          <Route path="how-it-works" element={<AnimatedPage><HowItWorksView /></AnimatedPage>} />
          <Route path="architecture" element={<AnimatedPage><ArchitectureView /></AnimatedPage>} />
          <Route path="roadmap" element={<AnimatedPage><RoadmapView /></AnimatedPage>} />
          <Route path="oracle" element={<AnimatedPage><OracleView /></AnimatedPage>} />
          <Route path="disputes" element={<AnimatedPage><DisputesView /></AnimatedPage>} />
        </Route>
      </Routes>
      <Analytics />
    </>
  );
}

export default App;
