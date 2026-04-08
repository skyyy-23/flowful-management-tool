<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\OrganizationMember;
use App\Models\Project;
use App\Models\Task;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $role)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Try to get organization_id directly
        $orgId = $request->organization_id 
            ?? $request->route('organization_id') 
            ?? $request->route('id');

        // If still no orgId, resolve from project
        if (!$orgId && $request->route('project_id')) {
            $project = Project::find($request->route('project_id'));
            if ($project) {
                $orgId = $project->organization_id;
            }
        }

        // Resolve from task → project → organization
        if (!$orgId && $request->route('id')) {
            $task = Task::find($request->route('id'));
            if ($task) {
                $project = Project::find($task->project_id);
                if ($project) {
                    $orgId = $project->organization_id;
                }
            }
        }

        if (!$orgId) {
            return response()->json([
                'message' => 'Organization context not found'
            ], 400);
        }

        // Get user role
        $userRole = OrganizationMember::where('user_id', $user->id)
            ->where('organization_id', $orgId)
            ->value('role');

        if (!$userRole) {
            return response()->json([
                'message' => 'Not a member of this organization'
            ], 403);
        }

        // Role hierarchy
        $roles = [
            'owner' => 3,
            'admin' => 2,
            'member' => 1
        ];

        if (!isset($roles[$role])) {
            return response()->json([
                'message' => 'Invalid role requirement'
            ], 500);
        }

        if ($roles[$userRole] < $roles[$role]) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return $next($request);
    }
}