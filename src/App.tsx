import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TripListPage } from '@/pages/TripListPage';
import { CreateTripPage } from '@/pages/CreateTripPage';
import { BudgetPage } from '@/pages/BudgetPage';
import { ItineraryPage } from '@/pages/ItineraryPage';
import { PlanPage } from '@/pages/PlanPage';
import { useTripStore } from '@/store/tripStore';
import { parseShareLink } from '@/utils/shareUtils';

function AppInitializer() {
  const initialize = useTripStore((state) => state.initialize);
  const importShareData = useTripStore((state) => state.importShareData);

  useEffect(() => {
    initialize();

    const shareData = parseShareLink();
    if (shareData) {
      importShareData(shareData);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [initialize, importShareData]);

  return null;
}

export default function App() {
  return (
    <Router>
      <AppInitializer />
      <Routes>
        <Route path="/" element={<TripListPage />} />
        <Route path="/trip/new" element={<CreateTripPage />} />
        <Route path="/trip/:id/budget" element={<BudgetPage />} />
        <Route path="/trip/:id/itinerary" element={<ItineraryPage />} />
        <Route path="/trip/:id/plan" element={<PlanPage />} />
        <Route path="*" element={<TripListPage />} />
      </Routes>
    </Router>
  );
}
