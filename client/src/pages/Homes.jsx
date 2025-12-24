import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/axios' 
import '@/assets/style/pages/Homes.css'

import { 
  Play, Phone, Home, FileText, 
  MapPin, ArrowRight, CheckCircle, Star, TrendingUp, Users, Eye, Info 
} from 'lucide-react'

export default function Homes() {
  const nav = useNavigate()
  
  // --- DATA STATE ---
  const [featured, setFeatured] = useState([])
  const [latestPosts, setLatestPosts] = useState([]) // State chứa bài viết mới nhất
  const [blogs, setBlogs] = useState([]) 
  const [stats, setStats] = useState({ posts: 0, landlords: 0, views: 0 }) 
  const [loadingHome, setLoadingHome] = useState(true)

  // --- API CALL ---
  useEffect(() => {
    // Dùng AbortController để hủy request nếu user chuyển trang nhanh
    const controller = new AbortController(); 

    async function loadData() {
      setLoadingHome(true)
      try {
        // Gọi song song các API (bao gồm API Posts để lấy bài mới nhất)
        const results = await Promise.allSettled([
            api.get('/posts', { signal: controller.signal }),      // 0: Posts
            api.get('/blogs', { signal: controller.signal }),      // 1: Blogs
            api.get('/home/stats', { signal: controller.signal })  // 2: Stats
        ])

        const [postsRes, blogsRes, statsRes] = results;

        // 1. Xử lý Posts (Lấy bài mới nhất)
        if (postsRes.status === 'fulfilled') {
            const rawPosts = postsRes.value.data?.data || []
            
            const mappedPosts = rawPosts.map((p) => ({
                id: p.id,
                title: p.title,
                price: p.price,
                area: p.area,
                created_at: p.created_at,
                // Nối chuỗi địa chỉ
                address: [
                  p.address, 
                  p.ward?.name || p.ward_name, 
                  p.district?.name || p.district_name, 
                  p.province?.name || p.province_name
                ].filter(Boolean).join(', '),
                // Logic ảnh: Main -> Thumbnail -> Ảnh đầu -> Placeholder
                img: p.main_image_url || p.thumbnail_url || (p.images?.[0]?.url) || 'https://via.placeholder.com/1000',
            }))

            // Sắp xếp bài mới nhất lên đầu
            const sorted = mappedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            
            // Cập nhật state (đoạn JSX bên dưới sẽ tự slice lấy 3 bài)
            setLatestPosts(sorted)
            setFeatured(sorted.slice(0, 3)) // (Tùy chọn) Nếu bạn dùng featured ở đâu đó
        }

        // 2. Xử lý Blogs
        if (blogsRes.status === 'fulfilled') {
            const rawBlogs = blogsRes.value.data?.data || []
            setBlogs(rawBlogs.slice(0, 3).map(b => ({
                id: b.id,
                title: b.title,
                excerpt: b.excerpt || b.content?.substring(0, 100) + '...', 
                img: b.image || 'https://via.placeholder.com/600x400',
                slug: b.slug
            })))
        }

        // 3. Xử lý Stats
        if (statsRes.status === 'fulfilled') {
            const resData = statsRes.value.data; 
            const statsData = resData?.data || {};
            
            setStats({
                posts: statsData.posts || 0,
                landlords: statsData.landlords || 0,
                views: statsData.views || 0
            })
        }

      } catch (err) {
        if (err.name !== 'CanceledError') {
            console.error("Lỗi tải trang chủ:", err)
        }
      } finally {
        setLoadingHome(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [])

  // Hàm xử lý khi click vào địa điểm (Bento Grid)
  const handleLocationClick = (locationName) => {
    nav(`/phong-tro?q=${encodeURIComponent(locationName)}`);
  };

  if (loadingHome) {
    return (
        <div className="loading-screen">
            <div className="spinner"></div>
        </div>
    )
  }

  return (
    <div className="home-wrapper">
      
      {/* 1. HERO SECTION */}
      <header className="hero-section">
        <div className="container">
            <div className="hero-grid">
                {/* Left Content */}
                <div className="hero-left animate-fade-in">
                    <div className="hero-badge">
                        <Star size={14} fill="currentColor" /> 
                        <span>Nền tảng số 1 tại Huế</span>
                    </div>

                    <h1 className="hero-title">
                        Tìm <span className="text-gradient">Không Gian Sống</span> <br />
                        Đẳng Cấp
                    </h1>
                    
                    <p className="hero-desc">
                        Kết nối trực tiếp hàng nghìn chủ nhà và người thuê. Thông tin minh bạch, hình ảnh xác thực.
                    </p>

                    <div className="hero-actions">
                        <button onClick={() => nav('/phong-tro')} className="btn-primary">
                            Tìm Ngay <ArrowRight size={20}/>
                        </button>
                        <button className="btn-outline" onClick={() => nav('/blog')}>
                            <div className="icon-circle">
                                 <Info size={14} />
                            </div>
                            <span>Về Chúng Tôi</span>
                        </button>
                    </div>
                </div>

                {/* Right Image */}
                <div className="hero-right animate-fade-in">
                    <div className="hero-image-wrapper">
                        <img 
                            src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1200" 
                            alt="Hero Apartment" 
                            className="hero-img"
                        />
                        <div className="hero-overlay"></div>
                        
                        <div className="hero-floating-card">
                            <div className="check-icon">
                                <CheckCircle size={24} strokeWidth={3} />
                            </div>
                            <div style={{textAlign: 'left'}}>
                                <small style={{display: 'block', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px'}}>Hệ thống an toàn</small>
                                <strong style={{color: '#fff', fontSize: '16px'}}>Đã xác thực 100%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* 2. STATS BAR */}
      <section className="stats-section">
        <div className="container">
            <div className="stats-card">
                    <div className="stats-grid">
    {/* 1. Năm Kinh Nghiệm */}
    <div className="stat-item">
        <div className="stat-icon" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa'}}>
            <Star size={24} />
        </div>
        <h3 className="stat-value">5+</h3>
        <p className="stat-label">Năm KN</p>
    </div>

    {/* 2. Tổng số bài đăng */}
    <div className="stat-item">
        <div className="stat-icon" style={{background: 'rgba(52, 211, 153, 0.1)', color: '#34d399'}}>
            <Home size={24} />
        </div>
        <h3 className="stat-value">
            {stats.posts ? stats.posts.toLocaleString() : 0}+
        </h3>
        <p className="stat-label">Phòng Trọ</p>
    </div>

    {/* 3. Tổng số chủ nhà */}
    <div className="stat-item">
        <div className="stat-icon" style={{background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa'}}>
            <Users size={24} />
        </div>
        <h3 className="stat-value">
            {stats.landlords ? stats.landlords.toLocaleString() : 0}+
        </h3>
        <p className="stat-label">Chủ Nhà</p>
    </div>

    {/* 4. Tổng lượt xem */}
    <div className="stat-item">
        <div className="stat-icon" style={{background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c'}}>
            <Eye size={24} />
        </div>
        <h3 className="stat-value">
            {stats.views ? stats.views.toLocaleString() : 0}
        </h3>
        <p className="stat-label">Lượt Xem</p>
    </div>
</div>
            </div>
        </div>
      </section>

      {/* 3. STEPS SECTION */}
      <section className="section">
        <div className="container">
            <div className="section-header">
                <span className="section-subtitle">Quy trình đơn giản</span>
                <h3 className="section-title">Thuê phòng chỉ với 3 bước</h3>
            </div>

            <div className="grid-3">
                {[
                    { icon: Phone, title: "Liên hệ tư vấn", desc: "Kết nối trực tiếp chủ nhà.", step: "1" },
                    { icon: Home, title: "Xem phòng thực tế", desc: "Hình ảnh cam kết giống 100%.", step: "2" },
                    { icon: FileText, title: "Ký hợp đồng", desc: "Thủ tục pháp lý minh bạch.", step: "3" }
                ].map((item, idx) => (
                    <div key={idx} className="step-card">
                        <div className="step-number">{item.step}</div>
                        <div className="step-icon-box">
                            <item.icon size={36} strokeWidth={1.5} />
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>
      
      {/* 4. LATEST LISTINGS (ĐÃ KẾT NỐI API) */}
      <section className="section">
        <div className="container">
            <div className="section-top">
                <div>
                    <h2 className="section-title" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <TrendingUp size={32} color="#3b82f6"/> Phòng mới nhất
                    </h2>
                    <p className="hero-desc" style={{marginBottom: 0, marginTop: '8px'}}>Cập nhật liên tục các phòng trọ vừa được đăng tải.</p>
                </div>
                <Link to="/phong-tro" className="btn-outline">
                    Xem tất cả <ArrowRight size={18}/>
                </Link>
            </div>
            
            <div className="grid-3">
                {latestPosts.length > 0 ? (
                    latestPosts.slice(0, 3).map((item) => (
                    <div key={item.id} className="home-card">
                        <div className="home-card__img">
                            <img src={item.img} alt={item.title} />
                            <span className="card-badge-new">Mới</span>
                            <div className="card-price-tag">{Number(item.price).toLocaleString('vi-VN')} đ</div>
                        </div>
                        
                        <div className="home-card__body">
                            <h3 className="home-card__title" title={item.title}>{item.title}</h3>
                            <div className="home-card__addr">
                                <MapPin size={16} style={{marginTop: '2px', flexShrink: 0}} />
                                <span style={{display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{item.address}</span>
                            </div>
                            
                            <div className="home-card__footer">
                                <div className="card-specs">
                                    <span>{item.area} m²</span>
                                    <span>Full nội thất</span>
                                </div>
                                <Link to={`/post/${item.id}`} className="btn-circle">
                                    <ArrowRight size={18}/>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))
                ) : (
                    <p style={{color: '#94a3b8', textAlign: 'center', gridColumn: '1/-1'}}>Đang cập nhật bài viết...</p>
                )}
            </div>
        </div>
      </section>

      {/* 5. POPULAR LOCATIONS (ĐÃ THÊM SỰ KIỆN CLICK) */}
      <section className="section">
        <div className="container">
            <div className="section-header">
                <h3 className="section-title">Khám phá theo khu vực</h3>
                <p className="hero-desc" style={{marginBottom: 0}}>Các khu vực hot nhất tại Huế</p>
            </div>
            
            <div className="bento-grid">
                <div 
                    className="bento-item bento-large" 
                    onClick={() => handleLocationClick("Vỹ Dạ")}
                    style={{cursor: 'pointer'}}
                >
                    <img src="https://images.unsplash.com/photo-1565610222536-ef125c59da2c?auto=format&fit=crop&q=80&w=1000" className="bento-img" alt="Vỹ Dạ"/>
                    <div className="bento-overlay"></div>
                    <div className="bento-content">
                        <h4 className="bento-title">Vỹ Dạ</h4>
                        <p className="bento-subtitle">120+ Phòng</p>
                    </div>
                </div>

                <div 
                    className="bento-item"
                    onClick={() => handleLocationClick("Xuân Phú")}
                    style={{cursor: 'pointer'}}
                >
                    <img src="https://images.unsplash.com/photo-1628624747186-a941c725611b?auto=format&fit=crop&q=80&w=500" className="bento-img" alt="Xuân Phú"/>
                    <div className="bento-overlay"></div>
                    <div className="bento-content">
                        <h4 className="bento-title">Xuân Phú</h4>
                        <p className="bento-subtitle">85+ Phòng</p>
                    </div>
                </div>

                <div 
                    className="bento-item"
                    onClick={() => handleLocationClick("An Cựu")}
                    style={{cursor: 'pointer'}}
                >
                    <img src="https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=500" className="bento-img" alt="An Cựu"/>
                    <div className="bento-overlay"></div>
                    <div className="bento-content">
                        <h4 className="bento-title">An Cựu</h4>
                        <p className="bento-subtitle">60+ Phòng</p>
                    </div>
                </div>

                <div 
                    className="bento-item bento-wide"
                    onClick={() => handleLocationClick("Huế")}
                    style={{cursor: 'pointer'}}
                >
                    <img src="https://images.unsplash.com/photo-1512918760532-3ed64bc80e89?auto=format&fit=crop&q=80&w=800" className="bento-img" alt="Trung tâm"/>
                    <div className="bento-overlay"></div>
                    <div className="bento-content">
                        <h4 className="bento-title">Trung tâm TP</h4>
                        <p className="bento-subtitle">200+ Căn hộ</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="section bg-darker" style={{backgroundColor: 'rgba(15, 22, 35, 0.5)'}}>
        <div className="container">
            <div className="section-header">
                <span className="section-subtitle">Đánh giá</span>
                <h3 className="section-title">Khách hàng nói gì?</h3>
            </div>

            <div className="grid-3">
                {[
                    { name: "Nguyễn Văn A", role: "Sinh viên Y Dược", text: "Tìm phòng trọ ở Huế chưa bao giờ dễ dàng thế. Hình ảnh trên web rất thực tế.", img: "https://i.pravatar.cc/150?img=11" },
                    { name: "Trần Thị B", role: "NV Văn phòng", text: "Giao diện đẹp, dễ sử dụng. Thích nhất là tính năng lọc theo khu vực.", img: "https://i.pravatar.cc/150?img=5" },
                    { name: "Lê Hoàng C", role: "Chủ nhà trọ", text: "Tôi đăng tin trên Apartments rất hiệu quả, khách gọi liên tục.", img: "https://i.pravatar.cc/150?img=3" }
                ].map((item, idx) => (
                    <div key={idx} className="testimonial-card">
                        <div className="stars">
                            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                        </div>
                        <p className="review-text">"{item.text}"</p>
                        <div className="user-info">
                            <img src={item.img} alt={item.name} className="user-avatar"/>
                            <div>
                                <h4 style={{margin: 0, fontSize: '14px', color: '#fff'}}>{item.name}</h4>
                                <small style={{color: '#64748b'}}>{item.role}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 7. CTA LANDLORD */}
      <section className="section">
        <div className="container">
            <div className="cta-box">
                <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=2000" alt="bg" className="cta-bg"/>
                <div className="hero-overlay" style={{background: 'linear-gradient(to right, #0f172a, transparent)', opacity: 0.9}}></div>
                
                <div className="cta-content">
                    <div className="cta-text">
                        <h2 className="cta-title">
                            Bạn có phòng trống? <br/>
                            <span className="text-highlight">Đăng tin ngay!</span>
                        </h2>
                        <p className="hero-desc">Tiếp cận hàng nghìn khách thuê tiềm năng tại Huế. Miễn phí trọn đời.</p>
                        <div className="hero-actions" style={{justifyContent: 'flex-start'}}>
                            <button className="btn-primary" style={{background: '#fff', color: '#0f172a'}}>
                                Đăng Tin Ngay <ArrowRight size={20}/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="hidden-mobile" style={{display: 'flex', justifyContent: 'flex-end'}}>
                        <div className="cta-card-3d">
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                                <div className="icon-circle" style={{background: '#22c55e', color: '#fff'}}><CheckCircle size={20}/></div>
                                <div>
                                    <small style={{color: '#cbd5e1', textTransform: 'uppercase'}}>Hiệu quả</small>
                                    <div style={{color: '#fff', fontWeight: 'bold', fontSize: '18px'}}>Tiếp cận nhanh</div>
                                </div>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                <div className="icon-circle" style={{background: '#3b82f6', color: '#fff'}}><Users size={20}/></div>
                                <div>
                                    <small style={{color: '#cbd5e1', textTransform: 'uppercase'}}>Cộng đồng</small>
                                    <div style={{color: '#fff', fontWeight: 'bold', fontSize: '18px'}}>5000+ Khách</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 8. BLOG SECTION */}
      {blogs.length > 0 && (
         <section className="section" style={{borderTop: '1px solid var(--border-light)'}}>
            <div className="container">
                <div className="section-top">
                    <h3 className="section-title">Bài viết hữu ích</h3>
                    <Link to="/blogs" className="section-subtitle" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 0}}>
                        Xem thêm <ArrowRight size={14}/>
                    </Link>
                </div>
                <div className="grid-3">
                    {blogs.map(blog => (
                        <article key={blog.id} className="home-card" style={{border: 'none', background: 'transparent', boxShadow: 'none'}}>
                            <div className="home-card__img" style={{borderRadius: '16px', overflow: 'hidden'}}>
                                 <img src={blog.img || 'https://via.placeholder.com/600x400'} alt={blog.title} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                            </div>
                            <div style={{paddingTop: '20px'}}>
                                <h3 className="home-card__title" style={{whiteSpace: 'normal', lineHeight: 1.4}}>{blog.title}</h3>
                                <p className="hero-desc" style={{fontSize: '14px', marginBottom: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{blog.excerpt}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
         </section>
      )}

    </div>
  )
}