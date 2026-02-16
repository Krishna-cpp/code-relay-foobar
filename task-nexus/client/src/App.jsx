import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { NotificationProvider } from './modules/context/NotificationContext';
import { AuthProvider, useAuth } from './modules/context/AuthContext';
import LayoutComponent from './modules/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';

import './App.css';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {

    // 🌙 THEME STATE
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light"
    );

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light");
    };

    return (
        <AuthProvider>
            <NotificationProvider>   {/* ✅ ADDED HERE */}
                <BrowserRouter>
                    <Routes>

                        {/* 🌍 PUBLIC ROUTES */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* 🔐 PROTECTED APP */}
                        <Route
                            path="/app"
                            element={
                                <ProtectedRoute>
                                    <LayoutComponent toggleTheme={toggleTheme} />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="workspaces" element={<Workspaces />} />
                            <Route path="workspaces/:workspaceId" element={<Projects />} />
                            <Route path="projects/:projectId" element={<Tasks />} />
                        </Route>

                        {/* ❌ FALLBACK */}
                        <Route path="*" element={<Navigate to="/" replace />} />

                    </Routes>
                </BrowserRouter>
            </NotificationProvider>   {/* ✅ AND CLOSED HERE */}
        </AuthProvider>
    );
}

export default App;
