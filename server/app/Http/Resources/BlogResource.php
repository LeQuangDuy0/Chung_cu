<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // lấy ảnh blog mới nhất (cover)
        $cover = $this->images
            ->where('type', 'blog_image')
            ->sortByDesc('id')
            ->first();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'created_at' => $this->published_at ?? $this->created_at,

            // ===== CLOUDINARY IMAGE =====
            'cover_image_url' => $cover?->url,

            // DEBUG (tạm thời – có thể xoá sau)
            'debug_images_count' => $this->images->count(),
        ];
    }
}
