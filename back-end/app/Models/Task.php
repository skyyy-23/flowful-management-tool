<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Project;
use App\Models\User;

class Task extends Model
{
    protected $fillable =[
        'project_id',
        'parent_id',
        'title',
        'description',
        'status',
        'assigned_to'
    ];

    public function subtasks(){
        return $this->hasMany(Task::class, 'parent_id');
    }
    public function parent(){
        return $this->belongsTo(Task::class, 'parent_id');
    }
    public function project(){
        return $this->belongsTo(Project::class);
    }

    public function assignee(){
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
