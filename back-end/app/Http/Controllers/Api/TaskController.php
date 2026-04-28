<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrganizationMember;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'parent_id' => 'nullable|exists:tasks,id',
            'title' => 'required',
            'description' => 'nullable',
            'status' => 'nullable|in:todo,doing,done',
            'assigned_to' => 'nullable|exists:users,id'
        ]);

        $project = Project::findOrFail($validated['project_id']);

        if (!empty($validated['assigned_to'])) {
            $isMember = OrganizationMember::where('user_id', $validated['assigned_to'])
                ->where('organization_id', $project->organization_id)
                ->exists();

            if (!$isMember) {
                return response()->json([
                    'message' => 'User is not part of this organization'
                ], 403);
            }
        }

        $task = Task::create($validated);

        return response()->json($task->load(['assignee', 'subtasks']), 201);
    }

    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required',
            'description' => 'nullable',
            'status' => 'sometimes|in:todo,doing,done',
            'assigned_to' => 'nullable|exists:users,id'
        ]);

        $project = Project::findOrFail($task->project_id);

        if (!empty($validated['assigned_to'])) {
            $isMember = OrganizationMember::where('user_id', $validated['assigned_to'])
                ->where('organization_id', $project->organization_id)
                ->exists();

            if (!$isMember) {
                return response()->json([
                    'message' => 'User is not part of this organization'
                ], 403);
            }
        }

        $task->update($validated);

        return response()->json($task->load(['assignee', 'subtasks']));
    }

    public function getByProject($id)
    {
        $project = $this->getAccessibleProject($id);

        $tasks = Task::where('project_id', $project->id)
            ->whereNull('parent_id')
            ->with(['subtasks', 'assignee'])
            ->latest()
            ->get();

        return response()->json($tasks);
    }

    public function board($id)
    {
        $project = $this->getAccessibleProject($id);

        $tasks = Task::where('project_id', $project->id)
            ->whereNull('parent_id')
            ->with(['assignee', 'subtasks'])
            ->get();

        return response()->json([
            'todo' => $tasks->where('status', 'todo')->values(),
            'doing' => $tasks->where('status', 'doing')->values(),
            'done' => $tasks->where('status', 'done')->values(),
        ]);
    }

    public function destroy($id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json([
                'message' => 'Task not found'
            ], 404);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task deleted'
        ]);
    }

    private function getAccessibleProject($projectId): Project
    {
        return Project::whereHas('organization.members', function ($query) {
            $query->where('user_id', auth()->id());
        })->findOrFail($projectId);
    }
}
