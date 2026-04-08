<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\OrganizationMember;
use App\Models\Project;

class TaskController extends Controller
{
    public function store(Request $request){
        $request->validate([
            'project_id' => 'required',
            'title' => 'required',
            'assigned_to' => 'nullable|exists:users,id'
        ]);

        $project = Project::findOrFail($request->project_id);

        if ($request->assigned_to) {
            $isMember = OrganizationMember::where('user_id', $request->assigned_to)
                        ->where('organization_id', $project->organization_id)
                        ->exists();

            if (!$isMember) {
                return response()->json([
                    'message' => 'User is not part of this organization'
                ], 403);
            }
        }

        $task = Task::create($request->all());

        return response()->json($task);
    }
    public function update(Request $request, $id){
        $task = Task::findOrFail($id);
        
        $request->validate([
            'title' => 'sometimes|required',
            'description' => 'nullable',
            'status' => 'sometimes|in:todo,doing,done',
            'assigned_to' => 'nullable|exists:user,id'
        ]);

        $project = Project::findOrFail($task->project_id);
        
        if($request->assigned_to){
            $isMember = OrganizationMember::where('user_id', $request->assigned_to)
                        ->where('organization_id', $project->organization_id)
                        ->exists();

            if (!$isMember) {
                return response()->json([
                    'message' => 'User is not part of this organization'
                ], 403);
            }
        }

        $task->update($request->only(['title', 'description', 'status', 'assigned_to']));

        return response()->json($task);
    }

    public function getByProject($id){
        try{
            $tasks = Task::where('project_id', $id)
                    ->whereNull('parent_id') // only main tasks
                    ->with('subtasks') // load children
                    ->get();

            return response()->json($tasks);
        }catch(\Exception $e){
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        } 
    }
    
    public function board($id){
        $tasks = Task::where('project_id', $id)
                ->with('assignee')
                ->get();

        return response()->json([
            'todo' => $tasks->where('status', 'todo')->values(),
            'doing' => $tasks->where('status', 'doing')->values(),
            'done' => $tasks->where('status', 'done')->values(),
        ]);
    }

    public function destroy($id){
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
}
