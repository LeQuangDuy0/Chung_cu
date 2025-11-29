// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from 'react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  // ===== LOAD DANH SÁCH USER =====
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')

        const token = localStorage.getItem('access_token')
        if (!token) throw new Error('Bạn chưa đăng nhập admin.')

        const res = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        if (!res.ok) throw new Error('Không tải được danh sách người dùng')

        const data = await res.json()
        setUsers(data.data || data)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Có lỗi xảy ra')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ===== ĐỔI ROLE (user <-> lessor) =====
  const changeRole = async (userId, newRole) => {
    try {
      setSavingId(userId)
      setError('')

      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('Bạn chưa đăng nhập admin.')

      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Máy chủ trả về dữ liệu không hợp lệ.')
      }

      if (!res.ok || data.status === false) {
        throw new Error(data.message || 'Không cập nhật được vai trò.')
      }

      // Cập nhật lại trong state
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)),
      )
    } catch (err) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra khi cập nhật vai trò.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <h2>Quản lý người dùng</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: '#fecaca', marginTop: 8 }}>{error}</p>}

      <div className="admin-card" style={{ marginTop: 10 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const createdAt = u.created_at
                ? new Date(u.created_at).toLocaleString('vi-VN')
                : ''

              const isUser = u.role === 'user'
              const isLessor = u.role === 'lessor'

              return (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{createdAt}</td>
                  <td>
                    {isUser && (
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={savingId === u.id}
                        onClick={() => changeRole(u.id, 'lessor')}
                      >
                        {savingId === u.id
                          ? 'Đang cấp quyền...'
                          : 'Cấp quyền lessor'}
                      </button>
                    )}

                    {isLessor && (
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        disabled={savingId === u.id}
                        onClick={() => changeRole(u.id, 'user')}
                        style={{ marginLeft: 8 }}
                      >
                        {savingId === u.id
                          ? 'Đang cập nhật...'
                          : 'Hạ xuống user'}
                      </button>
                    )}

                    {!isUser && !isLessor && <span>—</span>}
                  </td>
                </tr>
              )
            })}

            {!loading && !users.length && (
              <tr>
                <td colSpan="6">Chưa có người dùng.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
