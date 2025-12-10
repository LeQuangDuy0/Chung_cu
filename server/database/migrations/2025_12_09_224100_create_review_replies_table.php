<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
  Schema::create('review_replies', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('review_id'); 
    $table->unsignedBigInteger('user_id');
    $table->unsignedBigInteger('parent_id')->nullable(); // THÊM DÒNG NÀY

    $table->text('content');
    $table->timestamps();

    $table->foreign('review_id')->references('id')->on('reviews')->onDelete('cascade');
    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
});

}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_replies');
    }
};
