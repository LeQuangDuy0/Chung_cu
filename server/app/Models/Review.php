<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $table = 'reviews';

       protected $fillable = [
           'post_id',
        'user_id',
        'parent_id',
        'rating',
        'content',
        'is_hidden',
    ];
 // Chủ review
    public function user() {
        return $this->belongsTo(User::class);
    }
    // Review gốc
    public function parent()
    {
        return $this->belongsTo(Review::class, 'parent_id');
    }
    public function post() {
        return $this->belongsTo(Post::class);
    }

    public function replies()
    {
        return $this->hasMany(ReviewReply::class)
                ->where('is_hidden', false)
            ->with( 'user')
            ->orderBy('created_at');
    }
 
   
     // ĐỆ QUY (reply lồng)
    public function childrenRecursive()
    {
        return $this->children()->with('childrenRecursive', 'user:id,name,avatar_url');
    }
}