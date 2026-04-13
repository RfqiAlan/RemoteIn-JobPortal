import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ExternalJobs from './pages/ExternalJobs';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      {/* Global Navbar applied to all pages */}
      <div className="relative w-full overflow-x-hidden">
        <Navbar />
        
        {/* Router switches views */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/remote-jobs" element={<ExternalJobs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
