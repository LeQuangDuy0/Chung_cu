import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

// ❌ KHÔNG IMPORT CSS NGOÀI ĐỂ TRÁNH LỖI GIAO DIỆN CŨ
// import '../assets/style/pages/blog.css'

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api'

/* =======================
   HELPER: Chuẩn hóa ảnh
======================= */
function resolveImage(src) {
  if (!src) return 'https://via.placeholder.com/800x500?text=No+Image'
  if (src.startsWith('http')) return src
  return `http://127.0.0.1:8000/storage/${src}`
}

export default function BlogDetail() {
  const { slug } = useParams()
  
  const [blog, setBlog] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Contact form state (sidebar)
  const [contactName, setContactName] = useState('')
  const [contactPhoneInput, setContactPhoneInput] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        setLoading(true); setError('')

        // 1. TẢI BÀI VIẾT CHI TIẾT
        const res = await fetch(`${API_BASE_URL}/blogs/${encodeURIComponent(slug)}`)
        let data = null
        try {
           const json = await res.json()
           if (res.ok) {
             data = Array.isArray(json.data) ? json.data[0] : (json.data || json)
           } else {
             // Fallback: Tải list rồi tìm
             const allRes = await fetch(`${API_BASE_URL}/blogs`)
             const allJson = await allRes.json()
             const list = allJson.data || allJson || []
             data = list.find(b => String(b.slug) === slug || String(b.id) === slug)
           }
        } catch(e){}

        if (!data) throw new Error('Bài viết không tồn tại hoặc đã bị xóa.')
        if (!cancelled) setBlog(data)

        // 2. TẢI BÀI VIẾT LIÊN QUAN (SIDEBAR)
        const listRes = await fetch(`${API_BASE_URL}/blogs`)
        const listJson = await listRes.json()
        const fullList = listJson.data || listJson || []
        
        // Lọc bài hiện tại ra, lấy 5 bài khác làm "Tin nổi bật"
        const related = fullList
          .filter(item => String(item.id) !== String(data.id))
          .slice(0, 5)

        if (!cancelled) setSimilar(related)

      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [slug])

  function handleContactSubmit(e) {
    e.preventDefault()
    if (!contactPhoneInput && !contactMessage) {
      alert('Vui lòng nhập SĐT hoặc nội dung tin nhắn.')
      return
    }
    setContactSending(true)
    // TODO: Replace this with an API request if you want to send to backend
    setTimeout(() => {
      setContactSending(false)
      setContactName('')
      setContactPhoneInput('')
      setContactMessage('')
      alert('Tin nhắn đã được gửi cho chủ tin.')
    }, 900)
  }

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Đang tải nội dung...</div>
  if (error || !blog) return <div style={{padding:50, textAlign:'center', color:'red'}}>{error}</div>

  const cover = resolveImage(blog.cover_image_url)
  const dateStr = blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'

  return (
    <div className="blog-detail-wrapper">
      
      {/* --- CSS STYLE RIÊNG BIỆT (GIAO DIỆN PHONGTRO123) --- */}
      <style>{`
   
        /* Reset cơ bản */
        .blog-detail-wrapper {
     
          min-height: 100vh;
          font-family: Arial, Helvetica, sans-serif;
          color: #ffffffff;
          padding: 30px 0;
        }

        .bd-container {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 15px;
        }

        /* LAYOUT 2 CỘT */
        .bd-layout {
          display: grid;
          grid-template-columns: 2.3fr 1fr; /* Trái rộng - Phải hẹp */
          gap: 20px;
          align-items: start;
        }

        /* --- CỘT TRÁI: NỘI DUNG --- */
        .bd-main {
        
          padding: 20px;
          border: 1px solid rgba(148, 163, 184, 0.4);;
          border-radius: 10px;
        }

        /* Tiêu đề chính: ĐỎ, ĐẬM, TO */
        .bd-title {
          color: #ffffffff; /* Màu đỏ đặc trưng */
          font-size: 24px;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .bd-meta {
          font-size: 13px;
          color: #cbcbcbff;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px dashed #eee;
          display: flex;
          gap: 15px;
        }
        .bd-meta strong { color: #bbbbbbff; }

        /* Nội dung HTML */
        .bd-content {
          font-size: 15px;
          line-height: 1.6;
          color: #cececeff;
        }
        .bd-content p { margin-bottom: 15px; }
        
        /* Fix ảnh trong bài viết */
        .bd-content img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 15px auto;
          border-radius: 4px;
        }

        .bd-content h2, .bd-content h3 {
          font-size: 18px;
          font-weight: 700;
          color: #000;
          margin-top: 25px;
          margin-bottom: 10px;
        }

        /* --- CỘT PHẢI: SIDEBAR --- */
        .bd-sidebar {   top: 20px; }

        .bd-widget {
      
          border: 1px solid rgba(148, 163, 184, 0.4);;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .bd-widget-header {
          font-size: 16px;
          font-weight: 700;
          color: #d5d5d5ff;
          margin-bottom: 15px;
          padding-bottom: 10px;
          /* border-bottom: 1px solid #eee; */
        }

        /* Item tin tức bên phải */
        .bd-news-item {
          display: flex;
          gap: 10px;
          text-decoration: none;
          color: #c4c4c4ff;
          align-items: flex-start;
          border-bottom: 1px solid rgba(148, 163, 184, 0.4);;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .bd-news-item:last-child { border-bottom: none; margin-bottom: 0; }
        
        .bd-news-img {
          width: 65px;
          height: 65px;
          object-fit: cover;
          border-radius: 4px;
         
          flex-shrink: 0;
          border: 1px solid #f1f1f1;
        }

        .bd-news-info { flex: 1; }

        .bd-news-title {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.3;
          color: #abababff;
          margin-bottom: 4px;
          
          /* Cắt dòng */
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bd-news-item:hover .bd-news-title { color: #ffffffff; }

        .bd-news-price {
          font-size: 12px;
          color: #16c784; /* Màu xanh lá giả lập giá */
          font-weight: 700;
        }

        .bd-news-time {
          font-size: 11px;
          color: #999;
          margin-top: 2px;
        }

        /* Responsive Mobile */
        @media (max-width: 900px) {
          .bd-layout { grid-template-columns: 1fr; }
          .bd-sidebar { display: none; } /* Ẩn sidebar trên mobile cho gọn */
        }
      `}</style>

      <div className="bd-container">
        
        

        <div className="bd-layout">
          
          {/* === CỘT TRÁI: NỘI DUNG CHÍNH === */}
          <main className="bd-main">
            
            {/* Tiêu đề Đỏ - Đậm */}
            <h1 className="bd-title">
              {blog.title}
            </h1>

            {/* Thông tin bài viết */}
            <div className="bd-meta">
              <span>Đăng bởi: <strong>{blog.author_name || 'Admin'}</strong></span>
              <span>Ngày: {dateStr}</span>
            </div>
            
            {/* Ảnh Cover (nếu muốn hiện đầu bài) */}
            {/* {cover && (
                <div style={{marginBottom: 20}}>
                    <img src={cover} alt="cover" style={{width:'100%',display:'flex', margin:'0 auto',justifyContent:'center', height: 400, borderRadius: 4}} />
                </div>
            )} */}

            {/* Nội dung HTML */}
            <div 
              className="bd-content"
              dangerouslySetInnerHTML={{ __html: blog.content }} 
            />
          </main>

          {/* === CỘT PHẢI: SIDEBAR === */}
          <aside className="bd-sidebar">
            
            {/* Widget: Tin nổi bật */}
            <div className="bd-widget">
              <h3 className="bd-widget-header">Tin nổi bật</h3>
              <div>
                {similar.map(item => (
                  <Link key={item.id} to={`/blog/${item.slug || item.id}`} className="bd-news-item">
                    <img 
                      src={resolveImage(item.cover_image_url)} 
                      alt="thumb" 
                      className="bd-news-img"
                    />
                    <div className="bd-news-info">
                      <div className="bd-news-title">{item.title}</div>
                      <div className="bd-news-price">Xem ngay</div> 
                      <div className="bd-news-time">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : 'Vừa xong'}
                      </div>
                    </div>
                  </Link>
                ))}
                {similar.length === 0 && <p style={{fontSize:13, color:'#999'}}>Đang cập nhật...</p>}
              </div>
            </div>

          

            

          </aside>

        </div>
      </div>
    </div>
  )
}