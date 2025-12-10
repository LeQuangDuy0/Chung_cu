import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import '@/assets/style/pages/admin.css'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function safeJson(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ====================== FIX AVATAR ======================
function getAvatarUrl(user) {
  if (!user) return ''

  return (
    user.avatar_url ||
    user.avatar ||
    user.profile?.avatar_url ||
    user.profile?.avatar ||
    user.cloudinary_url ||
    ''
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()

  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const navClass = ({ isActive }) =>
    `admin-menu__link ${isActive ? 'is-active' : ''}`

  // ================= CHECK ADMIN =================
  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return navigate('/login?from=admin')

        const res = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await safeJson(res)

        if (!res.ok) {
          localStorage.removeItem('access_token')
          return navigate('/login?from=admin')
        }

        const user = data?.data || data
        if (!user || user.role !== 'admin') {
          return navigate('/login?from=admin')
        }

        setMe(user)
      } catch {
        navigate('/login?from=admin')
      } finally {
        setChecking(false)
      }
    })()
  }, [])

  const avatarUrl = getAvatarUrl(me)
  const avatarText =
    !avatarUrl && me?.name ? me.name.charAt(0).toUpperCase() : 'A'

  // ================= LOADING =================
  if (checking) {
    return (
      <div className="admin-shell">
        <div className="admin-checking">Đang kiểm tra quyền quản trị…</div>
      </div>
    )
  }

  return (
    <div className="admin-shell">

      {/* ====================== MOBILE TOPBAR ====================== */}
      <div className="admin-mobile-topbar">
        <div className="admin-mobile-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            <div className="admin-mobile-avatar-fallback">{avatarText}</div>
          )}
        </div>

        <button
          className="admin-mobile-menu-btn"
          onClick={() => setMenuOpen(true)}
        >
          <svg width="26" height="26" stroke="#fff" strokeWidth="2">
            <path d="M3 6h20M3 13h20M3 20h20" />
          </svg>
        </button>
      </div>

      {/* ====================== MOBILE SLIDE MENU ====================== */}
      <div className={`admin-mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        <div
          className="admin-mobile-menu-close"
          onClick={() => setMenuOpen(false)}
        >
          ×
        </div>

        <div className="admin-mobile-userbox">
          {avatarUrl ? (
            <img className="avatar-big" src={avatarUrl} />
          ) : (
            <div className="avatar-big fallback">{avatarText}</div>
          )}

          <p className="name">{me?.name}</p>
          <p className="email">{me?.email}</p>
        </div>

        <NavLink end to="/admin" className="admin-menu__link">Dashboard</NavLink>
        <NavLink to="/admin/posts" className="admin-menu__link">Bài đăng</NavLink>
        <NavLink to="/admin/users" className="admin-menu__link">Người dùng</NavLink>
        <NavLink to="/admin/categories" className="admin-menu__link">Danh mục</NavLink>
        <NavLink to="/admin/amenities" className="admin-menu__link">Tiện ích</NavLink>
        <NavLink to="/admin/reviews" className="admin-menu__link">Đánh giá</NavLink>
        <NavLink to="/admin/blog-list" className="admin-menu__link">Blog</NavLink>

        <a href="/" className="admin-menu__link">Trang chủ</a>
      </div>

      {/* ====================== MOBILE TABBAR ====================== */}
      <div className="admin-tabbar">

        {/* HOME ICON */}
        <NavLink 
          end 
          to="/admin"
          className={({ isActive }) => 'admin-tabbar-item' + (isActive ? ' active' : '')}
        >
          <svg width="24" height="24" stroke="#fff" strokeWidth="2" fill="none">
            <path d="M3 12L12 4l9 8v8H4v-8z" />
          </svg>
        </NavLink>

        {/* POSTS ICON */}
        <NavLink 
          to="/admin/posts"
          className={({ isActive }) => 'admin-tabbar-item' + (isActive ? ' active' : '')}
        >
          <svg width="24" height="24" stroke="#fff" strokeWidth="2" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <line x1="4" y1="10" x2="20" y2="10" />
            <line x1="10" y1="4" x2="10" y2="20" />
          </svg>
        </NavLink>

        {/* USERS ICON */}
        <NavLink 
          to="/admin/users"
          className={({ isActive }) => 'admin-tabbar-item' + (isActive ? ' active' : '')}
        >
          <svg width="24" height="24" stroke="#fff" strokeWidth="2" fill="none">
            <circle cx="9" cy="8" r="4" />
            <circle cx="17" cy="9" r="3" />
            <path d="M5 20a4 4 0 0 1 8 0" />
            <path d="M14 20a3 3 0 0 1 6 0" />
          </svg>
        </NavLink>

        {/* CATEGORY ICON */}
        <NavLink 
          to="/admin/categories"
          className={({ isActive }) => 'admin-tabbar-item' + (isActive ? ' active' : '')}
        >
          <svg width="24" height="24" stroke="#fff" strokeWidth="2" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" />
            <rect x="13" y="3" width="8" height="8" rx="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" />
            <rect x="13" y="13" width="8" height="8" rx="2" />
          </svg>
        </NavLink>

      </div>

      {/* ====================== SIDEBAR DESKTOP ====================== */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-logo-circle">
            {avatarUrl ? <img src={avatarUrl} /> : avatarText}
          </div>
          <div>
            <h1>Admin panel</h1>
            <p>Apartments & Condominiums</p>
          </div>
        </div>

        <div className="admin-sidebar__group">
          <p className="admin-menu__title">Chung cư / Phòng trọ</p>

          <NavLink end to="/admin" className={navClass}>Tổng quan</NavLink>
          <NavLink to="/admin/posts" className={navClass}>Bài đăng</NavLink>
          <NavLink to="/admin/users" className={navClass}>Người dùng</NavLink>
          <NavLink to="/admin/reviews" className={navClass}>Đánh giá</NavLink>
          <NavLink to="/admin/blog-list" className={navClass}>Blog</NavLink>
        </div>

        <div className="admin-sidebar__group">
          <p className="admin-menu__title">Danh mục hệ thống</p>

          <NavLink to="/admin/categories" className={navClass}>Danh mục</NavLink>
          <NavLink to="/admin/amenities" className={navClass}>Tiện ích</NavLink>
          <NavLink to="/admin/environment-features" className={navClass}>Môi trường</NavLink>
          <NavLink to="/admin/locations" className={navClass}>Địa lý</NavLink>
          <NavLink to="/admin/saved-posts" className={navClass}>Bài đã lưu</NavLink>
        </div>

        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-menu__back">← Về trang người dùng</Link>
        </div>
      </aside>

      {/* ====================== MAIN CONTENT ====================== */}
      <section className="admin-main">
        <Outlet />
      </section>

    </div>
  )
}
