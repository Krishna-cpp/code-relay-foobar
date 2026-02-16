import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Plus, Users, Trash2, ChevronRight } from 'lucide-react';
import { useNotifications } from '../modules/context/NotificationContext';

const API_BASE = 'http://localhost:5000/api';

export default function Workspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    // Invite states
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMsg, setInviteMsg] = useState('');

    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    // Fetch workspaces
    useEffect(() => {
        const token = localStorage.getItem('nexus_token');

        axios.get(`${API_BASE}/workspaces`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setWorkspaces(res.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, []);

    // Create workspace
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const token = localStorage.getItem('nexus_token');

        try {
            const res = await axios.post(
                `${API_BASE}/workspaces`,
                { name, description },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setWorkspaces(prev => [...prev, res.data]);
            setName('');
            setDescription('');
            setShowForm(false);

            addNotification({
                message: `Workspace "${res.data.name}" created`,
                type: "workspace"
            });

        } catch (err) {
            console.error(err);
        }
    };

    // Delete workspace
    const handleDelete = async (id) => {
        const token = localStorage.getItem('nexus_token');

        try {
            await axios.delete(`${API_BASE}/workspaces/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setWorkspaces(prev => prev.filter(w => w.id !== id));

            addNotification({
                message: `Workspace deleted`,
                type: "warning"
            });

        } catch (err) {
            console.error(err);
        }
    };

    // Invite user
    const inviteUser = async (workspaceId) => {
        const token = localStorage.getItem('nexus_token');

        if (!inviteEmail.trim()) return;

        try {
            await axios.post(
                `${API_BASE}/workspaces/${workspaceId}/invite`,
                { email: inviteEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setInviteMsg("User invited successfully");

            // 🔔 NOTIFICATION TRIGGER
            addNotification({
                message: `Invite sent to ${inviteEmail}`,
                type: "invite"
            });

            setInviteEmail('');

        } catch (err) {
            setInviteMsg(err?.response?.data?.error || "Invite failed");
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading workspaces...</p>
            </div>
        );
    }

    return (
        <div className="page fade-in">

            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h2>Workspaces</h2>
                    <p className="text-muted">Organize your team projects</p>
                </div>

                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={18}/> New Workspace
                </button>
            </div>

            {/* CREATE FORM */}
            {showForm && (
                <form onSubmit={handleCreate} className="create-form glass fade-in">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Workspace name"
                        required
                    />
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                    />

                    <div className="form-actions">
                        <button type="submit" className="btn-primary">Create</button>
                        <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* GRID */}
            <div className="workspace-grid">
                {workspaces.map(ws => (
                    <div key={ws.id} className="workspace-card glass">

                        {/* CLICK AREA */}
                        <div
                            onClick={() => navigate(`/app/workspaces/${ws.id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="workspace-card-header">
                                <div className="workspace-icon">
                                    <Building2 size={24}/>
                                </div>

                                <button
                                    className="btn-icon-danger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(ws.id);
                                    }}
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>

                            <h3>{ws.name}</h3>
                            <p className="text-muted">{ws.description || 'No description'}</p>

                            <div className="workspace-card-footer">
                                <span className="badge">
                                    <Users size={14}/> {ws.role}
                                </span>
                                <ChevronRight size={18} className="text-muted"/>
                            </div>
                        </div>

                        {/* INVITE BOX */}
                        <div
                            style={{
                                marginTop: "1rem",
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                                paddingTop: "0.8rem"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="email"
                                placeholder="Invite by email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                style={{ padding: "0.45rem", marginRight: "0.5rem", width: "65%" }}
                            />

                            <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: "0.45rem 0.8rem" }}
                                onClick={() => inviteUser(ws.id)}
                            >
                                Invite
                            </button>

                            {inviteMsg && (
                                <p style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
                                    {inviteMsg}
                                </p>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
