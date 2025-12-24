import { useEffect, useState } from "react"
import { API_URL } from '../config/api.js';

export default function UserSettingsModal({ user, onClose, onUpdated }) {

  const [stage, setStage] = useState("main")

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  })

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)

  // FORM NÂNG CẤP LESSOR (ép người dùng tự điền)
  const [lessorForm, setLessorForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
  })

  const [cccdFront, setCccdFront] = useState(null)
  const [cccdBack, setCccdBack] = useState(null)

  const today = new Date()
const year = today.getFullYear() - 18
const month = String(today.getMonth() + 1).padStart(2, "0")
const day = String(today.getDate()).padStart(2, "0")

// ngày lớn nhất được phép chọn = hôm nay - 18 tuổi
const maxBirthDate = `${year}-${month}-${day}`


  const [previewImage, setPreviewImage] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Lessor cooldown (seconds) - không cho gửi yêu cầu tiếp trong 15 phút
  const [lessorCooldown, setLessorCooldown] = useState(0)
  const [lessorBlocked, setLessorBlocked] = useState(false)
  const [lastLessorInfo, setLastLessorInfo] = useState(null)

  // Lock scroll
  useEffect(() => {
    const old = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = old }
  }, [])

  // Countdown for lessor cooldown
  useEffect(() => {
    if (!lessorCooldown || lessorCooldown <= 0) return
    const iv = setInterval(() => {
      setLessorCooldown(s => {
        if (s <= 1) {
          setLessorBlocked(false)
          clearInterval(iv)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [lessorCooldown])

  // Change basic input
  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Change Avatar
  const handleAvatarChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setStage("avatar")
  }

  // Format thời gian mm:ss
  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m} phút ${sec.toString().padStart(2, '0')} giây`
  }

  // Mở form yêu cầu Lessor - kiểm tra cooldown từ server
  const handleOpenLessor = async () => {
    setError("")
    setSuccess("")

    const token = localStorage.getItem("access_token")
    if (!token) {
      setStage("lessor")
      setLessorBlocked(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/user/lessor-request-status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => null)

      // Nếu không có yêu cầu trước -> hiển thị form
      if (!res.ok || !data?.data) {
        setLastLessorInfo(null)
        setLessorBlocked(false)
        setStage("lessor")
        return
      }

      setLastLessorInfo(data.data)
      const created = new Date(data.data.created_at).getTime()
      const diffSec = Math.floor((Date.now() - created) / 1000)
      const wait = 15 * 60
      if (diffSec < wait) {
        setLessorCooldown(wait - diffSec)
        setLessorBlocked(true)
        setStage("lessor")
      } else {
        setLessorBlocked(false)
        setStage("lessor")
      }

    } catch (err) {
      console.error('check lessor status failed', err)
      setLessorBlocked(false)
      setStage("lessor")
    } finally {
      setLoading(false)
    }
  }

  // ===============================
  // GỬI YÊU CẦU NÂNG CẤP LESSOR
  // ===============================
  const handleRequestLessor = async () => {
    setError("")
    setSuccess("")

    const token = localStorage.getItem("access_token")
    if (!token) return setError("Bạn chưa đăng nhập.")

    // Basic client-side validation (mirror backend rules)
    if (!lessorForm.full_name || !lessorForm.email || !lessorForm.phone_number || !lessorForm.date_of_birth) {
      return setError("Vui lòng nhập đầy đủ thông tin.")
    }

    // phone format: 0XXXXXXXXX
    if (!/^0[0-9]{9}$/.test(lessorForm.phone_number)) {
      return setError('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0.')
    }

    if (!cccdFront || !cccdBack) {
      return setError("Vui lòng tải lên đầy đủ ảnh CCCD mặt trước và mặt sau.")
    }

    // file size/type checks (limit 4MB)
    const maxBytes = 4 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(cccdFront.type) || !allowedTypes.includes(cccdBack.type)) {
      return setError('Ảnh CCCD phải là JPG/PNG.')
    }
    if (cccdFront.size > maxBytes || cccdBack.size > maxBytes) {
      return setError('Ảnh CCCD không được lớn hơn 4MB.')
    }

    try {
      setLoading(true)

      const fd = new FormData()
      fd.append("full_name", lessorForm.full_name)
      fd.append("email", lessorForm.email)
      fd.append("phone_number", lessorForm.phone_number)
      fd.append("date_of_birth", lessorForm.date_of_birth)
      fd.append("cccd_front", cccdFront)
      fd.append("cccd_back", cccdBack)

      const res = await fetch(`${API_URL}/user/request-lessor`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })

      // read raw text and try parse JSON for better debugging
      let data = null
      let rawText = null
      try {
        rawText = await res.text()
        data = rawText ? JSON.parse(rawText) : null
      } catch (e) {
        data = null
      }

      if (!res.ok || data?.status === false) {
        // handle auth issues
        if (res.status === 401 || res.status === 419) {
          throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
        }

        // show validation errors if present
        if (data && data.errors) {
          const first = Object.values(data.errors).flat()[0]
          throw new Error(first || data.message || 'Không thể gửi yêu cầu.')
        }

        // If server returns rate limit info (retry_after), respect it and show blocked message
        if (res.status === 429 && data?.data?.retry_after) {
          setLessorCooldown(Number(data.data.retry_after) || 15 * 60)
          setLessorBlocked(true)
          setError(data.message || 'Bạn cần chờ trước khi gửi lại.')
          return
        }

        // fallback: include raw response text or status for debugging
        const fallback = data?.message || rawText || `Lỗi server (status ${res.status})`
        console.error('Lessor request failed', { status: res.status, rawText, data })

        // Nếu server thực tế đã tạo yêu cầu (ví dụ khi backend trả lỗi sau commit), thử kiểm tra trạng thái yêu cầu
        try {
          const statusRes = await fetch(`${API_URL}/user/lessor-request-status`, { headers: { Authorization: `Bearer ${token}` } })
          const statusJson = await statusRes.json().catch(() => null)
          if (statusRes.ok && statusJson?.data) {
            setSuccess('Gửi yêu cầu thành công (server trả lỗi nhưng yêu cầu đã được tạo).')
            onClose()
            setTimeout(() => window.location.reload(), 700)
            return
          }
        } catch (e) {
          // ignore
        }

        throw new Error(fallback)
      }

      // SUCCESS: đặt cooldown 15 phút
      setSuccess("Gửi yêu cầu thành công! Vui lòng chờ admin duyệt.")
      setLessorCooldown(15 * 60)
      setLessorBlocked(true)

      // close modal and refresh so status updates
      onClose();
      setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      setError(err.message || 'Có lỗi khi gửi yêu cầu.')
    } finally {
      setLoading(false)
    }
  }

  // ===============================
  // SUBMIT ĐỔI PROFILE / PASSWORD
  // ===============================
  const handleSubmit = async e => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const token = localStorage.getItem("access_token")
    if (!token) return setError("Bạn chưa đăng nhập.")

    const basicInfoChanged =
      form.name !== user.name ||
      form.email !== user.email ||
      form.phone_number !== user.phone_number ||
      avatarFile !== null

    const wantChangePassword =
      form.new_password || form.new_password_confirmation

    if ((basicInfoChanged || wantChangePassword) && !form.current_password) {
      return setError("Vui lòng nhập mật khẩu hiện tại để xác nhận.")
    }

    if (wantChangePassword) {
      if (form.new_password.length < 6) {
        return setError("Mật khẩu mới phải có ít nhất 6 ký tự.")
      }
      if (form.new_password !== form.new_password_confirmation) {
        return setError("Mật khẩu xác nhận không khớp.")
      }
    }

    try {
      setLoading(true)
      let updatedUser = user

      const authHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      }

      const jsonHeaders = {
        ...authHeaders,
        "Content-Type": "application/json",
      }

      // UPDATE PROFILE
      if (basicInfoChanged) {
        const res = await fetch(`${API_URL}/user/profile`, {
          method: "PUT",
          headers: jsonHeaders,
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone_number: form.phone_number,
            current_password: form.current_password,
          })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        updatedUser = { ...updatedUser, ...(data.data || {}) }
      }

      // UPDATE AVATAR
      if (avatarFile) {
        const fd = new FormData()
        fd.append("avatar", avatarFile)
        fd.append("current_password", form.current_password)

        const res = await fetch(`${API_URL}/user/profile/avatar`, {
          method: "POST",
          headers: authHeaders,
          body: fd
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        updatedUser.avatar_url = data.avatar_url
      }

      // CHANGE PASSWORD
      if (wantChangePassword) {
        const res = await fetch(`${API_URL}/user/change-password`, {
          method: "PUT",
          headers: jsonHeaders,
          body: JSON.stringify({
            current_password: form.current_password,
            new_password: form.new_password,
            new_password_confirmation: form.new_password_confirmation,
          })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
      }

      setSuccess("Cập nhật thành công!")
      onUpdated(updatedUser)
      setTimeout(() => onClose(), 700)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================
  // RENDER FORM LESSOR
  // ============================
  const renderLessorForm = () => {
    if (lessorCooldown > 0 || lessorBlocked) {
      return (
        <div className="settings-form">
          <h2 className="settings-title">Đã gửi yêu cầu</h2>
          <p>Bạn đã gửi yêu cầu gần đây. Bạn có thể gửi lại sau <strong>{formatTime(lessorCooldown)}</strong>.</p>
          <p style={{fontSize:13,color:'#ccc'}}>Thông tin lần gửi cuối: {lastLessorInfo ? (lastLessorInfo.created_at ? new Date(lastLessorInfo.created_at).toLocaleString('vi-VN') : '') : 'N/A'}</p>
          <div className="settings-actions" style={{marginTop:20}}>
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setStage("main")}>Đóng</button>
          </div>
        </div>
      )
    }

    return (
      <form className="settings-form" onSubmit={(e) => { 
        e.preventDefault(); 
        handleRequestLessor(); 
      }}>
        
        <h2 className="settings-title">Yêu cầu quyền đăng bài</h2>

        {/* Họ tên */}
        <label>Họ và tên *</label>
        <input
          value={lessorForm.full_name}
          onChange={e => setLessorForm({ ...lessorForm, full_name: e.target.value })}
          placeholder="Nhập họ và tên"
        />

        {/* Email */}
        <label>Email *</label>
        <input
          value={lessorForm.email}
          onChange={e => setLessorForm({ ...lessorForm, email: e.target.value })}
          placeholder="Nhập email"
        />

        {/* 2 cột: SĐT + Ngày sinh */}
        <div className="two-col">
          <div>
            <label>Số điện thoại *</label>
            <input
              value={lessorForm.phone_number}
              onChange={e => setLessorForm({ ...lessorForm, phone_number: e.target.value })}
              placeholder="VD: 0987654321"
            />
          </div>

          <div>
            <label>Ngày sinh *</label>
          <input
      type="date"
      value={lessorForm.date_of_birth}
      max={maxBirthDate}   // không được lớn hơn ngày hiện tại - 18 tuổi
      min="1900-01-01"
      onChange={e => setLessorForm({ ...lessorForm, date_of_birth: e.target.value })}
    />

          </div>
        </div>

        {/* Ảnh CCCD */}
        <label>Ảnh CCCD *</label>

        <div className="cccd-box-row">

          {/* Mặt trước */}
          <div className="cccd-box">
            {cccdFront ? (
              <img 
                src={URL.createObjectURL(cccdFront)}
                className="cccd-img"
                onClick={() => setPreviewImage(URL.createObjectURL(cccdFront))}
              />
            ) : (
              <div className="cccd-placeholder">Mặt trước</div>
            )}

            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files[0];
                setCccdFront(f);
              }}
            />
          </div>

          {/* Mặt sau */}
          <div className="cccd-box">
            {cccdBack ? (
              <img 
                src={URL.createObjectURL(cccdBack)}
                className="cccd-img"
                onClick={() => setPreviewImage(URL.createObjectURL(cccdBack))}
              />
            ) : (
              <div className="cccd-placeholder">Mặt sau</div>
            )}

            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files[0];
                setCccdBack(f);
              }}
            />      </div>

    </div>

    {error && <p className="settings-error">{error}</p>}
    {success && <p className="settings-success">{success}</p>}

    <div className="settings-actions">
      <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setStage("main")}>
        Hủy
      </button>
      <button type="submit" className="settings-btn settings-btn--primary" disabled={loading || lessorBlocked}>
        {loading ? "Đang gửi..." : "Gửi yêu cầu"}
      </button>
    </div>

    {/* FULLSCREEN PREVIEW */}
    {previewImage && (
      <div className="preview-overlay" onClick={() => setPreviewImage(null)}>
        <img src={previewImage} className="preview-full" />
      </div>
    )}
  </form>
  )
  }

  // ============================
  // OTHER FORMS (INFO / PASS / AVATAR)
  // ============================
  const renderMain = () => (
    <>
      <h2 className="settings-title">Cài đặt tài khoản</h2>

      <div className="settings-main-grid">
        <button className="settings-main-btn" onClick={() => setStage("info")}>✏ Đổi thông tin cá nhân</button>
        <button className="settings-main-btn" onClick={() => setStage("password")}>🔒 Đổi mật khẩu</button>
        <button className="settings-main-btn" onClick={() => setStage("avatar")}>🖼 Đổi ảnh đại diện</button>
        {user.role === "user" && (
          <button className="settings-main-btn" onClick={handleOpenLessor}>
            ⭐ Yêu cầu nâng cấp lên Lessor
            {lessorCooldown>0 && <div style={{fontSize:12, marginTop:6, color:'#cbd5e1'}}>Chờ {formatTime(lessorCooldown)}</div>}
          </button>
        )}
      </div>

      <button className="settings-btn settings-btn--ghost mt-20" onClick={onClose}>Đóng</button>
    </>
  )

  const renderInfoForm = () => (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h2 className="settings-title">Đổi thông tin cá nhân</h2>

      <label>Họ và tên</label>
      <input name="name" value={form.name} onChange={handleChange} />

      <label>Email</label>
      <input name="email" value={form.email} onChange={handleChange} />

      <label>Số điện thoại</label>
      <input name="phone_number" value={form.phone_number} onChange={handleChange} />

      <label>Mật khẩu hiện tại *</label>
      <input type="password" name="current_password" value={form.current_password} onChange={handleChange} />

      {error && <p className="settings-error">{error}</p>}
      {success && <p className="settings-success">{success}</p>}

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setStage("main")}>Hủy</button>
        <button type="submit" className="settings-btn settings-btn--primary">
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  )

  const renderPasswordForm = () => (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h2 className="settings-title">Đổi mật khẩu</h2>

      <label>Mật khẩu hiện tại *</label>
      <input type="password" name="current_password" value={form.current_password} onChange={handleChange} />

      <label>Mật khẩu mới</label>
      <input type="password" name="new_password" value={form.new_password} onChange={handleChange} />

      <label>Nhập lại mật khẩu mới</label>
      <input type="password" name="new_password_confirmation" value={form.new_password_confirmation} onChange={handleChange} />

      {error && <p className="settings-error">{error}</p>}
      {success && <p className="settings-success">{success}</p>}

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setStage("main")}>Hủy</button>
        <button type="submit" className="settings-btn settings-btn--primary">
          {loading ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  )

  const renderAvatarForm = () => (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h2 className="settings-title">Đổi ảnh đại diện</h2>

      <div className="avatar-preview-large">
        {avatarPreview ? <img src={avatarPreview} /> : "Chưa có avatar"}
      </div>

      <input type="file" accept="image/*" onChange={handleAvatarChange} />

      <label>Mật khẩu hiện tại *</label>
      <input type="password" name="current_password" value={form.current_password} onChange={handleChange} />

      {error && <p className="settings-error">{error}</p>}
      {success && <p className="settings-success">{success}</p>}

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setStage("main")}>Hủy</button>
        <button type="submit" className="settings-btn settings-btn--primary">
          {loading ? "Đang lưu..." : "Cập nhật avatar"}
        </button>
      </div>
    </form>
  )


  // ============================
  // RETURN UI
  // ============================
 return (
  <div className="settings-overlay">
    <div className="settings-overlay__inner">

      <section className="settings-card">

        <button className="settings-close" onClick={onClose}>×</button>

        {stage === "main" && renderMain()}
        {stage === "info" && renderInfoForm()}
        {stage === "password" && renderPasswordForm()}
        {stage === "avatar" && renderAvatarForm()}
        {stage === "lessor" && renderLessorForm()}

      </section>

    </div>
  </div>
)

}
