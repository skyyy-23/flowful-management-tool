<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationInvitation extends Model
{
    protected $fillable = [
        'organization_id',
        'email',
        'token',
        'role',
        'status'
    ];
}
