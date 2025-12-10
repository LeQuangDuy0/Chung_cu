<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessor_requests', function (Blueprint $table) {

            // Thông tin bổ sung
            $table->string('full_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone_number')->nullable();
            $table->date('date_of_birth')->nullable();

            // Ảnh CCCD
            $table->string('cccd_front_url')->nullable();
            $table->string('cccd_back_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lessor_requests', function (Blueprint $table) {
            $table->dropColumn([
                'full_name',
                'email',
                'phone_number',
                'date_of_birth',
                'cccd_front_url',
                'cccd_back_url'
            ]);
        });
    }
};
