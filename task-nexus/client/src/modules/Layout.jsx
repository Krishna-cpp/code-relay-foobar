import { Bell } from 'lucide-react';
import { useNotifications } from '../modules/context/NotificationContext';
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/context/AuthContext';
import { LayoutDashboard, Building2, LogOut, User } from 'lucide-react';

export default function Layout({ toggleTheme }) {

    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead } = useNotifications();
const [showNotifications, setShowNotifications] = React.useState(false);

    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <aside className="sidebar glass">
                <div className="sidebar-header">
                    <h1 className="sidebar-logo">Task<span className="text-primary">Nexus</span></h1>
                </div>

                <nav className="sidebar-nav">
                   <NavLink to="/app" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
    <LayoutDashboard size={20} /><span>Dashboard</span>
</NavLink>

<NavLink to="/app/workspaces" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
    <Building2 size={20} /><span>Workspaces</span>
</NavLink>

                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar"><User size={18} /></div>
                        <div className="user-details">
                            <span className="user-name">{user?.username || user?.data?.username || 'User'}</span>
                            <span className="user-email">{user?.email || user?.data?.email || ''}</span>
                        </div>
                    </div>
                    {/* 🔔 NOTIFICATION BELL */}
<div style={{ position: "relative", marginBottom: "0.6rem" }}>
    <button
        className="btn-ghost"
        style={{ width: "100%" }}
        onClick={() => setShowNotifications(prev => !prev)}
    >
        <Bell size={18} />
        <span style={{ marginLeft: "6px" }}>Notifications</span>

        {unreadCount > 0 && (
            <span style={{
                marginLeft: "auto",
                background: "#ef4444",
                borderRadius: "999px",
                padding: "2px 6px",
                fontSize: "0.7rem",
                color: "white"
            }}>
                {unreadCount}
            </span>
        )}
    </button>

    {/* DROPDOWN */}
    {showNotifications && (
        <div style={{
            position: "absolute",
            bottom: "110%",
            left: 0,
            width: "100%",
            background: "var(--glass)",
            border: "1px solid var(--glass-border)",
            borderRadius: "0.6rem",
            padding: "0.5rem",
            zIndex: 200
        }}>
            {notifications.length === 0 ? (
                <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>No notifications</p>
            ) : (
                notifications.map(n => (
                    <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        style={{
                            padding: "0.5rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            background: n.read ? "transparent" : "rgba(59,130,246,0.1)",
                            borderRadius: "0.4rem",
                            marginBottom: "4px"
                        }}
                    >
                        {n.message}
                    </div>
                ))
            )}
        </div>
    )}
</div>

                    <button className="btn-ghost logout-btn" onClick={handleLogout}>
                        <LogOut size={18} /><span>Logout</span>
                    </button>
                    <button
    onClick={toggleTheme}
    className="btn-ghost"
    style={{ width: "100%", marginTop: "0.5rem" }}
>
    Toggle Theme
</button>

                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
