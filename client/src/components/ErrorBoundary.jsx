import React from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container container--main">
          <div style={{ padding: 40 }}>
            <h2>Ứng dụng gặp lỗi</h2>
            <p>Không thể tải nội dung do lỗi bên trong component.</p>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#a00' }}>{String(this.state.error?.message || this.state.error)}</pre>
            <p>
              <Link to="/blog">← Quay lại danh sách bài viết</Link>
            </p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
