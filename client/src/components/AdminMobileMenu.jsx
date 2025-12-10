// src/components/admin/AdminMobileMenu.jsx
import { Link } from "react-router-dom"

export default function AdminMobileMenu({ user, isOpen, onClose }) {
  return (
    <div className={`admin-mobile-menu ${isOpen ? "is-open" : ""}`}>
      <div className="admin-mobile-menu-close" onClick={onClose}>×</div>

      <div className="admin-mobile-userbox">
        <img className="avatar-big" src={user?.avatar_url || "/default-avatar.png"} />
        <p className="name">{user?.name || "Admin"}</p>
        <p className="email">{user?.email}</p>
      </div>

      <Link className="admin-menu__link" to="/admin">Dashboard</Link>
      <Link className="admin-menu__link" to="/admin/posts">Bài đăng</Link>
      <Link className="admin-menu__link" to="/admin/users">Người dùng</Link>
      <Link className="admin-menu__link" to="/admin/amenities">Tiện ích</Link>
      <Link className="admin-menu__link" to="/admin/lessor">Yêu cầu Lessor</Link>

      <a className="admin-menu__link" href="/">Trang chủ</a>
    </div>
  )
}
