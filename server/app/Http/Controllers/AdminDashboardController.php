<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\User;
use App\Models\Review;
use App\Models\SavedPost;

class AdminDashboardController extends Controller
{
    /**
     * API STATS: tổng bài đăng, người dùng, đánh giá, bài đã lưu
     * GET /api/admin/stats
     */
    public function stats()
    {
        $totalPosts   = Post::count();
        $totalUsers   = User::count();
        $totalReviews = Review::count();
        $totalSaved   = SavedPost::count();

        return response()->json([
            'status' => true,
            'data'   => [
                'total_posts'   => $totalPosts,
                'total_users'   => $totalUsers,
                'total_reviews' => $totalReviews,
                'total_saved'   => $totalSaved,
            ],
        ]);
    }

    /**
     * API DANH SÁCH BÀI ĐĂNG DÀNH CHO ADMIN
     * GET /api/admin/posts?status=&category_id=&q=&page=&per_page=
     *
     * status: all | pending | published | hidden
     */
    public function posts(Request $request)
    {
        $status     = $request->query('status', 'all');
        $categoryId = $request->query('category_id');
        $search     = trim($request->query('q', ''));
        $perPage    = (int) $request->query('per_page', 15);

        if ($perPage <= 0) {
            $perPage = 15;
        }

        $query = Post::with([
            'user:id,name,email',
            'category:id,name',
            'province:id,name',
            'district:id,name',
            'ward:id,name',
        ]);

        // lọc theo trạng thái nếu khác "all"
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        // lọc theo loại phòng
        if (!empty($categoryId)) {
            $query->where('category_id', $categoryId);
        }

        // search theo id / title / address
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('id', $search);
            });
        }

        $query->orderBy('created_at', 'desc');

        $posts = $query->paginate($perPage);

        return response()->json([
            'status' => true,
            'data'   => $posts->items(),
            'meta'   => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'per_page'     => $posts->perPage(),
                'total'        => $posts->total(),
            ],
        ]);
    }
}
