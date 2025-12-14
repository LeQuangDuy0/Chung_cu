// src/pages/admin/AdminBlogCreate.jsx
import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '@/assets/style/pages/admin.css'

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

export default function AdminBlogCreate() {
  const navigate = useNavigate()
  const token = localStorage.getItem('access_token')

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')

  // ==== ẢNH BÌA: CHO PHÉP 1–3 ẢNH ====
  const [coverFiles, setCoverFiles] = useState([])        // mảng File
  const [coverPreviews, setCoverPreviews] = useState([])  // mảng URL preview

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fileInputRef = useRef(null)

  const handleFileChange = e => {
    const files = Array.from(e.target.files || []).slice(0, 3) // tối đa 3
    setCoverFiles(files)

    const previews = files.map(file => URL.createObjectURL(file))
    setCoverPreviews(previews)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề bài viết')
      return
    }
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung chính')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      formData.append('content', content)

      if (coverFiles.length > 0) {
        // Ảnh đầu tiên làm cover chính
        formData.append('cover', coverFiles[0])

        // Nếu BE muốn nhận thêm gallery:
        // coverFiles.slice(1).forEach(file => {
        //   formData.append('images[]', file)
        // })
      }

      const res = await fetch(`${API_BASE_URL}/admin/blogs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      })

      const data = await safeJson(res)

      if (!res.ok || data?.status === false) {
        throw new Error(data?.message || 'Không tạo được bài blog')
      }

      setSuccess('Tạo bài blog thành công!')
      setTimeout(() => {
        navigate('/admin/blog-list') // đổi path cho đúng route list blog
      }, 800)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra khi lưu bài viết')
    } finally {
      setLoading(false)
    }
  }

  // Tên file hiển thị bên cạnh nút
  const fileNamesText =
    coverFiles.length === 0
      ? 'Chưa chọn ảnh nào (tối đa 3 ảnh)'
      : coverFiles.map(f => f.name).join(', ')

  return (
    <div className="admin-page-inner">
      <div className="admin-section__head">
        <div>
          <h2>Viết bài blog mới</h2>
          <p>Tạo bài viết chia sẻ kinh nghiệm, hướng dẫn cho người thuê trọ.</p>
        </div>
        <Link to="/admin/blog-list" className="admin-btn admin-btn--ghost">
          ← Quay lại danh sách blog
        </Link>
      </div>

      <div className="admin-card admin-blog-create">
        {error && (
          <p className="admin-error" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        {success && (
          <p className="admin-success" style={{ marginBottom: 12 }}>
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="admin-blog-form">
          {/* Cột trái: thông tin chính */}
          <div className="admin-blog-form__left">
            <label className="admin-field">
              <span>Tiêu đề chính *</span>
              <input
                className="admin-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Kinh nghiệm thực tế khi đi xem trọ lần đầu"
              />
            </label>

            <label className="admin-field">
              <span>Tiêu đề phụ / mô tả ngắn</span>
              <textarea
                className="admin-input"
                rows={3}
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Chuẩn bị những gì trước khi đi xem phòng, nên hỏi chủ nhà câu gì..."
              />
            </label>

            <label className="admin-field">
              <span>Nội dung bài viết *</span>
              <textarea
                className="admin-input"
                rows={10}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Nhập nội dung chi tiết, có thể dùng markdown cơ bản nếu backend hỗ trợ..."
              />
            </label>
          </div>

          {/* Cột phải: ảnh bìa + nút đăng */}
          <div className="admin-blog-form__right">
            <label className="admin-field">
              <span>Ảnh bìa (1–3 ảnh)</span>

              <div className="admin-upload">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Chọn ảnh bìa
                </button>
                <span className="admin-upload__hint">{fileNamesText}</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="admin-upload__input"
                onChange={handleFileChange}
              />

              {coverPreviews.length > 0 && (
                <div className="admin-blog-cover-preview-multi">
                  {coverPreviews.map((src, idx) => (
                    <div key={idx} className="admin-blog-cover-thumb">
                      <img src={src} alt={`Cover preview ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </label>

            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Đăng bài blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
