import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../modules/context/AuthContext";

function Landing() {
    const { user, loading } = useAuth();

    // Redirect logged-in users
    if (!loading && user) {
        return <Navigate to="/app" replace />;
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "2rem",
            textAlign: "center",
            gap: "2rem"
        }}>

            {/* HERO */}
            <h1 style={{
                fontSize: "3rem",
                fontWeight: "800",
                letterSpacing: "-0.02em"
            }}>
                Plan. Track. <span style={{ color: "hsl(var(--primary))" }}>Succeed.</span>
            </h1>

            <p style={{
                maxWidth: "520px",
                color: "hsl(var(--text-muted))",
                fontSize: "1.1rem"
            }}>
                TaskNexus helps teams organize projects, manage workflows,
                and stay productive — all in one workspace.
            </p>

            {/* CTA BUTTONS */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link to="/login">
                    <button className="btn-primary">Login</button>
                </Link>

                <Link to="/register">
                    <button className="btn-ghost">Get Started</button>
                </Link>
            </div>

        </div>
    );
}

export default Landing;
