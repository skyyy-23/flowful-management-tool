<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FlowfulApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_login_view_profile_and_logout(): void
    {
        $registerResponse = $this->postJson('/api/register', [
            'name' => 'Sarah Flow',
            'email' => 'sarah@example.com',
            'password' => 'secret123',
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonPath('user.name', 'Sarah Flow')
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token',
            ]);

        $token = $registerResponse->json('token');
        $tokenId = (int) explode('|', $token)[0];

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('email', 'sarah@example.com');

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged Out');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);

        app('auth')->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertUnauthorized();

        $this->postJson('/api/login', [
            'email' => 'sarah@example.com',
            'password' => 'secret123',
        ])->assertOk()
            ->assertJsonPath('user.name', 'Sarah Flow');
    }

    public function test_owner_can_invite_a_user_and_the_user_can_accept(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create([
            'email' => 'invitee@example.com',
        ]);

        Sanctum::actingAs($owner);

        $organizationResponse = $this->postJson('/api/organizations', [
            'name' => 'Grace Church',
        ])->assertCreated();

        $organizationId = $organizationResponse->json('id');

        $inviteResponse = $this->postJson("/api/organizations/{$organizationId}/invite", [
            'email' => $invitee->email,
            'role' => 'admin',
        ]);

        $inviteResponse
            ->assertCreated()
            ->assertJsonPath('invite.role', 'admin');

        $token = $inviteResponse->json('invite.token');

        $this->assertDatabaseHas('organization_invitations', [
            'organization_id' => $organizationId,
            'email' => $invitee->email,
            'role' => 'admin',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($invitee);

        $this->getJson("/api/invitations/{$token}/accept")
            ->assertOk()
            ->assertJsonPath('message', 'You have joined the organization');

        $this->assertDatabaseHas('organization_members', [
            'organization_id' => $organizationId,
            'user_id' => $invitee->id,
            'role' => 'admin',
        ]);

        $this->assertDatabaseHas('organization_invitations', [
            'token' => $token,
            'status' => 'accepted',
        ]);
    }

    public function test_owner_can_manage_projects_and_board_tasks(): void
    {
        $owner = User::factory()->create();

        Sanctum::actingAs($owner);

        $organizationId = $this->postJson('/api/organizations', [
            'name' => 'Grace Church',
        ])->assertCreated()->json('id');

        $this->getJson("/api/organizations/{$organizationId}")
            ->assertOk()
            ->assertJsonPath('members_count', 1);

        $projectId = $this->postJson('/api/projects', [
            'organization_id' => $organizationId,
            'name' => 'Youth Camp Planning',
            'description' => 'Plan the full event workflow.',
        ])->assertCreated()->json('id');

        $this->getJson('/api/projects?organization_id=' . $organizationId)
            ->assertOk()
            ->assertJsonPath('0.id', $projectId);

        $this->getJson("/api/projects/{$projectId}")
            ->assertOk()
            ->assertJsonPath('organization.name', 'Grace Church');

        $taskId = $this->postJson('/api/tasks', [
            'project_id' => $projectId,
            'title' => 'Plan Agenda',
            'description' => 'Outline the event flow.',
            'status' => 'todo',
        ])->assertCreated()->json('id');

        $this->postJson('/api/tasks', [
            'project_id' => $projectId,
            'parent_id' => $taskId,
            'title' => 'Prepare slide content',
            'status' => 'doing',
        ])->assertCreated();

        $this->patchJson("/api/tasks/{$taskId}", [
            'status' => 'doing',
        ])->assertOk()
            ->assertJsonPath('status', 'doing');

        $this->getJson("/api/projects/{$projectId}/tasks")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.subtasks.0.title', 'Prepare slide content');

        $this->getJson("/api/projects/{$projectId}/board")
            ->assertOk()
            ->assertJsonCount(0, 'todo')
            ->assertJsonCount(1, 'doing')
            ->assertJsonCount(0, 'done');

        $this->deleteJson("/api/projects/{$projectId}")
            ->assertOk()
            ->assertJsonPath('message', 'Project deleted');

        $this->assertDatabaseMissing('tasks', [
            'id' => $taskId,
        ]);
    }

    public function test_permissions_and_organization_cleanup_work_correctly(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        Sanctum::actingAs($owner);

        $organizationId = $this->postJson('/api/organizations', [
            'name' => 'Tech Team',
        ])->assertCreated()->json('id');

        $projectId = $this->postJson('/api/projects', [
            'organization_id' => $organizationId,
            'name' => 'Website Redesign',
        ])->assertCreated()->json('id');

        $taskId = $this->postJson('/api/tasks', [
            'project_id' => $projectId,
            'title' => 'Design Posters',
            'status' => 'todo',
        ])->assertCreated()->json('id');

        $this->postJson("/api/organizations/{$organizationId}/invite", [
            'email' => 'pending@example.com',
            'role' => 'member',
        ])->assertCreated();

        Sanctum::actingAs($outsider);

        $this->postJson('/api/projects', [
            'organization_id' => $organizationId,
            'name' => 'Unauthorized Project',
        ])->assertForbidden();

        $this->patchJson("/api/tasks/{$taskId}", [
            'status' => 'done',
        ])->assertForbidden();

        $this->getJson("/api/projects/{$projectId}/board")
            ->assertNotFound();

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/organizations/{$organizationId}")
            ->assertOk()
            ->assertJsonPath('message', 'Organization deleted successfully');

        $this->assertDatabaseMissing('organizations', [
            'id' => $organizationId,
        ]);
        $this->assertDatabaseMissing('projects', [
            'id' => $projectId,
        ]);
        $this->assertDatabaseMissing('tasks', [
            'id' => $taskId,
        ]);
        $this->assertDatabaseMissing('organization_invitations', [
            'organization_id' => $organizationId,
        ]);
        $this->assertDatabaseMissing('organization_members', [
            'organization_id' => $organizationId,
        ]);
    }
}
