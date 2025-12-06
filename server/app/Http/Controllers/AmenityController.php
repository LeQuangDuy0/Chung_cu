<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Amenity;
use Illuminate\Support\Str;
use Exception;

class AmenityController extends Controller
{
    // GET /api/amenities
    public function index()
    {
        try {
            $data = Amenity::orderBy('name')->get();
            return response()->json(['status' => true, 'data' => $data], 200);
        } catch (Exception $e) {
            Log::error('Lỗi lấy danh sách tiện ích: '.$e->getMessage());
            return response()->json(['status' => false, 'message' => 'Không thể tải danh sách tiện ích.'], 500);
        }
    }

    // POST /api/amenities (admin)
    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Chỉ admin mới thêm tiện ích.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255'
        ]);

        try {

            $slug = Str::slug($request->name);

            $amenity = Amenity::create([
                'name' => $request->name,
                'slug' => $slug
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Thêm tiện ích thành công.',
                'data'    => $amenity
            ], 201);

        } catch (Exception $e) {
            Log::error('Lỗi thêm tiện ích: '.$e->getMessage());
            return response()->json(['status' => false, 'message' => 'Không thể thêm tiện ích.'], 500);
        }
    }

    // PUT /api/amenities/{id} (admin)
    public function update(Request $request, $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Chỉ admin mới sửa tiện ích.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255'
        ]);

        $amenity = Amenity::find($id);
        if (!$amenity) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy tiện ích.'], 404);
        }

        $slug = Str::slug($request->name);

        $amenity->update([
            'name' => $request->name,
            'slug' => $slug
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Cập nhật tiện ích thành công.',
            'data' => $amenity
        ]);
    }

    // DELETE /api/amenities/{id} (admin)
    public function destroy($id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Chỉ admin mới xóa tiện ích.'], 403);
        }

        $amenity = Amenity::find($id);
        if (!$amenity) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy tiện ích.'], 404);
        }

        // Detach khỏi bảng trung gian trước khi xóa
        $amenity->posts()->detach();
        $amenity->delete();

        return response()->json(['status' => true, 'message' => 'Xóa tiện ích thành công.']);
    }

    // GET /api/admin/amenities (admin - lấy danh sách với posts_count và tìm kiếm)
    public function adminIndex(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Chỉ admin mới được truy cập.'], 403);
        }

        try {
            $q = $request->query('q', '');

            $query = Amenity::withCount('posts');

            if ($q) {
                $query->where(function($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%");
                });
            }

            $amenities = $query->orderBy('name')->get();

            return response()->json([
                'data' => $amenities->map(function($amenity) {
                    return [
                        'id' => $amenity->id,
                        'slug' => $amenity->slug,
                        'name' => $amenity->name,
                        'posts_count' => $amenity->posts_count ?? 0
                    ];
                })
            ], 200);
        } catch (Exception $e) {
            Log::error('Lỗi lấy danh sách tiện ích admin: ' . $e->getMessage());
            return response()->json(['status' => false, 'message' => 'Không thể lấy danh sách tiện ích.'], 500);
        }
    }
}
