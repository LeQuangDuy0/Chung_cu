// src/pages/admin/AdminLayout.jsx
import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import '@/assets/style/pages/admin.css'

// CẤU HÌNH API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function safeJson(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    console.warn('Phản hồi không phải JSON:', res.url, text.slice(0, 120))
    return null
  }
}

// Lấy URL avatar từ nhiều kiểu field khác nhau
function getAvatarUrl(user) {
  if (!user) return ''
  if (user.avatar_url) return user.avatar_url
  if (user.avatar) return user.avatar
  if (user.profile?.avatar_url) return user.profile.avatar_url
  return ''
}

export default function AdminLayout() {
  const navigate = useNavigate()

  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(true)

  const navClass = ({ isActive }) =>
    'admin-menu__link' + (isActive ? ' is-active' : '')

  // ==== CHECK ĐĂNG NHẬP + QUYỀN ADMIN ====
  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem('access_token')

        // chưa đăng nhập -> bắt login admin
        if (!token) {
          navigate('/login?from=admin', { replace: true })
          return
        }

        const res = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        const data = await safeJson(res)

        if (!res.ok) {
          // token hết hạn / lỗi -> xoá token & bắt đăng nhập lại
          localStorage.removeItem('access_token')
          navigate('/login?from=admin', { replace: true })
          return
        }

        const user = data?.data || data || {}

        // KHÔNG phải admin -> cấm vào khu admin
        if (user.role !== 'admin') {
          navigate('/login?from=admin', { replace: true })
          return
        }

        setMe(user)
      } catch (err) {
        console.error('Lỗi kiểm tra quyền admin:', err)
        navigate('/login?from=admin', { replace: true })
      } finally {
        setChecking(false)
      }
    })()
  }, [navigate])

  const avatarUrl = getAvatarUrl(me)
  const avatarText =
    !avatarUrl && me?.name ? me.name.trim().charAt(0).toUpperCase() : 'A'

  // Đang check quyền thì tạm thời hiển thị loading (tránh nháy layout)
  if (checking) {
    return (
      <div className="admin-shell admin-shell--checking">
        <div className="admin-checking">
          Đang kiểm tra quyền truy cập khu vực quản trị...
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      {/* ========== SIDEBAR TRÁI ========== */}
      <aside className="admin-sidebar">
        {/* logo + tên khu vực admin */}
        <div className="admin-sidebar__brand">
          <div className="admin-logo-circle">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Admin avatar" />
            ) : (
              avatarText
            )}
          </div>
          <div>
            <h1>Admin panel</h1>
            <p>Apartments &amp; Condominiums</p>
          </div>
        </div>

        {/* nhóm 1: Chung cư / Phòng trọ */}
        <div className="admin-sidebar__group">
          <p className="admin-menu__title">Chung cư / Phòng trọ</p>

          <NavLink end to="/admin" className={navClass}>
            Tổng quan
          </NavLink>

          <NavLink to="/admin/posts" className={navClass}>
            Bài đăng (posts)
          </NavLink>

          <NavLink to="/admin/users" className={navClass}>
            Người dùng (users)
          </NavLink>

          <NavLink to="/admin/reviews" className={navClass}>
            Đánh giá (reviews)
          </NavLink>

          <NavLink to="/admin/blog-list" className={navClass}>
            Blog (quản lý bài viết)
          </NavLink>
        </div>

        {/* nhóm 2: danh mục hệ thống */}
        <div className="admin-sidebar__group">
          <p className="admin-menu__title">Danh mục hệ thống</p>

          <NavLink to="/admin/categories" className={navClass}>
            Danh mục (categories)
          </NavLink>

          <NavLink to="/admin/amenities" className={navClass}>
            Tiện ích (amenities)
          </NavLink>

          <NavLink to="/admin/environment-features" className={navClass}>
            Môi trường xung quanh
          </NavLink>

          <NavLink to="/admin/locations" className={navClass}>
            Địa lý (provinces / districts / wards)
          </NavLink>

          <NavLink to="/admin/saved-posts" className={navClass}>
            Bài đã lưu (saved_posts)
          </NavLink>
        </div>

        {/* dưới cùng: back + info nhỏ */}
        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-menu__back">
            ← Về trang người dùng
          </Link>
          <p className="admin-sidebar__meta">© 2025 · Admin · A&amp;C</p>
        </div>
      </aside>

      {/* ========== MAIN PHẢI ========== */}
      <section className="admin-main">
        {/* topbar: tiêu đề + info admin */}
        <header className="admin-main__topbar">
          <div>
            <h2>Khu vực quản trị</h2>
            <p>Quản lý chung cư, phòng trọ và các danh mục hệ thống.</p>
          </div>

           
        </header>

        {/* TẤT CẢ CÁC TRANG CON (Dashboard, Posts, Blog, v.v.) */}
        <Outlet />
      </section>
    </div>
  )
}
