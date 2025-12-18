import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../config/api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const tokenFromUrl = searchParams.get('token') || ''
  const emailFromUrl = searchParams.get('email') || ''

  const [form, setForm] = useState({
    email: emailFromUrl,
    token: tokenFromUrl,
    new_password: '',
    new_password_confirmation: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 🔥 Điều khiển login modal
  const [showLogin, setShowLogin] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.email || !form.token) {
      setError('Thiếu email hoặc mã OTP.')
      return
    }

    if (!form.new_password || form.new_password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (form.new_password !== form.new_password_confirmation) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          token: form.token,
          new_password: form.new_password,
          new_password_confirmation: form.new_password_confirmation,
        }),
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Máy chủ trả về dữ liệu không hợp lệ.')
      }

      if (!res.ok || data?.status === false) {
        if (res.status === 422 && data?.errors) {
          const firstError =
            Object.values(data.errors)[0]?.[0] || 'Lỗi xác thực dữ liệu.'
          throw new Error(firstError)
        }
        throw new Error(data?.message || 'Đặt lại mật khẩu thất bại.')
      }

      // ✅ RESET OK
      setSuccess('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.')

      // 🔥 Sau 1s → mở Login modal
      setTimeout(() => {
        setShowLogin(true)
      }, 1000)

    } catch (err) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ================= RESET PASSWORD PAGE ================= */}
      {!showLogin && (
        <div className="auth-page">
          <div className="auth-card">
            <h1 className="auth-title">Đặt lại mật khẩu</h1>
            <p className="auth-subtitle">
              Nhập email, mã OTP và mật khẩu mới của bạn.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field">
                <span>Mã OTP (6 số)</span>
                <input
                  type="text"
                  name="token"
                  value={form.token}
                  maxLength={6}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: 'token',
                        value: e.target.value.replace(/\D/g, ''),
                      },
                    })
                  }
                />
              </label>

              <label className="auth-field">
                <span>Mật khẩu mới</span>
                <input
                  type="password"
                  name="new_password"
                  value={form.new_password}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field">
                <span>Nhập lại mật khẩu mới</span>
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={form.new_password_confirmation}
                  onChange={handleChange}
                />
              </label>

              {error && <p className="auth-error">{error}</p>}
              {success && <p className="auth-success">{success}</p>}

              <button
                type="submit"
                className="auth-btn auth-btn--primary"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>

            <div className="auth-footer">
              <Link to="/">Quay lại trang chủ</Link>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOGIN MODAL ================= */}
      {showLogin && (
        <Login
          forceRedirectHome
          onClose={() => {
            // 🔥 DỨT ĐIỂM: THOÁT RESET PAGE
            setShowLogin(false)
            navigate('/', { replace: true })
          }}
        />
      )}
    </>
  )
}
