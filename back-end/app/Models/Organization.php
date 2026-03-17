<?php

namespace App\Models;

use App\Models\OrganizationMember;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = ['name', 'created_by'];
    public function members(){
        return $this->hasMany(OrganizationMember::class);
    }
}
