<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;

class TaskController extends Controller
{
    public function store(Request $request){
        $request->validate([
            'project_id' => 'required',
            'title' => 'required'
        ]);
        $task = Task::create([
            'project_id' => $request->project_id,
            'parent_id' => $request->parent_id, // optional
            'title' => $request->title,
            'description' => $request->description,
            'status' => 'todo'
        ]);
        return response()->json($task);
    }
    public function update(Request $request, $id){
        $task = Task::findOrFail($id);
        $task->update($request->only('title', 'description', 'status'));

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
}
