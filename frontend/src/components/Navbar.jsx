import React from 'react'
import { NavLink } from "react-router-dom";
import "./Navbar.css"
import { useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../auth";

function Navbar() {
    const navigate = useNavigate();
    const user = getUser();

    function handleLogout() {
        clearSession();
        navigate("/login", { replace: true });
    }
    return (
        <nav className="navbar">
            <NavLink to="/" className="brand">
                FraudWatch
            </NavLink>

            <div className="nav-links">
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/transactions">Transactions</NavLink>
                <NavLink to="/predict">Predict</NavLink>
            </div>
            <div className="nav-account">
                <span>{user?.name}</span>
                <button onClick={handleLogout}>Log out</button>
            </div>
        </nav>
    );
}

export default Navbar