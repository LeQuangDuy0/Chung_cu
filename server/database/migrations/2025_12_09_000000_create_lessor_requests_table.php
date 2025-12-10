<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('lessor_requests', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

        // Trạng thái
        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->text('rejection_reason')->nullable();

        // Thông tin yêu cầu
        $table->string('full_name');
        $table->string('email')->nullable();
        $table->string('phone_number');
        $table->date('date_of_birth');

        // Ảnh CCCD
        $table->string('cccd_front_url');
        $table->string('cccd_back_url');

        $table->timestamps();

        $table->index('user_id');
        $table->index('status');
    });
}


    public function down(): void
    {
        Schema::dropIfExists('lessor_requests');
    }
};
