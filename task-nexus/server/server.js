const cors = require('cors');
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super-secret-key-123';

const fluxNexusHandler = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

fluxNexusHandler.connect((err) => {
    if (err) {
        console.error('Error connecting to taskNexus:', err);
        return;
    }
    console.log('Successfully connected to taskNexus stability layer.');
});


// ================= AUTH =================

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;

    fluxNexusHandler.query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, password],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            fluxNexusHandler.query(
                "INSERT INTO workspaces (name, description, owner_id) VALUES (?, 'Default workspace', ?)",
                [`${username} Workspace`, results.insertId],
                (err2, wsResults) => {

                    if (wsResults) {
                        fluxNexusHandler.query(
                            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
                            [wsResults.insertId, results.insertId]
                        );

                        fluxNexusHandler.query(
                            "INSERT INTO projects (name, description, workspace_id) VALUES ('My First Project','Default project',?)",
                            [wsResults.insertId]
                        );
                    }

                    const token = jwt.sign(
                        { id: results.insertId, username, email },
                        JWT_SECRET
                    );

                    res.json({ token, user: { id: results.insertId, username, email } });
                }
            );
        }
    );
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    fluxNexusHandler.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(401).json({ error: 'No account found with this email' });

            const user = results[0];
            if (user.password_hash !== password)
                return res.status(401).json({ error: 'Wrong password' });

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                JWT_SECRET
            );

            res.json({
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        }
    );
});

app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);

        fluxNexusHandler.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [decoded.id],
            (err, results) => res.json(results[0])
        );

    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});


// ================= WORKSPACES =================

app.get('/api/workspaces', (req, res) => {
    let userId = 1;
    try {
        const decoded = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET);
        userId = decoded.id;
    } catch {}

    fluxNexusHandler.query(
        `SELECT w.*, wm.role
         FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ?
         ORDER BY w.created_at DESC`,
        [userId],
        (err, results) => res.json(results)
    );
});

app.post('/api/workspaces', (req, res) => {
    const { name, description } = req.body;

    let userId = 1;
    try {
        userId = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET).id;
    } catch {}

    fluxNexusHandler.query(
        "INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)",
        [name, description, userId],
        (err, results) => {

            fluxNexusHandler.query(
                "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
                [results.insertId, userId]
            );

            res.json({ id: results.insertId, name, description, owner_id: userId, role: 'owner' });
        }
    );
});


// ================= INVITE + NOTIFICATION =================

app.post('/api/workspaces/:id/invite', (req, res) => {
    const workspaceId = req.params.id;
    const { email } = req.body;

    fluxNexusHandler.query(
        'SELECT id FROM users WHERE email = ?',
        [email],
        (err, users) => {
            if (!users || users.length === 0)
                return res.status(404).json({ error: 'User not found' });

            const userId = users[0].id;

            fluxNexusHandler.query(
                'SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
                [workspaceId, userId],
                (err2, existing) => {

                    if (existing.length > 0)
                        return res.status(400).json({ error: 'User already in workspace' });

                    fluxNexusHandler.query(
                        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, "member")',
                        [workspaceId, userId],
                        () => {

                            // 🔔 CREATE NOTIFICATION
                            fluxNexusHandler.query(
                                "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'invite')",
                                [userId, `You were added to a workspace`]
                            );

                            res.json({ success: true });
                        }
                    );
                }
            );
        }
    );
});


// ================= NOTIFICATIONS =================

app.get('/api/notifications', (req, res) => {
    try {
        const userId = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET).id;

        fluxNexusHandler.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
            [userId],
            (err, results) => res.json(results)
        );

    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
});

app.put('/api/notifications/:id/read', (req, res) => {
    fluxNexusHandler.query(
        "UPDATE notifications SET is_read = 1 WHERE id = ?",
        [req.params.id],
        () => res.json({ success: true })
    );
});


// ================= ANALYTICS (unchanged) =================

app.get('/api/analytics/dashboard', (req, res) => {
    let userId = 1;
    try {
        userId = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET).id;
    } catch {}

    fluxNexusHandler.query(
        'SELECT w.id FROM workspaces w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = ?',
        [userId],
        (err, workspaces) => {

            if (!workspaces || workspaces.length === 0)
                return res.json({ totalTasks:0, completedTasks:0, inProgressTasks:0, overdueTasks:0, totalProjects:0, totalWorkspaces:0, recentActivity:[], tasksByStatus:[], tasksByPriority:[] });

            const wsIds = workspaces.map(w => w.id);
            const placeholders = wsIds.map(() => '?').join(',');

            fluxNexusHandler.query(
                `SELECT COUNT(*) as totalTasks,
                 SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as completedTasks,
                 SUM(CASE WHEN t.status='in_progress' THEN 1 ELSE 0 END) as inProgressTasks,
                 SUM(CASE WHEN t.due_date < NOW() AND t.status!='done' THEN 1 ELSE 0 END) as overdueTasks
                 FROM tasks t JOIN projects p ON t.project_id=p.id WHERE p.workspace_id IN (${placeholders})`,
                wsIds,
                (err2, stats) => {

                    fluxNexusHandler.query(
                        `SELECT t.status, COUNT(*) as count
                         FROM tasks t JOIN projects p ON t.project_id=p.id
                         WHERE p.workspace_id IN (${placeholders})
                         GROUP BY t.status`,
                        wsIds,
                        (err4, byStatus) => {

                            res.json({
                                totalTasks: stats[0]?.totalTasks || 0,
                                completedTasks: stats[0]?.completedTasks || 0,
                                inProgressTasks: stats[0]?.inProgressTasks || 0,
                                overdueTasks: stats[0]?.overdueTasks || 0,
                                totalProjects: 0,
                                totalWorkspaces: wsIds.length,
                                recentActivity: [],
                                tasksByStatus: byStatus || [],
                                tasksByPriority: []
                            });
                        }
                    );
                }
            );
        }
    );
});


const PORT = process.env.PORT || 5000;
app.get("/api", (req, res) => {
  res.json({ message: "API is working 🚀" });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});


app.listen(PORT, () => {
    console.log(`Nexus stability layer active on port ${PORT}`);

});
