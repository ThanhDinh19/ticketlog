import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNewRequestCount } from "../api/supportApi";


export default function Topbar({
    onToggleSidebar,
}: {
    onToggleSidebar: () => void;
}) {
    const [totalNew, setTotalNew] = useState(0);

    async function loadNewCount() {
        try {
            const res = await getNewRequestCount();
            setTotalNew(Number(res.data?.totalNew || 0));
        } catch (error) {
            console.log("Không lấy được số ticket mới:", error);
        }
    }

    useEffect(() => {
        loadNewCount();

        // Cập nhật mỗi 3 giây
        const timer = setInterval(loadNewCount, 3000);

        // Cập nhật ngay khi form gọi hỗ trợ gửi thành công trong cùng frontend
        window.addEventListener("support-ticket-created", loadNewCount);

        return () => {
            clearInterval(timer);
            window.removeEventListener("support-ticket-created", loadNewCount);
        };
    }, []);

    return (
        <header className="topbar">
            <button className="menu-toggle" type="button" onClick={onToggleSidebar}>
                <i className="bi bi-list" />
            </button>

            <h1 className="topbar-title">Support Web</h1>

            <div className="ms-auto">
                <Link to="/report" className="notification-bell">
                    <i className="bi bi-bell" />

                    {totalNew > 0 && (
                        <span className="notification-badge">
                            {totalNew > 99 ? "99+" : totalNew}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}