// src/pages/BlogPage.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../assets/style/pages/blog.css'

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api'

/* =======================
   HELPER: chuẩn hóa URL ảnh
   - URL đầy đủ -> dùng luôn
   - Path (blogs/x.png) -> gắn /storage
======================= */


function resolveImage(src) {
  if (!src) return null
  if (src.startsWith('http')) return src
  return `http://127.0.0.1:8000/storage/${src}`
}

/* =======================
   MAP API -> UI
======================= */
function mapApiBlogToUi(b) {
  return {
    id: b.id,
    title: b.title,
    category: 'Khác',
    image: b.cover_image_url || 'https://via.placeholder.com/800x500?text=Blog',
    created_at: b.created_at,
    author: 'Apartments Team',
    read_time: '5 phút đọc',
    excerpt: b.excerpt || '',
  }
}


export default function BlogPage() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  /* =======================
     LOAD BLOG TỪ API
  ======================= */
  useEffect(() => {
    let cancelled = false

    async function fetchBlogs() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(`${API_BASE_URL}/blogs`, {
          headers: { Accept: 'application/json' },
        })

        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.message || 'Không tải được blog')
        }

        const list = json.data || json || []
        if (!Array.isArray(list)) {
          throw new Error('Dữ liệu blog không hợp lệ')
        }

        const mapped = list.map(mapApiBlogToUi)
        if (!cancelled) setBlogs(mapped)
      } catch (err) {
        console.error('Lỗi load blogs:', err)
        if (!cancelled) {
          setError('Không tải được blog từ server')
          setBlogs([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBlogs()
    return () => {
      cancelled = true
    }
  }, [])

  /* =======================
     FILTER
  ======================= */
  const categories = [
    ...new Set(blogs.map(b => b.category).filter(Boolean)),
  ]

  const filtered = blogs.filter(b => {
    const matchCat = category ? b.category === category : true
    const matchSearch = search
      ? b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.excerpt.toLowerCase().includes(search.toLowerCase())
      : true
    return matchCat && matchSearch
  })

  return (
    <main className="container container--main blog-page">
      <header className="blog-header">
        <div>
          <h1 className="blog-title">
            Cẩm nang thuê trọ &amp; ở chung cư
          </h1>
          <p className="blog-subtitle">
            Tổng hợp kinh nghiệm thực tế dựa trên hàng nghìn bài đăng,
            đánh giá &amp; khu vực trong hệ thống.
          </p>
        </div>
      </header>

      <section className="blog-layout">
        {/* =======================
            MAIN
        ======================= */}
        <div className="blog-main">
          {loading && <p>Đang tải bài viết...</p>}
          {error && <p className="blog-error">{error}</p>}

          {!loading && !error && (
            <>
              {filtered.length === 0 && (
                <p className="blog-empty">Không có bài viết.</p>
              )}

              <div className="blog-grid">
                {filtered.map(b => (
                  <article key={b.id} className="blog-card">
                    <div className="blog-card__media">
                      <img src={b.image} alt={b.title} />
                      <span className="blog-card__date">
                        {new Date(b.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="blog-card__body">
                      <span className="blog-card__cat">{b.category}</span>

                      <h2 className="blog-card__title">
                        <Link to={`/blog/${b.id}`}>{b.title}</Link>
                      </h2>

                      <p className="blog-card__meta">
                        Bởi <strong>{b.author}</strong> · {b.read_time}
                      </p>

                      <p className="blog-card__excerpt">{b.excerpt}</p>

                      <Link
                        to={`/blog/${b.id}`}
                        className="blog-card__more"
                      >
                        Đọc chi tiết
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        {/* =======================
            ASIDE
        ======================= */}
        <aside className="blog-aside">
          <div className="blog-widget">
            <h3>Bộ lọc nhanh</h3>

            <label className="blog-field">
              <span>Tìm theo từ khóa</span>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ví dụ: xem trọ lần đầu..."
              />
            </label>

            <label className="blog-field">
              <span>Danh mục</span>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">Tất cả</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="blog-widget">
            <h3>Bài viết nổi bật</h3>
            <ul className="blog-hotlist">
              {blogs.slice(0, 3).map(b => (
                <li key={b.id}>
                  <Link to={`/blog/${b.id}`}>
                    <span className="blog-hotlist__title">{b.title}</span>
                    <span className="blog-hotlist__meta">
                      {new Date(b.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="blog-widget blog-widget--note">
            <h3>Dựa trên dữ liệu thực</h3>
            <p>
              Các bài viết được đề xuất từ dữ liệu <strong>posts</strong>,
              <strong> reviews</strong>, khu vực (
              <strong>provinces, districts, wards</strong>) để giúp bạn
              chọn nơi ở phù hợp hơn.
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}
