// src/components/admin/AdminSidebar.jsx
import { Link, useLocation } from "react-router-dom"

export default function AdminSidebar({ unreadAdmin = 0, notiStage }) {
  const { pathname } = useLocation()

  // 🔥 NOTI chỉ hiển thị ở sidebar khi stage === "sidebar"
  const showBadge = notiStage === "sidebar" && unreadAdmin > 0

  const menu = [
    { title: "Dashboard", to: "/admin", key: "dashboard" },
    { title: "Bài đăng", to: "/admin/posts", key: "posts" },
    { title: "Yêu cầu Lessor", to: "/admin/lessor", key: "lessor" },
    { title: "Người dùng", to: "/admin/users", key: "users" },
    { title: "Tiện ích", to: "/admin/amenities", key: "amenities" },
    { title: "Địa lý", to: "/admin/province", key: "province" },
    { title: "Môi trường", to: "/admin/environment", key: "environment" },
  ]

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-logo-circle">A</div>
        <div>
          <h1>Admin</h1>
          <p>Quản trị hệ thống</p>
        </div>
      </div>

      <div className="admin-sidebar__group">
        <p className="admin-menu__title">Quản lý</p>

        {menu.map((m, i) => (
          <Link
            key={i}
            className={`admin-menu__link ${pathname === m.to ? "is-active" : ""}`}
            to={m.to}
          >
            {m.title}

            {/* 🔥 Badge sidebar chỉ hiển thị khi vào stage sidebar */}
            {(m.key === "dashboard" || m.key === "lessor") && showBadge && (
              <span className="admin-noti-badge">{unreadAdmin}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="admin-sidebar__bottom">
        <a className="admin-menu__back" href="/">← Quay về trang chủ</a>
        <p className="admin-sidebar__meta">© 2025 ChungCu App</p>
      </div>
    </aside>
  )
}
