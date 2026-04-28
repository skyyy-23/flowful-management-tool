<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function store(Request $request){
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'name' => 'required'
        ]);
        $project = Project::create([
            'organization_id' => $validated['organization_id'],
            'name' => $validated['name'],
            'description' => $request->description
        ]);
        return response()->json($project, 201);
    }

    public function index(Request $request){
        return Project::whereHas('organization.members', function ($query) {
            $query->where('user_id', auth()->id());
        })
        ->when($request->organization_id, function ($query, $organizationId) {
            $query->where('organization_id', $organizationId);
        })
        ->withCount('tasks')
        ->latest()
        ->get();
    }

    public function show($id){
        $project = Project::whereHas('organization.members', function ($query) {
            $query->where('user_id', auth()->id());
        })
        ->withCount('tasks')
        ->with('organization:id,name')
        ->findOrFail($id);

        return response()->json($project);
    }

    public function destroy($id){
        $project = Project::find($id);
        if(!$project){
            return response()->json([
                'message' => 'Project not found'
            ], 404);
        }

        Task::where('project_id', $project->id)->delete();
        $project->delete();
        return response()->json([
            'message' => 'Project deleted'
        ]);
    }
}
