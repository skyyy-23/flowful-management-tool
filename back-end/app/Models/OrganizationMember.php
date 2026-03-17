<?php

namespace App\Models;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class OrganizationMember extends Model
{
    protected $fillable = ['organization_id', 'user_id', 'role'];
    public function organization(){
        return $this->belongsTo(Organization::class);
    }
    public function user(){
        return $this->belongsTo(User::class);
    }
}
