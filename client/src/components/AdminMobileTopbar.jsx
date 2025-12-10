// src/components/admin/AdminMobileTopbar.jsx
export default function AdminMobileTopbar({ user, onMenuOpen }) {
  return (
    <div className="admin-mobile-topbar">
      <div className="admin-mobile-avatar">
        <img src={user?.avatar_url || "/default-avatar.png"} alt="avatar" />
      </div>

      <button className="admin-mobile-menu-btn" onClick={onMenuOpen}>
        <svg width="26" height="26" stroke="#fff" strokeWidth="2">
          <path d="M3 6h20M3 13h20M3 20h20" />
        </svg>
      </button>
    </div>
  )
}
