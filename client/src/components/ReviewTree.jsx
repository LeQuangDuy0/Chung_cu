import { useState } from "react";

function Avatar({ user }) {
  const ava =
    user?.avatar_url ||
    user?.avatar ||
    user?.avatar_path ||
    "";

  if (ava) {
    return (
      <div className="rv-avatar">
        <img src={ava} alt={user?.name} />
      </div>
    );
  }

  return (
    <div className="rv-avatar">
      {user?.name?.charAt(0).toUpperCase() || "U"}
    </div>
  );
}

export default function ReviewTree({
  postId,
  review,
  replies = [],
  onReplySubmit,
  onEditReview,
  onDeleteReview,
  onReplyToReply,
  onEditReply,
  onDeleteReply,
  currentUserId,
  currentUser,
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const isAuth = !!currentUser;

  const [showEditForm, setShowEditForm] = useState(false);
  const [editContent, setEditContent] = useState(review.content);
  const [editStars, setEditStars] = useState(review.rating);

  const isOwner = currentUserId === review.user_id;

  const submitReply = async () => {
    if (!isAuth) {
      alert('Bạn cần đăng nhập để trả lời.');
      window.location.href = '/login';
      return;
    }
    if (!replyContent.trim()) return;

    await onReplySubmit(review.id, replyContent.trim());
    setReplyContent("");
    setShowReplyForm(false);
  };

  const submitEdit = async () => {
    if (!editContent.trim()) return;

    await onEditReview(review.id, {
      rating: editStars,
      content: editContent.trim(),
    });

    setShowEditForm(false);
  };

  return (
    <div className="rv-node">

      {/* HEADER */}
      <div className="rv-head">
        <Avatar user={review.user} />

        <div>
          <p className="rv-name">{review.user?.name}</p>
          <div className="rv-meta">
            {/* STARS */}
            <span className="rv-stars">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < review.rating ? "is-on" : ""}>
                  ★
                </span>
              ))}
            </span>

            <span>
              {new Date(review.created_at).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>

      {/* NỘI DUNG REVIEW */}
      {!showEditForm && (
        <p className="rv-content">{review.content}</p>
      )}

      {/* FORM EDIT REVIEW */}
      {showEditForm && (
        <div className="rv-form">
          <div className="rv-star-input">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={i < editStars ? "is-on" : ""}
                onClick={() => setEditStars(i + 1)}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            rows="4"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />

          <div className="rv-edit-actions">
            <button className="pd-btn pd-btn--primary" onClick={submitEdit}>
              Lưu thay đổi
            </button>

            <button
              className="pd-btn pd-btn--ghost"
              onClick={() => setShowEditForm(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="rv-actions">
        <span
          className="rv-action"
          onClick={() => {
            if (!isAuth) {
              alert('Bạn cần đăng nhập để trả lời.');
              window.location.href = '/login';
              return;
            }
            setShowReplyForm(!showReplyForm)
          }}
        >
          Trả lời
        </span>

        {isOwner && (
          <>
            <span className="rv-action" onClick={() => setShowEditForm(true)}>
              Sửa
            </span>

            <span className="rv-action" onClick={() => onDeleteReview(review.id)}>
              Xóa
            </span>
          </>
        )}
      </div>

      {/* FORM REPLY */}
      {showReplyForm && (
        <div className="rv-reply-form">
          <textarea
            rows="3"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Nhập bình luận..."
          />

          <div className="rv-reply-actions">
            <button className="pd-btn pd-btn--primary" onClick={submitReply}>
              Gửi trả lời
            </button>

            <button
              className="pd-btn pd-btn--ghost"
              onClick={() => setShowReplyForm(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* REPLIES (ĐỆ QUY) */}
      {replies.length > 0 && (
        <div className="rv-children">
          {replies.map((rep) => (
            <ReviewReplyNode
              key={rep.id}
              reply={rep}
              onReplyToReply={onReplyToReply}
              onEditReply={onEditReply}
              onDeleteReply={onDeleteReply}
              currentUserId={currentUserId}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/*********************************************************
     COMPONENT REPLY CHO LEVEL 2+ (CHỈ LÀ BÌNH LUẬN)
*********************************************************/
function ReviewReplyNode({ reply, onReplyToReply, onEditReply, onDeleteReply, currentUserId, currentUser }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");

  const [showEditReplyForm, setShowEditReplyForm] = useState(false);
  const [editReplyText, setEditReplyText] = useState(reply.content || "");

  const isReplyOwner = currentUserId === reply.user_id;

  const submitRep = async () => {
    if (!currentUser) {
      alert('Bạn cần đăng nhập để trả lời.');
      window.location.href = '/login';
      return;
    }

    if (!replyText.trim()) return;

    await onReplyToReply(reply.id, replyText.trim());
    setReplyText("");
    setShowReplyBox(false);
  };

  const submitEditReply = async () => {
    if (!editReplyText.trim()) return;
    await onEditReply(reply.id, { content: editReplyText.trim() });
    setShowEditReplyForm(false);
  };

  const confirmDeleteReply = async () => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    await onDeleteReply(reply.id);
  };

  return (
    <div className="rv-node">

      <div className="rv-head">
        <Avatar user={reply.user} />
        <div>
          <p className="rv-name">{reply.user?.name}</p>
          <p className="rv-meta">
            {new Date(reply.created_at).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {!showEditReplyForm && <p className="rv-content">{reply.content}</p>}

      {/* EDIT FORM for reply */}
      {showEditReplyForm && (
        <div className="rv-form">
          <textarea
            rows="3"
            value={editReplyText}
            onChange={(e) => setEditReplyText(e.target.value)}
          />
          <div className="rv-edit-actions">
            <button className="pd-btn pd-btn--primary" onClick={submitEditReply}>
              Lưu
            </button>
            <button className="pd-btn pd-btn--ghost" onClick={() => setShowEditReplyForm(false)}>
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="rv-actions">
        <span className="rv-action" onClick={() => setShowReplyBox(!showReplyBox)}>
          Trả lời
        </span>

        {isReplyOwner && (
          <>
            <span className="rv-action" onClick={() => setShowEditReplyForm(true)}>
              Sửa
            </span>

            <span className="rv-action" onClick={confirmDeleteReply}>
              Xóa
            </span>
          </>
        )}
      </div>

      {showReplyBox && (
        <div className="rv-reply-form">
          <textarea
            rows="3"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Nhập câu trả lời..."
          />
          <div className="rv-reply-actions">
            <button className="pd-btn pd-btn--primary" onClick={submitRep}>
              Gửi trả lời
            </button>
            <button
              className="pd-btn pd-btn--ghost"
              onClick={() => setShowReplyBox(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* REPLY CỦA REPLY — LỒNG VÔ HẠN */}
      {reply.children?.length > 0 && (
        <div className="rv-children">
          {reply.children.map((c) => (
            <ReviewReplyNode
              key={c.id}
              reply={c}
              onReplyToReply={onReplyToReply}
              currentUserId={currentUserId}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
