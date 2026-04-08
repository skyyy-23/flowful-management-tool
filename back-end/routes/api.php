<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// Public routes

Route::get('/', function () {
    return response()->json([
        'message' => 'Flowful API is working'
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


// Private routes

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Organizations
    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::post('/organizations', [OrganizationController::class, 'store']);
    Route::get('/organizations/{id}', [OrganizationController::class, 'show']);
    Route::delete('/organizations/{id}', [OrganizationController::class, 'destroy'])
    ->middleware('role:owner');
    Route::post('/organizations/{id}/invite', [OrganizationController::class, 'invite'])
    ->middleware('role:admin');
    Route::get('/invitations/{token}/accept', [OrganizationController::class, 'acceptInvite']);

    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store'])
    ->middleware('role:admin');
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy'])
    ->middleware('role:admin');

    // Tasks
    Route::post('/tasks', [TaskController::class, 'store'])
    ->middleware('role:member');
    Route::patch('/tasks/{id}', [TaskController::class, 'update'])
    ->middleware('role:member');
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy'])
    ->middleware('role:member');
    Route::get('/projects/{id}/tasks', [TaskController::class, 'getByProject']);
    Route::get('/projects/{id}/board', [TaskController::class, 'board']);
});