// src/pages/admin/AdminAmenities.jsx
import { useEffect, useState } from 'react'

export default function AdminAmenities() {
  // ===== STATE =====
  const [items, setItems] = useState([])        // danh sách amenities từ API
  const [q, setQ] = useState('')               // từ khoá tìm kiếm (slug/name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)  // hiển thị modal
  const [editingItem, setEditingItem] = useState(null)  // item đang sửa (null = thêm mới)
  const [formData, setFormData] = useState({ name: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // ===== LOAD TIỆN ÍCH TỪ API =====
  useEffect(() => {
    const controller = new AbortController()

    async function fetchAmenities() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (q.trim()) params.append('q', q.trim())

        /**
         * API #1 – Lấy danh sách tiện ích (amenities)
         * Gợi ý backend Laravel:
         *   GET /api/admin/amenities?q={keyword}
         *
         * Trong controller:
         *   Amenity::query()
         *      ->when($q, fn($qr) => $qr->where('name','like',"%$q%")
         *                                ->orWhere('slug','like',"%$q%"))
         *      ->withCount('posts')      // quan hệ qua bảng amenity_post
         *
         * Response gợi ý:
         *   {
         *     "data": [
         *       { "id": 1, "slug": "may-lanh", "name": "Máy lạnh", "posts_count": 230 },
         *       ...
         *     ]
         *   }
         * hoặc trả trực tiếp mảng [] cũng được.
         */
        const token = localStorage.getItem('access_token')
        const res = await fetch(
          `/api/admin/amenities?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        )

        const text = await res.text()
        let json
        try {
          json = JSON.parse(text)
        } catch {
          throw new Error('Response không phải JSON hợp lệ (backend chưa trả JSON).')
        }

        if (!res.ok) {
          throw new Error(json?.message || 'Không tải được danh sách tiện ích')
        }

        const list = json.data || json
        setItems(Array.isArray(list) ? list : [])
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error(err)
        setError(err.message || 'Có lỗi khi tải tiện ích')
      } finally {
        setLoading(false)
      }
    }

    fetchAmenities()
    return () => controller.abort()
  }, [q])

  // ===== MỞ MODAL THÊM/SỬA =====
  const handleOpenModal = (item = null) => {
    setEditingItem(item)
    setFormData({
      name: item?.name || '',
    })
    setFormError('')
    setShowModal(true)
  }

  // ===== ĐÓNG MODAL =====
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({ name: '' })
    setFormError('')
  }

  // ===== XỬ LÝ THAY ĐỔI FORM =====
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // ===== TẠO/SỬA TIỆN ÍCH =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Bạn chưa đăng nhập.')
      }

      const url = editingItem
        ? `/api/amenities/${editingItem.id}`
        : '/api/amenities'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
        }),
      })

      const text = await res.text()
      let json = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        throw new Error('Response không phải JSON hợp lệ.')
      }

      if (!res.ok) {
        throw new Error(json?.message || 'Có lỗi khi lưu tiện ích')
      }

      // Đóng modal và reload danh sách
      handleCloseModal()
      // Trigger reload bằng cách thay đổi q
      setQ((prev) => prev + ' ')
      setTimeout(() => setQ((prev) => prev.trim()), 100)
    } catch (err) {
      console.error(err)
      setFormError(err.message || 'Có lỗi khi lưu tiện ích')
    } finally {
      setFormLoading(false)
    }
  }

  // ===== XOÁ 1 TIỆN ÍCH =====
  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn chắc chắn muốn xoá tiện ích #${id}?`)) return

    try {
      /**
       * API #2 – Xoá tiện ích
       *
       * Gợi ý Laravel:
       *   DELETE /api/admin/amenities/{amenity}
       *
       * - Trước khi xoá nên detach bản ghi trong bảng trung gian amenity_post
       *   $amenity->posts()->detach();
       * - Sau đó $amenity->delete();
       */
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('Bạn chưa đăng nhập.')
        return
      }

      const res = await fetch(`/api/amenities/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const text = await res.text()
      let json = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        // nếu backend trả 204 No Content thì bỏ qua parse
      }

      if (!res.ok) {
        throw new Error(json?.message || 'Không xoá được tiện ích')
      }

      // Cập nhật lại state FE (xoá khỏi danh sách hiện tại)
      setItems((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error(err)
      alert(err.message || 'Có lỗi khi xoá tiện ích')
    }
  }

  return (
    <section className="admin-page">
      {/* PHẦN HEADER TRANG */}
      <header className="admin-page__head">
        <div>
          <h1 className="admin-page__title">Tiện ích phòng</h1>
          <p className="admin-page__desc">
            Quản lý bảng <code>amenities</code> và số bài đang dùng qua{' '}
            <code>amenity_post</code>.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => handleOpenModal()}
        >
          + Thêm tiện ích
        </button>
      </header>

      {/* CARD CHÍNH */}
      <div className="admin-section--card">
        {/* Thanh search */}
        <div className="admin-toolbar">
          <div className="admin-input-wrap admin-input-wrap--search">
            <span className="admin-input__icon">🔍</span>
            <input
              className="admin-input admin-input--search"
              placeholder="Tìm tiện ích (máy lạnh, WC riêng...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Thông báo lỗi / loading */}
        {error && <p className="admin-error">{error}</p>}
        {loading && <p className="admin-loading">Đang tải tiện ích…</p>}

        {/* Bảng dữ liệu */}
        <div className="admin-card-table">
          <table className="admin-table admin-table--compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Slug</th>
                <th>Tên</th>
                <th>Số bài sử dụng</th>
                <th style={{ width: 170 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {/* Không có dữ liệu */}
              {items.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Chưa có tiện ích nào hoặc không tìm thấy kết quả.
                  </td>
                </tr>
              )}

              {/* Data thật từ API */}
              {items.map((amenity) => (
                <tr key={amenity.id}>
                  <td>{amenity.id}</td>
                  <td>{amenity.slug}</td>
                  <td>{amenity.name}</td>
                  <td>{amenity.posts_count ?? 0}</td>
                  <td className="admin-td-actions">
                    <button
                      type="button"
                      className="admin-chip admin-chip--ghost"
                      onClick={() => handleOpenModal(amenity)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="admin-chip admin-chip--danger"
                      onClick={() => handleDelete(amenity.id)}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM/SỬA TIỆN ÍCH */}
      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('admin-modal-overlay')) {
              handleCloseModal()
            }
          }}
        >
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h3>{editingItem ? 'Sửa tiện ích' : 'Thêm tiện ích mới'}</h3>
              <button
                type="button"
                className="admin-modal__close"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal__body">
              {formError && (
                <p className="admin-error" style={{ marginBottom: '1rem' }}>
                  {formError}
                </p>
              )}

              <div className="admin-field">
                <label className="admin-label">
                  Tên tiện ích <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-input"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Máy lạnh, WC riêng, Wifi..."
                  required
                  disabled={formLoading}
                />
                <small style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Slug sẽ được tự động tạo từ tên
                </small>
              </div>

              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={handleCloseModal}
                  disabled={formLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
