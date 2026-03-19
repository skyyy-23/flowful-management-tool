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
    public function task(){
        return $this->hasMany(Task::class);
    }
}
