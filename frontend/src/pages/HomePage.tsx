import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { isLoggedIn, logout } from "../utils/auth";
import "./HomePage.css";

export default function HomePage() {
    const navigate = useNavigate();

    const [loggedIn, setLoggedIn] = useState(isLoggedIn());
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        try {
            const res = await loginApi({
                username,
                password
            });

            if (res.success) {
                localStorage.setItem("accessToken", res.data.token);
                localStorage.setItem("currentUser", JSON.stringify(res.data.user));

                window.dispatchEvent(new Event("auth-changed"));

                setLoggedIn(true);
                setMessage("");
                navigate("/");
            } else {
                setMessage(res.message || "Đăng nhập thất bại.");
            }
        } catch (error: any) {
            setMessage(error.response?.data?.message || "Đăng nhập thất bại.");
        }
    }

    function handleLogout() {
        logout();
        setLoggedIn(false);
    }

    return (
        <div className="home-full">
            <div className="home-overlay">
                <div className="home-title-box">
                    <h1>Support Web</h1>
                    <p>Hệ thống ghi nhận và theo dõi yêu cầu hỗ trợ nội bộ</p>
                </div>

                <div className={`home-panel ${!loggedIn ? "home-login-panel" : ""}`}>
                    <div className="home-panel-body">
                        {loggedIn ? (
                            <>
                                <h2 className="home-panel-title">Menu</h2>

                                <div className="home-menu-actions">
                                    <Link to="/support" className="home-menu-btn home-menu-btn-primary">
                                        <i className="bi bi-headset" />
                                        <span>Gọi hỗ trợ</span>
                                    </Link>

                                    <Link to="/report" className="home-menu-btn home-menu-btn-success">
                                        <i className="bi bi-bar-chart" />
                                        <span>Báo cáo hao phí thời gian hỗ trợ</span>
                                    </Link>

                                    <Link to="/qr" className="home-menu-btn home-menu-btn-warning">
                                        <i className="bi bi-qr-code" />
                                        <span>Tạo QR gọi hỗ trợ</span>
                                    </Link>

                                    <button
                                        type="button"
                                        className="home-menu-btn home-menu-btn-danger-outline"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="home-panel-title">Đăng nhập</h2>

                                {message && (
                                    <div className="home-login-alert">
                                        {message}
                                    </div>
                                )}

                                <form onSubmit={handleLogin} className="home-login-form">
                                    <div className="home-form-group">
                                        <label className="home-form-label">Tài khoản</label>
                                        <input
                                            className="home-form-control"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            placeholder="Nhập username"
                                        />
                                    </div>

                                    <div className="home-form-group">
                                        <label className="home-form-label">Mật khẩu</label>
                                        <input
                                            type="password"
                                            className="home-form-control"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="Nhập mật khẩu"
                                        />
                                    </div>

                                    <button type="submit" className="home-login-btn">
                                        Đăng nhập
                                    </button>
                                </form>

                                <div className="home-support-link-wrap">
                                    <Link to="/support" className="home-support-link">
                                        Tôi cần gọi hỗ trợ
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}