import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import QuickScan from "./pages/QuickScan";
import EmailDetail from "./pages/EmailDetail";
import ModelPerformance from "./pages/ModelPerformance";
import Settings from "./pages/Settings";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant text-lg">Loading PhishGuard...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-on-surface-variant text-lg">Loading PhishGuard...</div>;
  }

  return (
    <div className="min-h-screen flex antialiased">
      <Sidebar />
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <div className="p-4 md:p-6 lg:p-[48px] max-w-[1440px] mx-auto w-full">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/quick-scan" element={<PrivateRoute><QuickScan /></PrivateRoute>} />
            <Route path="/email/:id" element={<PrivateRoute><EmailDetail /></PrivateRoute>} />
            <Route path="/model" element={<PrivateRoute><ModelPerformance /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
