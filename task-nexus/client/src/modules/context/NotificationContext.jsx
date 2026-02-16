import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const API_BASE = "http://localhost:5000/api";

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("nexus_token");
            if (!token) return;

            const res = await axios.get(`${API_BASE}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const list = res.data || [];

            setNotifications(list);
            setUnreadCount(list.filter(n => !n.is_read).length);

        } catch (err) {
            console.error("Notification fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("nexus_token");

            await axios.put(`${API_BASE}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev =>
                prev.map(n =>
                    n.id === id ? { ...n, is_read: 1 } : n
                )
            );

            setUnreadCount(prev => Math.max(prev - 1, 0));

        } catch (err) {
            console.error("Mark read failed:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // auto refresh every 15s
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            refreshNotifications: fetchNotifications,
            loading
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}
