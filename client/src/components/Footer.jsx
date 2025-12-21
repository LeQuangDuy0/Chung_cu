import { useState, useEffect } from 'react'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Wishlist from '../pages/Wishlist'
// Import file CSS nếu bạn để CSS popup trong file riêng, ví dụ: import '../App.css'

export default function Footer() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const initAuth = () => {
      const raw = localStorage.getItem('auth_user')
      if (!raw) { setUser(null); return }
      try {
        let parsed = JSON.parse(raw)
        if (parsed?.user) parsed = parsed.user
        setUser(parsed)
      } catch {
        setUser(null)
      }
    }

    initAuth()
    window.addEventListener('auth:changed', initAuth)
    return () => window.removeEventListener('auth:changed', initAuth)
  }, [])

  // Hàm đóng tất cả popup
  const closeAll = () => {
    setShowLogin(false)
    setShowRegister(false)
  }

  return (
    <>
      <footer className="site-footer">
        <div className="container footer-main">
          {/* Cột 1 */}
          <div className="footer-col">
            <h4>Về Apartments</h4>
            <a href="/">Giới thiệu</a>
            <a href="/">Báo chí nói về Apartments</a>
            <a href="/">Tuyển dụng</a>
          </div>

          {/* Cột 2: Sửa link Đăng ký/Đăng nhập thành Popup */}
          <div className="footer-col">
            <h4>Tài khoản</h4>
            <a href="wishlist">Phòng yêu thích</a>

            {!user && (
              <>
                {/* ĐĂNG KÝ */}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault() // Chặn load lại trang
                    setShowLogin(false)
                    setShowRegister(true)
                  }}
                >
                  Đăng ký
                </a>

                {/* ĐĂNG NHẬP */}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault() // Chặn load lại trang
                    setShowRegister(false)
                    setShowLogin(true)
                  }}
                >
                  Đăng nhập
                </a>
              </>
            )}

            <a href="/">Ký gửi phòng cho thuê</a>
          </div>

          {/* Cột 3 */}
          <div className="footer-col">
            <h4>Hỗ trợ</h4>
            <p>Số điện thoại: 0888.022.821</p>
            <p>Email: lienhe@apartments.vn</p>
            <a href="/">Sitemap</a>
          </div>

          {/* Cột 4 */}
          <div className="footer-col footer-col--social">
            <h4>Kết nối với chúng tôi</h4>
            <div className="footer-social">
              <button aria-label="Facebook" className="footer-social__icon">f</button>
              <button aria-label="TikTok" className="footer-social__icon">t</button>
              <button aria-label="YouTube" className="footer-social__icon">▶</button>
              <button aria-label="Instagram" className="footer-social__icon">◎</button>
            </div>
          </div>
        </div>

        <div className="footer-offices container">
          <details className="footer-office" open>
            <summary>
              <span className="footer-office__arrow">⌃</span>
              <span>Xem văn phòng tại TP Huế</span>
            </summary>
            <p className="footer-office__title">Văn phòng số 8</p>
            <p>70 nguyễn huệ, thành phố huế</p>
            <p>Điện thoại: 0888.999.888</p>
          </details>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom__inner">
            <p>
              © 2023–2025. Bản quyền thuộc Apartments and Condominiums – Địa chỉ: 
              – Điện thoại: 0888.999.888.
            </p>
          </div>
        </div>
      </footer>

      {/* ================= PHẦN POPUP (MODAL) ================= */}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
        />
      )}

      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
        />
      )}
    </>
  )
}