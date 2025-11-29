<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    protected $cloudinary;

    public function __construct(CloudinaryService $cloudinary)
    {
        $this->cloudinary = $cloudinary;
    }

    /* ============================================================
     *  USER THƯỜNG: PROFILE, AVATAR, ĐỔI MẬT KHẨU
     * ============================================================ */

    // GET /api/user/profile  (hoặc /api/user nếu bạn map route vậy)
    public function profile()
    {
        $user = Auth::user()->load('avatarFile');

        $avatar = $user->avatarFile ? $user->avatarFile->url : null;

        return response()->json([
            'status' => true,
            'data'   => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'phone_number' => $user->phone_number,
                'role'         => $user->role,
                'avatar_url'   => $avatar,
            ],
            // thêm cho tiện FE nào cần full
            'user'   => $user,
        ]);
    }

    // PUT /api/user/profile
    public function updateProfile(Request $request)
    {
        $user = Auth::user()->load('avatarFile');

        $request->validate([
            'name'         => 'nullable|string|max:255',
            'email'        => 'nullable|email|unique:users,email,' . $user->id,
            'phone_number' => 'nullable|regex:/^0[0-9]{9}$/|unique:users,phone_number,' . $user->id,
        ]);

        if ($request->filled('name')) {
            $user->name = $request->name;
        }
        if ($request->filled('email')) {
            $user->email = $request->email;
        }
        if ($request->filled('phone_number')) {
            $user->phone_number = $request->phone_number;
        }

        $user->save();
        $user->refresh()->load('avatarFile');

        $avatar = $user->avatarFile ? $user->avatarFile->url : null;

        return response()->json([
            'status'  => true,
            'message' => 'Cập nhật thông tin thành công.',
            'data'    => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'phone_number' => $user->phone_number,
                'role'         => $user->role,
                'avatar_url'   => $avatar,
            ],
            'user'    => $user,
        ]);
    }

    // POST /api/user/profile/avatar
    public function updateAvatar(Request $request)
    {
        $user = Auth::user()->load('avatarFile');

        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png|max:4096',
        ]);

        // Xóa avatar cũ nếu có
        if ($user->avatarFile) {
            $this->cloudinary->delete($user->avatarFile->public_id);
            $user->avatarFile->delete();
        }

        // Upload avatar mới lên Cloudinary
        $upload = $this->cloudinary->upload(
            $request->file('avatar')->getRealPath(),
            'user_avatars'
        );

        // Lưu bản ghi file
        $user->cloudinaryFiles()->create([
            'public_id' => $upload['public_id'],
            'url'       => $upload['secure_url'],
            'type'      => 'avatar',
        ]);

        // load lại để có avatarFile mới
        $user->refresh()->load('avatarFile');

        $avatar = $user->avatarFile ? $user->avatarFile->url : null;

        return response()->json([
            'status'      => true,
            'message'     => 'Cập nhật avatar thành công.',
            'avatar_url'  => $avatar,
            'user'        => $user,
        ]);
    }

    // PUT /api/user/change-password
    public function changePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'current_password'          => 'required',
            'new_password'              => 'required|min:6|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status'  => false,
                'message' => 'Mật khẩu hiện tại không chính xác.',
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'status'  => true,
            'message' => 'Đổi mật khẩu thành công.',
        ]);
    }

    /* ============================================================
     *  ADMIN: QUẢN LÝ USER & CẤP QUYỀN LESSOR
     * ============================================================ */

    // GET /api/admin/users
    public function adminIndex()
    {
        $admin = Auth::user();

        if (!$admin || $admin->role !== 'admin') {
            return response()->json([
                'status'  => false,
                'message' => 'Chỉ admin mới xem được danh sách người dùng.',
            ], 403);
        }

        $users = User::orderBy('created_at', 'desc')->get([
            'id',
            'name',
            'email',
            'phone_number',
            'role',
            'created_at',
        ]);

        return response()->json([
            'status' => true,
            'data'   => $users,
        ]);
    }

    // PUT /api/admin/users/{id}/role
    public function updateRole(Request $request, $id)
    {
        $admin = Auth::user();

        if (!$admin || $admin->role !== 'admin') {
            return response()->json([
                'status'  => false,
                'message' => 'Chỉ admin mới được đổi vai trò người dùng.',
            ], 403);
        }

        $request->validate([
            'role' => 'required|in:user,lessor,admin',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'Không tìm thấy người dùng.',
            ], 404);
        }

        // Không cho tự hạ quyền chính mình cho đỡ toang
        if ($user->id === $admin->id && $request->role !== 'admin') {
            return response()->json([
                'status'  => false,
                'message' => 'Không thể thay đổi vai trò của chính bạn.',
            ], 422);
        }

        $user->role = $request->role;
        $user->save();

        return response()->json([
            'status'  => true,
            'message' => 'Cập nhật vai trò thành công.',
            'data'    => $user,
        ]);
    }
}
