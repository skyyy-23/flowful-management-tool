<?php

namespace App\Http\Controllers\Api;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMember;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
    
    public function invite(Request $request, $id){
        try{
            $request->validate([
            'email' => 'required|email'
        ]);
        
        $token = Str::random(40);

        $invite = OrganizationInvitation::create([
            'organization_id' => $id,
            'email' => $request->email,
            'token' => $token,
            'role' => 'member'
        ]);
        return response()->json([
            'message' => 'Invitation Sent',
            'invite_link' => url("/accept-invite/$token") // for front-end later
        ]);
        }catch(\Exception $e){
            return response()->json([
                'message' => 'something went wrong',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function acceptInvite($token, Request $request){
        $invite = OrganizationInvitation::where('token', $token)->first();
        
        if (!$invite) {
            return response()->json([
                'message' => 'Invalid invitation'
            ], 404);
        }
        if ($invite->status === 'accepted') {
            return response()->json([
                'message' => 'Invitation already accepted'
            ], 400);
        }
        
        // Guardrails, logged-in user email matches invite
        if ($request->user()->email !== $invite->email) {
            return response()->json([
                'message' => 'This invitation is not for you'
            ], 403);
        }
        
        // Add to organization_members
        OrganizationMember::create([
            'organization_id' => $invite->organization_id,
            'user_id' => $request->user()->id,
            'role' => $invite->role
        ]);
        
        // Mark invite as accepted
        $invite->update([
            'status' => 'accepted'
        ]);
        return response()->json([
            'message' => 'You have joined the organization'
        ]);
    }
}
    



