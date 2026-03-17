<?php

namespace App\Http\Controllers\Api;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{   
    public function index(){
        $orgs = Organization::whereHas('members', function ($q) {
            $q->where('user_id', auth()->id());
        })->get();
    
        return response()->json($orgs);
    }

    public function store(Request $request){
        $request->validate([
            'name' => 'required'
        ]);
        try {
            $org = Organization::create([
                'name' => $request->name,
                'created_by' => auth()->id()
            ]);

            OrganizationMember::create([
                'organization_id' => $org->id,
                'user_id' => auth()->id(),
                'role' => 'owner'
            ]);

            return response()->json($org);

        }catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }    
}



