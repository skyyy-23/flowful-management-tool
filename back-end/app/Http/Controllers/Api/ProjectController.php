<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Project;

class ProjectController extends Controller
{
    public function store(Request $request){
        $request->validate([
            'organization_id' => 'required',
            'name' => 'required'
        ]);
        $project = Project::create([
            'organization_id' => $request->organization_id,
            'name' => $request->name,
            'description' => $request->description
        ]);
        return response()->json($project);
    }

    public function index(){
        return Project::all();
    }

    public function destroy($id){
        $project = Project::find($id);
        if(!$project){
            return response()->json([
                'message' => 'Project not found'
            ], 404);
        }
        $project->delete();
        return response()->json([
            'message' => 'Project deleted'
        ]);
    }
}
