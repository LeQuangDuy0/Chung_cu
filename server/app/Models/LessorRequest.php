<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessorRequest extends Model
{
    protected $table = 'lessor_requests';

    protected $fillable = [
        'user_id',
        'status',
        'rejection_reason',

        // Thông tin cá nhân
        'full_name',
        'email',
        'phone_number',
        'date_of_birth',

        // Ảnh CCCD
        'cccd_front_url',
        'cccd_back_url',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
