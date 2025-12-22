import { useState } from "react";

/* ================= AVATAR ================= */
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

/* ================= REVIEW NODE (LEVEL 1) ================= */
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

  const [showEditForm, setShowEditForm] = useState(false);
  const [editContent, setEditContent] = useState(review.content);
  const [editStars, setEditStars] = useState(review.rating);

  const isAuth = !!currentUser;

  /* ===== FIX OWNER REVIEW (AN TOÀN 100%) ===== */
  const reviewOwnerId =
    typeof review?.user_id === "number"
      ? review.user_id
      : typeof review?.user?.id === "number"
      ? review.user.id
      : null;

  const isOwner =
    Number.isInteger(currentUserId) &&
    Number.isInteger(reviewOwnerId) &&
    currentUserId === reviewOwnerId;
  /* ========================================= */

  const submitReply = async () => {
    if (!isAuth) {
      alert("Bạn cần đăng nhập để trả lời.");
      window.location.href = "/login";
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
            <span className="rv-stars">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < review.rating ? "is-on" : ""}>
                  ★
                </span>
              ))}
            </span>
            <span>{new Date(review.created_at).toLocaleString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {!showEditForm && <p className="rv-content">{review.content}</p>}

      {/* EDIT REVIEW */}
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
              Lưu
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
              alert("Bạn cần đăng nhập để trả lời.");
              window.location.href = "/login";
              return;
            }
              setShowEditForm(false); 
            setShowReplyForm(!showReplyForm);
          }}
        >
          Trả lời
        </span>

        {isOwner && (
          <>
            <span className="rv-action" onClick={() => setShowEditForm(true)}>
              Sửa
            </span>
            <span
              className="rv-action"
              onClick={() => onDeleteReview(review.id)}
            >
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
          />
          <div className="rv-reply-actions">
            <button className="pd-btn pd-btn--primary" onClick={submitReply}>
              Gửi
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

      {/* REPLIES */}
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

/* ================= REPLY NODE (LEVEL 2+) ================= */
function ReviewReplyNode({
  reply,
  onReplyToReply,
  onEditReply,
  onDeleteReply,
  currentUserId,
  currentUser,
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");

  const [showEditReplyForm, setShowEditReplyForm] = useState(false);
  const [editReplyText, setEditReplyText] = useState(reply.content || "");
  const [editReplyStars, setEditReplyStars] = useState(reply.rating || 0);

  /* ===== FIX OWNER REPLY (AN TOÀN 100%) ===== */
  const replyOwnerId =
    typeof reply?.user_id === "number"
      ? reply.user_id
      : typeof reply?.user?.id === "number"
      ? reply.user.id
      : null;

  const isReplyOwner =
    Number.isInteger(currentUserId) &&
    Number.isInteger(replyOwnerId) &&
    currentUserId === replyOwnerId;
  /* ======================================== */

  const submitRep = async () => {
    if (!currentUser) {
      alert("Bạn cần đăng nhập để trả lời.");
      window.location.href = "/login";
      return;
    }

    if (!replyText.trim()) return;

    await onReplyToReply(reply.id, replyText.trim());
    setReplyText("");
    setShowReplyBox(false);
  };

  const submitEditReply = async () => {
    if (!editReplyText.trim()) return;

    await onEditReply(reply.id, {
      content: editReplyText.trim(),
      rating: editReplyStars,
    });

    setShowEditReplyForm(false);
  };

  const confirmDeleteReply = async () => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    await onDeleteReply(reply.id);
  };

  return (
    <div className="rv-node">
      <div className="rv-head">
        <Avatar user={reply.user} />
        <div>
          <p className="rv-name">{reply.user?.name}</p>
          <div className="rv-meta">
            <span className="rv-stars">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < (reply.rating || 0) ? "is-on" : ""}>
                  ★
                </span>
              ))}
            </span>
            <span>{new Date(reply.created_at).toLocaleString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {!showEditReplyForm && <p className="rv-content">{reply.content}</p>}

      {showEditReplyForm && (
        <div className="rv-form">
          <div className="rv-star-input">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={i < editReplyStars ? "is-on" : ""}
                onClick={() => setEditReplyStars(i + 1)}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            rows="3"
            value={editReplyText}
            onChange={(e) => setEditReplyText(e.target.value)}
          />

          <div className="rv-edit-actions">
            <button className="pd-btn pd-btn--primary" onClick={submitEditReply}>
              Lưu
            </button>
            <button
              className="pd-btn pd-btn--ghost"
              onClick={() => setShowEditReplyForm(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="rv-actions">
        <span className="rv-action" onClick={() => 
          setShowReplyBox(!showReplyBox)}>
          Trả lời
        </span>

        {isReplyOwner && (
          <>
            <span
              className="rv-action"
              onClick={() => setShowEditReplyForm(true)}
            >
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
          />
          <div className="rv-reply-actions">
            <button className="pd-btn pd-btn--primary" onClick={submitRep}>
              Gửi
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

      {/* ĐỆ QUY */}
      {reply.children?.length > 0 && (
        <div className="rv-children">
          {reply.children.map((c) => (
            <ReviewReplyNode
              key={c.id}
              reply={c}
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
