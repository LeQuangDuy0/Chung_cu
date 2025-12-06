// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '@/assets/style/pages/admin.css'

// ====== CẤU HÌNH API ======
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// ------ helper: parse JSON an toàn ------
async function safeJson(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    console.warn('Phản hồi không phải JSON:', res.url, text.slice(0, 120))
    return null
  }
}

function normalizeErrorMessage(err) {
  const msg = String(err?.message || err)
  if (msg.includes('Unexpected token') && msg.includes('<')) {
    return 'API trả về HTML (thường là lỗi 404/500) nên không parse được JSON. Kiểm tra lại route /api/admin/posts ở backend.'
  }
  return msg
}

export default function AdminDashboard() {
  // --- SỐ LIỆU TỔNG QUAN (stats) ---
  const [stats, setStats] = useState({
    total_posts: 0,
    total_users: 0,
    total_reviews: 0,
    total_saved: 0,
  })

  // --- DANH SÁCH BÀI ĐĂNG (bảng posts) ---
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])

  const [status, setStatus] = useState('all')
  const [categoryId, setCategoryId] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // --- YÊU CẦU TRỞ THÀNH LESSOR ---
  const [lessorRequests, setLessorRequests] = useState([])
  const [lessorLoading, setLessorLoading] = useState(false)
  const [lessorError, setLessorError] = useState('')

  // token dùng cho route admin (auth:sanctum)
  const token = localStorage.getItem('access_token')

  // ================== LOAD STATS ==================
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        const data = await safeJson(res)

        if (!res.ok) {
          throw new Error(data?.message || 'Không tải được số liệu thống kê')
        }

        setStats(prev => ({
          ...prev,
          ...(data?.data || data || {}),
        }))
      } catch (err) {
        console.error('Lỗi load stats:', err)
      }
    })()
  }, [token])

  // ================== LOAD CATEGORIES ==================
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`)
        const data = await safeJson(res)
        if (!res.ok) return

        setCategories(data?.data || data || [])
      } catch (err) {
        console.error('Lỗi load categories:', err)
      }
    })()
  }, [])

  // ================== LOAD POSTS (bảng posts) ==================
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (status !== 'all') params.set('status', status)
        if (categoryId) params.set('category_id', categoryId)
        if (q.trim()) params.set('q', q.trim())
        params.set('page', String(page))

        const res = await fetch(
          `${API_BASE_URL}/admin/posts?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        )
        const data = await safeJson(res)

        if (!res.ok) {
          throw new Error(data?.message || 'Không tải được danh sách bài đăng')
        }

        const list = data?.data || data || []
        setPosts(Array.isArray(list) ? list : [])

        const meta = data?.meta || data?.pagination || {}
        setLastPage(meta.last_page || 1)
      } catch (err) {
        console.error('Lỗi load posts:', err)
        setError(normalizeErrorMessage(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [status, categoryId, q, page, token])

  // ================== LOAD YÊU CẦU LESSOR ==================
  useEffect(() => {
    ;(async () => {
      try {
        setLessorLoading(true)
        setLessorError('')

        const res = await fetch(`${API_BASE_URL}/admin/lessor/requests`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        const data = await safeJson(res)

        if (!res.ok) {
          throw new Error(
            data?.message || 'Không tải được danh sách yêu cầu lessor',
          )
        }

        setLessorRequests(data?.data || data || [])
      } catch (err) {
        console.error('Lỗi load lessor requests:', err)
        setLessorError(normalizeErrorMessage(err))
      } finally {
        setLessorLoading(false)
      }
    })()
  }, [token])

  // ================== ĐỔI TRẠNG THÁI BÀI ĐĂNG (published <-> hidden) ==================
  const handleToggleStatus = async (postId, currentStatus) => {
    const next = currentStatus === 'published' ? 'hidden' : 'published'
    if (!window.confirm(`Chuyển trạng thái bài #${postId} sang "${next}"?`)) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/posts/${postId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({ status: next }),
        },
      )

      const data = await safeJson(res)

      if (!res.ok) {
        throw new Error(data?.message || 'Không cập nhật được trạng thái')
      }

      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, status: next } : p)),
      )
    } catch (err) {
      console.error('Lỗi đổi trạng thái:', err)
      alert(err.message || 'Có lỗi khi cập nhật trạng thái')
    }
  }

  // ================== DUYỆT BÀI "CHỜ DUYỆT" (pending -> published) ==================
  const handleApprovePost = async postId => {
    if (
      !window.confirm(
        `Duyệt bài #${postId} và chuyển sang trạng thái "published"?`,
      )
    )
      return

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/posts/${postId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({ status: 'published' }),
        },
      )

      const data = await safeJson(res)

      if (!res.ok || data?.status === false) {
        throw new Error(data?.message || 'Không duyệt được bài đăng')
      }

      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, status: 'published' } : p)),
      )
    } catch (err) {
      console.error('Lỗi duyệt bài:', err)
      alert(err.message || 'Có lỗi khi duyệt bài')
    }
  }

  // ================== XOÁ BÀI (cho bài pending hoặc bài khác nếu cần) ==================
  const handleDeletePost = async postId => {
    if (!window.confirm(`Xoá vĩnh viễn bài đăng #${postId}?`)) return

    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      const data = await safeJson(res)

      if (!res.ok || data?.status === false) {
        throw new Error(data?.message || 'Không xoá được bài đăng')
      }

      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      console.error('Lỗi xoá bài:', err)
      alert(err.message || 'Có lỗi khi xoá bài')
    }
  }

  // ================== HÀNH ĐỘNG TRÊN YÊU CẦU LESSOR ==================
  const handleLessorAction = async (id, action) => {
    let url = ''
    let method = 'POST'
    let confirmText = ''

    if (action === 'approve') {
      url = `${API_BASE_URL}/admin/lessor/approve/${id}`
      confirmText = 'Duyệt yêu cầu này và nâng quyền người dùng thành lessor?'
    } else if (action === 'reject') {
      url = `${API_BASE_URL}/admin/lessor/reject/${id}`
      confirmText = 'Từ chối yêu cầu này?'
    } else if (action === 'delete') {
      url = `${API_BASE_URL}/admin/lessor/delete/${id}`
      method = 'DELETE'
      confirmText = 'Xoá hẳn yêu cầu này khỏi hệ thống?'
    }

    if (!window.confirm(confirmText)) return

    try {
      setLessorLoading(true)
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      const data = await safeJson(res)

      if (!res.ok || data?.status === false) {
        throw new Error(data?.message || 'Thao tác không thành công')
      }

      if (action === 'delete') {
        setLessorRequests(prev => prev.filter(r => r.id !== id))
      } else {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        setLessorRequests(prev =>
          prev.map(r => (r.id === id ? { ...r, status: newStatus } : r)),
        )
      }
    } catch (err) {
      console.error('Lỗi duyệt lessor:', err)
      alert(err.message || 'Có lỗi khi xử lý yêu cầu')
    } finally {
      setLessorLoading(false)
    }
  }

  const resetFilters = () => {
    setStatus('all')
    setCategoryId('')
    setQ('')
    setPage(1)
  }

  // ================== RENDER ==================
  return (
    <div className="admin-page">
      {/* HEADER */}
      <header className="admin-header">
        <div>
          <h1>Bảng điều khiển</h1>
          <p>
            Quản lý bài đăng, người dùng, đánh giá và yêu cầu trở thành người
            cho thuê trong hệ thống.
          </p>
        </div>

        <div className="admin-header__actions">
          <Link
            to="/admin/posts/create"
            className="admin-btn admin-btn--primary"
          >
            + Đăng bài mới
          </Link>
        </div>
      </header>

      {/* STATS CARDS */}
      <section className="admin-stats">
        <div className="admin-stat">
          <p className="admin-stat__label">Tổng bài đăng</p>
          <p className="admin-stat__value">{stats.total_posts}</p>
          <p className="admin-stat__hint">Bảng posts</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Người dùng</p>
          <p className="admin-stat__value">{stats.total_users}</p>
          <p className="admin-stat__hint">Bảng users</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Đánh giá</p>
          <p className="admin-stat__value">{stats.total_reviews}</p>
          <p className="admin-stat__hint">Bảng reviews</p>
        </div>
    
        <div className="admin-stat">
          <p className="admin-stat__label">Bài đã lưu</p>
          <p className="admin-stat__value">{stats.total_saved}</p>
          <p className="admin-stat__hint">Bảng saved_posts</p>
        </div>
      </section>

      {/* DANH SÁCH BÀI ĐĂNG */}
      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Danh sách bài đăng</h2>
            <p>
              Quản lý bài đăng phòng trọ / nhà nguyên căn / căn hộ trong bảng{' '}
              <code>posts</code>.
            </p>
          </div>

          <div className="admin-filters">
            <input
              className="admin-input"
              placeholder="Tìm theo tiêu đề, địa chỉ, ID…"
              value={q}
              onChange={e => {
                setQ(e.target.value)
                setPage(1)
              }}
            />
            <select
              className="admin-input"
              value={categoryId}
              onChange={e => {
                setCategoryId(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Tất cả loại phòng</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="admin-input"
              value={status}
              onChange={e => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="published">Đang hiển thị</option>
              <option value="hidden">Đã ẩn</option>
            </select>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={resetFilters}
            >
              Xoá lọc
            </button>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {loading && !error && (
          <p className="admin-loading">Đang tải danh sách bài đăng…</p>
        )}

        {!loading && !error && (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tiêu đề</th>
                    <th>Giá / Diện tích</th>
                    <th>Địa chỉ</th>
                    <th>Loại</th>
                    <th>Chủ phòng</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan="9" className="admin-empty">
                        Không có bài đăng nào phù hợp.
                      </td>
                    </tr>
                  )}

                  {posts.map(post => (
                    <tr key={post.id}>
                      <td>#{post.id}</td>
                      <td className="admin-td-title">
                        <Link
                          to={`/post/${post.id}`}
                          className="admin-link"
                          target="_blank"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td>
                        <div>
                          {post.price?.toLocaleString?.('vi-VN') ?? post.price}{' '}
                          ₫
                        </div>
                        <div className="admin-td-sub">{post.area} m²</div>
                      </td>
                      <td>
                        <div>{post.address}</div>
                        <div className="admin-td-sub">
                          {post.ward?.name}, {post.district?.name},{' '}
                          {post.province?.name}
                        </div>
                      </td>
                      <td>{post.category?.name || '—'}</td>
                      <td>
                        <div>{post.user?.name || '—'}</div>
                        <div className="admin-td-sub">{post.user?.email}</div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${
                            post.status || 'pending'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td>
                        {post.published_at
                          ? new Date(
                              post.published_at,
                            ).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td className="admin-td-actions">
                        {post.status === 'pending' ? (
                          <>
                            {/* Bài CHỜ DUYỆT: chỉ Duyệt + Xoá */}
                            <button
                              type="button"
                              className="admin-link"
                              onClick={() => handleApprovePost(post.id)}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              className="admin-link admin-link--danger"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              Xoá
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Các trạng thái khác: Sửa + Ẩn / Hiển thị */}
                            <Link
                              to={`/admin/posts/${post.id}/edit`}
                              className="admin-link"
                            >
                              Sửa
                            </Link>
                            <button
                              type="button"
                              className="admin-link admin-link--danger"
                              onClick={() =>
                                handleToggleStatus(post.id, post.status)
                              }
                            >
                              {post.status === 'published'
                                ? 'Ẩn'
                                : 'Hiển thị'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PHÂN TRANG */}
            <div className="admin-paging">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ‹ Trước
              </button>
              <span>
                Trang {page} / {lastPage}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
              >
                Sau ›
              </button>
            </div>
          </>
        )}
      </section>

      {/* YÊU CẦU TRỞ THÀNH LESSOR */}
      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Yêu cầu trở thành người cho thuê</h2>
            <p>
              Duyệt / từ chối các yêu cầu nâng quyền của người dùng (bảng{' '}
              <code>lessor_applications</code> hoặc tương tự).
            </p>
          </div>
        </div>

        {lessorError && <p className="admin-error">{lessorError}</p>}
        {lessorLoading && (
          <p className="admin-loading">Đang tải danh sách yêu cầu…</p>
        )}

        {!lessorLoading && !lessorError && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Ghi chú / Nội dung</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {lessorRequests.length === 0 && (
                  <tr>
                    <td colSpan="7" className="admin-empty">
                      Hiện chưa có yêu cầu nào.
                    </td>
                  </tr>
                )}

                {lessorRequests.map(req => (
                  <tr key={req.id}>
                    <td>#{req.id}</td>
                    <td>{req.user?.name || `User #${req.user_id}`}</td>
                    <td className="admin-td-sub">
                      {req.user?.email || '—'}
                    </td>
                    <td>{req.note || req.message || '—'}</td>
                    <td>
                      <span
                        className={`admin-badge admin-badge--${
                          req.status || 'pending'
                        }`}
                      >
                        {req.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      {req.created_at &&
                        new Date(req.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="admin-td-actions">
                      <button
                        type="button"
                        className="admin-link"
                        disabled={req.status === 'approved'}
                        onClick={() => handleLessorAction(req.id, 'approve')}
                      >
                        Duyệt
                      </button>
                      <button
                        type="button"
                        className="admin-link admin-link--warning"
                        disabled={req.status === 'rejected'}
                        onClick={() => handleLessorAction(req.id, 'reject')}
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        className="admin-link admin-link--danger"
                        onClick={() => handleLessorAction(req.id, 'delete')}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
