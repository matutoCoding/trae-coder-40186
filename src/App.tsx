import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import ActivityPage from "@/pages/ActivityPage";
import MembersPage from "@/pages/MembersPage";
import RoadbookPage from "@/pages/RoadbookPage";
import PublicRoadbookView from "@/pages/PublicRoadbookView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/view" element={<PublicRoadbookView />} />
        <Route element={<Layout />}>
          <Route path="/" element={<ActivityPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/roadbook" element={<RoadbookPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
