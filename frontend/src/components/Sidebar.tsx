import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { isLoggedIn } from "../utils/auth";


export default function Sidebar({
    onCloseMobile,
}: {
    onCloseMobile?: () => void;
}) {


    const [loggedIn, setLoggedIn] = useState(isLoggedIn());

    useEffect(() => {
        function handleAuthChanged() {
            setLoggedIn(isLoggedIn());
        }

        window.addEventListener("auth-changed", handleAuthChanged);

        return () => {
            window.removeEventListener("auth-changed", handleAuthChanged);
        };
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand-logo">
                    <div className="brand-sun">
                        <span />
                    </div>
                    <div className="brand-word">
                        VIET<span>S</span>UN
                    </div>
                    <div className="brand-tagline">Warming Your Life</div>
                </div>
            </div>

            <nav className="sidebar-menu">
                <div className="menu-section-title">Menu</div>

                <NavLink
                    to="/"
                    onClick={onCloseMobile}
                    className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                >
                    <i className="bi bi-house-door" />
                    <span>Trang chủ</span>
                </NavLink>

                <NavLink
                    to="/support"
                    onClick={onCloseMobile}
                    className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                >
                    <i className="bi bi-headset" />
                    <span>Gọi hỗ trợ</span>
                </NavLink>

                {loggedIn && (
                    <>
                        <NavLink
                            to="/report"
                            onClick={onCloseMobile}
                            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                        >
                            <i className="bi bi-bar-chart" />
                            <span>Báo cáo</span>
                        </NavLink>

                        <NavLink
                            to="/qr"
                            onClick={onCloseMobile}
                            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                        >
                            <i className="bi bi-qr-code" />
                            <span>QR Form</span>
                        </NavLink>

                        <NavLink
                            to="/workday-configs"
                            onClick={onCloseMobile}
                            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                        >
                            <i className="bi bi-gear" />
                            <span>Cấu hình ngày công</span>
                        </NavLink>

                        <NavLink
                            to="/support-reasons"
                            onClick={onCloseMobile}
                            className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                        >
                            <i className="bi bi-list-check" />
                            <span>Danh mục loại hỗ trợ</span>
                        </NavLink>
                    </>
                )}
            </nav>
        </aside>
    );
}