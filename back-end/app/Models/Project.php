<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Task;

class Project extends Model
{
    protected $fillable=[
        'organization_id', 
        'name', 
        'description'
    ];

    public function organization(){
        return $this->belongsTo(Organization::class);
    }

    public function task(){
        return $this->tasks();
    }

    public function tasks(){
        return $this->hasMany(Task::class);
    }
}
