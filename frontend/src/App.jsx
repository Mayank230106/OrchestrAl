<<<<<<< HEAD
import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import Team from './pages/Team';
import Integrations from './pages/Integrations';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <div>
      <Toaster />
      <Routes>
        {/* ── Public routes (no login required) ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── Private routes — redirects to /login if unauthenticated ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/sidebar" element={<Sidebar />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
=======
import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import Team from './pages/Team';
import Integrations from './pages/Integrations';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <div>
      <Toaster />
      <Routes>
        {/* ── Public routes (no login required) ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── Private routes — redirects to /login if unauthenticated ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/sidebar" element={<Sidebar />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
>>>>>>> 519d705 (deploy frontend again)
