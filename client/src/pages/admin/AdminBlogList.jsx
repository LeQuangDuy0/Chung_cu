// src/pages/admin/AdminBlogList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '@/assets/style/pages/admin.css'

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api'

// helper parse JSON an toàn
async function safeJson(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    console.warn('Phản hồi không phải JSON:', res.url, text.slice(0, 120))
    return null
  }
}

export default function AdminBlogList() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  const token = localStorage.getItem('access_token')

  // LOAD DANH SÁCH BLOG
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError('')

        // nếu backend có filter q thì thêm ?q=...
        const params = new URLSearchParams()
        if (q.trim()) params.set('q', q.trim())

        const res = await fetch(
          `${API_BASE_URL}/blogs?${params.toString()}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          },
        )

        const data = await safeJson(res)

        if (!res.ok) {
          throw new Error(data?.message || 'Không tải được danh sách blog')
        }

        const list = data?.data || data || []
        setBlogs(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Lỗi load blogs:', err)
        setError(err.message || 'Có lỗi khi tải danh sách blog')
      } finally {
        setLoading(false)
      }
    })()
  }, [q, token])

  // XOÁ BLOG
  const handleDeleteBlog = async id => {
    if (!window.confirm(`Xoá vĩnh viễn bài blog #${id}?`)) return

    try {
      const res = await fetch(`${API_BASE_URL}/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await safeJson(res)

      if (!res.ok || data?.status === false) {
        throw new Error(data?.message || 'Không xoá được bài blog')
      }

      setBlogs(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      console.error('Lỗi xoá blog:', err)
      alert(err.message || 'Có lỗi khi xoá blog')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Quản lý Blog</h1>
          <p>
            Bảng quản lý bài viết blog riêng (tin tức, kinh nghiệm, chia sẻ...).
          </p>
        </div>

        <div className="admin-header__actions">
          <Link
            to="/admin/blog-list/create"
            className="admin-btn admin-btn--primary"
          >
            + Viết bài blog mới
          </Link>
        </div>
      </header>

      {/* THANH TÌM KIẾM */}
      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Danh sách bài blog</h2>
          </div>
      
        </div>

        {error && <p className="admin-error">{error}</p>}
        {loading && !error && (
          <p className="admin-loading">Đang tải danh sách blog…</p>
        )}

        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu đề</th>
                  <th>Slug</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {blogs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="admin-empty">
                      Chưa có bài blog nào.
                    </td>
                  </tr>
                )}

                {blogs.map(blog => (
                  <tr key={blog.id}>
                    <td>#{blog.id}</td>
                    <td className="admin-td-title">
                      <Link
                        to={`/blog/${blog.slug || blog.id}`}
                        className="admin-link"
                        target="_blank"
                      >
                        {blog.title}
                      </Link>
                    </td>
                    <td>{blog.slug || '—'}</td>
                    <td>
                      <span className="admin-badge">
                        {blog.status || 'published'}
                      </span>
                    </td>
                    <td>
                      {blog.created_at
                        ? new Date(blog.created_at).toLocaleString('vi-VN')
                        : '—'}
                    </td>
                    <td className="admin-td-actions">
                      <Link
                        to={`/admin/blogs/${blog.id}/edit`}
                        className="admin-link"
                      >
                        Sửa
                      </Link>
                      <button
                        type="button"
                        className="admin-link admin-link--danger"
                        onClick={() => handleDeleteBlog(blog.id)}
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
