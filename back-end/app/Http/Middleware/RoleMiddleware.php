<?php

namespace App\Http\Middleware;

use App\Models\OrganizationMember;
use App\Models\Project;
use App\Models\Task;
use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $role)
    {
        $user = $request->user();
        $route = $request->route();
        $routeId = $route?->parameter('id');
        $routeUri = $route?->uri() ?? '';

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $orgId = $request->organization_id ?? $route?->parameter('organization_id');

        if (!$orgId && $routeId && str_contains($routeUri, 'organizations/')) {
            $orgId = $routeId;
        }

        $projectId = $request->project_id ?? $route?->parameter('project_id');

        if (!$projectId && $routeId && str_contains($routeUri, 'projects/')) {
            $projectId = $routeId;
        }

        if (!$orgId && $projectId) {
            $project = Project::find($projectId);

            if (!$project) {
                return response()->json([
                    'message' => 'Project not found'
                ], 404);
            }

            $orgId = $project->organization_id;
        }

        $taskId = $request->task_id ?? $route?->parameter('task_id');

        if (!$taskId && $routeId && str_contains($routeUri, 'tasks/')) {
            $taskId = $routeId;
        }

        if (!$orgId && $taskId) {
            $task = Task::find($taskId);

            if (!$task) {
                return response()->json([
                    'message' => 'Task not found'
                ], 404);
            }

            $project = Project::find($task->project_id);

            if (!$project) {
                return response()->json([
                    'message' => 'Project not found'
                ], 404);
            }

            $orgId = $project->organization_id;
        }

        if (!$orgId) {
            return response()->json([
                'message' => 'Organization context not found'
            ], 400);
        }

        $userRole = OrganizationMember::where('user_id', $user->id)
            ->where('organization_id', $orgId)
            ->value('role');

        if (!$userRole) {
            return response()->json([
                'message' => 'Not a member of this organization'
            ], 403);
        }

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
