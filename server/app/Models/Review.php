<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $table = 'reviews';

    protected $fillable = ['user_id', 'post_id', 'rating', 'content'];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function post() {
        return $this->belongsTo(Post::class);
    }

    public function replies()
    {
        return $this->hasMany(ReviewReply::class)
            ->whereNull('parent_id')
            ->with('children');
    }
    public function replyReview(Request $request, $id)
{
    $user = Auth::user();

    if (!$user) {
        return response()->json(['status' => false, 'message' => 'Bạn phải đăng nhập.'], 401);
    }

    $request->validate([
        'content' => 'required|string'
    ]);

    $review = Review::find($id);
    if (!$review) {
        return response()->json(['status' => false, 'message' => 'Không tìm thấy đánh giá.'], 404);
    }

    $reply = ReviewReply::create([
        'review_id' => $review->id,
        'user_id'   => $user->id,
        'content'   => $request->content,
        'parent_id' => null
    ]);

    return response()->json([
        'status' => true,
        'data' => $reply
    ]);
}
public function replyChild(Request $request, $replyId)
{
    $user = Auth::user();

    if (!$user) {
        return response()->json(['status' => false, 'message' => 'Bạn phải đăng nhập.'], 401);
    }

    $request->validate([
        'content' => 'required|string'
    ]);

    $parent = ReviewReply::find($replyId);
    if (!$parent) {
        return response()->json(['status' => false, 'message' => 'Không tìm thấy bình luận để trả lời.'], 404);
    }

    $reply = ReviewReply::create([
        'review_id' => $parent->review_id,
        'user_id'   => $user->id,
        'content'   => $request->content,
        'parent_id' => $parent->id
    ]);

    return response()->json([
        'status' => true,
        'data' => $reply
    ]);
}

}
