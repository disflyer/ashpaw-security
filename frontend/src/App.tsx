import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AppDetails from './pages/AppDetails';
import AuthSetup from './pages/AuthSetup';
import AuthVerify from './pages/AuthVerify';
import WeChatBind from './pages/WeChatBind';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/app/:appId" element={<AppDetails />} />
          
          {/* User Routes */}
          <Route path="/auth/setup/:appId/:userId" element={<AuthSetup />} />
          <Route path="/auth/verify/:appId/:userId" element={<AuthVerify />} />
          <Route path="/auth/wechat-bind/:appId/:userId" element={<WeChatBind />} />
          
          {/* Default Route */}
          <Route path="/" element={<div className="p-8 text-center"><h1>Ashpaw 2FA Service</h1><p>Please use admin or auth links.</p></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;