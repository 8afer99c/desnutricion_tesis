import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Home from './pages/Home';
import PredictionForm from './pages/PredictionForm';
import BatchPrediction from './pages/BatchPrediction';
import Dashboard from './pages/Dashboard';
import Metrics from './pages/Metrics';

import PageWrapper from './components/PageWrapper';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="predict" element={<PageWrapper><PredictionForm /></PageWrapper>} />
          <Route path="batch-predict" element={<PageWrapper><BatchPrediction /></PageWrapper>} />
          <Route path="dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="metrics" element={<PageWrapper><Metrics /></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default App;
