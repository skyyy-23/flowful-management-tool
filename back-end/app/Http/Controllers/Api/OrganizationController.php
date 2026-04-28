<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMember;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function index()
    {
        $organizations = Organization::whereHas('members', function ($query) {
            $query->where('user_id', auth()->id());
        })
        ->withCount(['members', 'projects'])
        ->orderBy('name')
        ->get();

        return response()->json($organizations);
    }

    public function show($id)
    {
        $organization = Organization::whereHas('members', function ($query) {
            $query->where('user_id', auth()->id());
        })
        ->withCount(['members', 'projects'])
        ->with(['members.user:id,name,email'])
        ->findOrFail($id);

        return response()->json($organization);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required'
        ]);

        $organization = Organization::create([
            'name' => $validated['name'],
            'created_by' => auth()->id()
        ]);

        OrganizationMember::create([
            'organization_id' => $organization->id,
            'user_id' => auth()->id(),
            'role' => 'owner'
        ]);

        return response()->json($organization, 201);
    }

    public function invite(Request $request, $id)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'nullable|in:owner,admin,member'
        ]);

        Organization::whereHas('members', function ($query) {
            $query->where('user_id', auth()->id());
        })->findOrFail($id);

        $token = Str::random(40);

        $invite = OrganizationInvitation::create([
            'organization_id' => $id,
            'email' => $validated['email'],
            'token' => $token,
            'role' => $validated['role'] ?? 'member'
        ]);

        return response()->json([
            'message' => 'Invitation Sent',
            'invite' => $invite,
            'invite_link' => url("/api/invitations/$token/accept")
        ], 201);
    }

    public function acceptInvite($token, Request $request)
    {
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

        if ($request->user()->email !== $invite->email) {
            return response()->json([
                'message' => 'This invitation is not for you'
            ], 403);
        }

        OrganizationMember::firstOrCreate([
            'organization_id' => $invite->organization_id,
            'user_id' => $request->user()->id
        ], [
            'role' => $invite->role
        ]);

        $invite->update([
            'status' => 'accepted'
        ]);

        return response()->json([
            'message' => 'You have joined the organization'
        ]);
    }

    public function destroy($id, Request $request)
    {
        $organization = Organization::find($id);

        if (!$organization) {
            return response()->json([
                'message' => 'Organization not found'
            ], 404);
        }

        $projectIds = $organization->projects()->pluck('id');

        Task::whereIn('project_id', $projectIds)->delete();
        $organization->projects()->delete();
        $organization->members()->delete();
        OrganizationInvitation::where('organization_id', $organization->id)->delete();
        $organization->delete();

        return response()->json([
            'message' => 'Organization deleted successfully'
        ]);
    }
}
