import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import Sidebar from "../components/Sidebar";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCircleIcon,
  CircleIcon,
  PlusIcon,
  SparkIcon,
  TeamIcon,
} from "../components/FlowfulIcons";
import { useAuth } from "../context/auth-context";

const ORGANIZATION_STORAGE_KEY = "flowful_active_organization";
const PROJECT_STORAGE_KEY = "flowful_active_project";
const EMPTY_BOARD = {
  todo: [],
  doing: [],
  done: [],
};

const BOARD_CONFIG = {
  todo: {
    badge: "Seed",
    label: "To Do",
    addLabel: "Add Task",
    emptyMessage: "No tasks are waiting here yet.",
    nextStatus: "doing",
    actionLabel: "Start",
  },
  doing: {
    badge: "Growing",
    label: "In Progress",
    addLabel: "Add Task",
    emptyMessage: "Move work here once the team starts executing.",
    nextStatus: "done",
    actionLabel: "Complete",
  },
  done: {
    badge: "Fruitful",
    label: "Done",
    addLabel: "Add Task",
    emptyMessage: "Completed work will gather here.",
    nextStatus: "todo",
    actionLabel: "Reopen",
  },
};

const INITIAL_MODAL_STATE = {
  type: null,
  status: "todo",
};

export default function Dashboard() {
  const { isLoading, logout, refreshUser, user } = useAuth();
  const [initialSelection] = useState(() => ({
    organizationId: readStoredId(ORGANIZATION_STORAGE_KEY),
    projectId: readStoredId(PROJECT_STORAGE_KEY),
  }));
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [projectTasks, setProjectTasks] = useState([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState(
    initialSelection.organizationId
  );
  const [activeProjectId, setActiveProjectId] = useState(initialSelection.projectId);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [spotlightSectionId, setSpotlightSectionId] = useState("");
  const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);
  const [organizationForm, setOrganizationForm] = useState({ name: "" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo",
  });

  useEffect(() => {
    let isActive = true;

    const initializeWorkspace = async () => {
      await loadWorkspace({
        isActive,
        setActiveOrganizationId,
        setActiveProjectId,
        setBoard,
        setFeedbackMessage,
        setIsBoardLoading,
        setIsWorkspaceLoading,
        setOrganizations,
        setProjects,
        setProjectTasks,
        setWorkspaceError,
        preferredOrganizationId: initialSelection.organizationId,
        preferredProjectId: initialSelection.projectId,
      });
    };

    initializeWorkspace();

    return () => {
      isActive = false;
    };
  }, [initialSelection]);

  useEffect(() => {
    persistSelection(ORGANIZATION_STORAGE_KEY, activeOrganizationId);
  }, [activeOrganizationId]);

  useEffect(() => {
    persistSelection(PROJECT_STORAGE_KEY, activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (!spotlightSectionId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSpotlightSectionId("");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [spotlightSectionId]);

  if (isLoading || !user) {
    return <PageLoader message="Loading your Flowful workspace..." />;
  }

  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) || null;
  const organizationProjects = activeOrganization
    ? projects.filter((project) => project.organization_id === activeOrganization.id)
    : [];
  const activeProject =
    organizationProjects.find((project) => project.id === activeProjectId) || null;
  const boardTasks = [...board.todo, ...board.doing, ...board.done];
  const completedThisWeek = board.done.filter((task) =>
    isWithinDays(task.updated_at || task.created_at, 7)
  ).length;
  const dueSoonCount = board.todo.length + board.doing.length;
  const productivityPercent = boardTasks.length
    ? Math.round((board.done.length / boardTasks.length) * 100)
    : 0;
  const recentActivity = buildRecentActivity({
    organization: activeOrganization,
    projects: organizationProjects,
    tasks: projectTasks,
    user,
  });
  const notificationCount = recentActivity.length;
  const topOrganizations = organizations.slice(0, 4);

  const spotlightSection = (sectionId) => {
    setSpotlightSectionId(sectionId);

    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    window.requestAnimationFrame(() => {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleSelectOrganization = async (organizationId, options = {}) => {
    const selectedOrganization = organizations.find(
      (organization) => organization.id === organizationId
    );
    const selectedProjects = projects.filter(
      (project) => project.organization_id === organizationId
    );
    const nextProjectId = selectedProjects[0]?.id ?? null;
    const successMessage =
      options.successMessage ||
      (selectedOrganization
        ? `Viewing ${selectedOrganization.name}.`
        : "Organization updated.");

    setActiveOrganizationId(organizationId);
    setActiveProjectId(nextProjectId);

    await loadProjectBoard({
      isActive: true,
      projectId: nextProjectId,
      setBoard,
      setFeedbackMessage,
      setIsBoardLoading,
      setProjectTasks,
      successMessage,
      setWorkspaceError,
    });

    if (options.focusSectionId) {
      spotlightSection(options.focusSectionId);
    }
  };

  const handleSelectProject = async (projectId, options = {}) => {
    const selectedProject = projects.find((project) => project.id === projectId);
    const successMessage =
      options.successMessage ||
      (selectedProject ? `Viewing ${selectedProject.name}.` : "Project updated.");

    if (selectedProject?.organization_id && selectedProject.organization_id !== activeOrganizationId) {
      setActiveOrganizationId(selectedProject.organization_id);
    }
    setActiveProjectId(projectId);

    await loadProjectBoard({
      isActive: true,
      projectId,
      setBoard,
      setFeedbackMessage,
      setIsBoardLoading,
      setProjectTasks,
      successMessage,
      setWorkspaceError,
    });

    if (options.focusSectionId) {
      spotlightSection(options.focusSectionId);
    }
  };

  const handleViewOrganization = async (organizationId) => {
    const selectedOrganization = organizations.find(
      (organization) => organization.id === organizationId
    );
    const selectedProjects = projects.filter(
      (project) => project.organization_id === organizationId
    );

    await handleSelectOrganization(organizationId, {
      focusSectionId: "projects-section",
      successMessage: selectedProjects.length
        ? `Viewing ${selectedOrganization?.name}. Projects for this organization are shown below.`
        : `Viewing ${selectedOrganization?.name}. Create a project below to get started.`,
    });
  };

  const handleViewProject = async (projectId) => {
    const selectedProject = projects.find((project) => project.id === projectId);

    await handleSelectProject(projectId, {
      focusSectionId: "board-section",
      successMessage: selectedProject
        ? `Viewing ${selectedProject.name}. Its task board is highlighted below.`
        : "Project updated.",
    });
  };

  const openModal = (type, status = "todo") => {
    setWorkspaceError("");
    setModalState({ type, status });

    if (type === "task") {
      setTaskForm({
        title: "",
        description: "",
        status,
      });
    }
  };

  const closeModal = () => {
    setModalState(INITIAL_MODAL_STATE);
  };

  const handleOrganizationSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setWorkspaceError("");

    try {
      const response = await api.post("/organizations", organizationForm);

      closeModal();
      setOrganizationForm({ name: "" });
      setFeedbackMessage("Organization created successfully.");

      await loadWorkspace({
        isActive: true,
        setActiveOrganizationId,
        setActiveProjectId,
        setBoard,
        setFeedbackMessage,
        setIsBoardLoading,
        setIsWorkspaceLoading,
        setOrganizations,
        setProjects,
        setProjectTasks,
        setWorkspaceError,
        preferredOrganizationId: response.data.id,
        preferredProjectId: null,
      });
    } catch (error) {
      setWorkspaceError(
        error.response?.data?.message || error.response?.data?.error || "Unable to create organization."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();

    if (!activeOrganization) {
      setWorkspaceError("Create or select an organization before adding a project.");
      return;
    }

    setIsSaving(true);
    setWorkspaceError("");

    try {
      const response = await api.post("/projects", {
        organization_id: activeOrganization.id,
        name: projectForm.name,
        description: projectForm.description,
      });

      closeModal();
      setProjectForm({ name: "", description: "" });
      setFeedbackMessage("Project created successfully.");

      await loadWorkspace({
        isActive: true,
        setActiveOrganizationId,
        setActiveProjectId,
        setBoard,
        setFeedbackMessage,
        setIsBoardLoading,
        setIsWorkspaceLoading,
        setOrganizations,
        setProjects,
        setProjectTasks,
        setWorkspaceError,
        preferredOrganizationId: activeOrganization.id,
        preferredProjectId: response.data.id,
      });
    } catch (error) {
      setWorkspaceError(
        error.response?.data?.message || error.response?.data?.error || "Unable to create project."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();

    if (!activeProject) {
      setWorkspaceError("Select a project before creating tasks.");
      return;
    }

    setIsSaving(true);
    setWorkspaceError("");

    try {
      await api.post("/tasks", {
        project_id: activeProject.id,
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
      });

      closeModal();
      setFeedbackMessage("Task added to the board.");

      await loadProjectBoard({
        isActive: true,
        projectId: activeProject.id,
        setBoard,
        setFeedbackMessage,
        setIsBoardLoading,
        setProjectTasks,
        setWorkspaceError,
      });
    } catch (error) {
      setWorkspaceError(
        error.response?.data?.message || error.response?.data?.error || "Unable to create task."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdvanceTask = async (task, nextStatus) => {
    setMovingTaskId(task.id);
    setWorkspaceError("");

    try {
      await api.patch(`/tasks/${task.id}`, { status: nextStatus });
      setFeedbackMessage(`"${task.title}" moved to ${BOARD_CONFIG[nextStatus].label}.`);

      await loadProjectBoard({
        isActive: true,
        projectId: activeProjectId,
        setBoard,
        setFeedbackMessage,
        setIsBoardLoading,
        setProjectTasks,
        setWorkspaceError,
      });
    } catch (error) {
      setWorkspaceError(
        error.response?.data?.message || error.response?.data?.error || "Unable to update task."
      );
    } finally {
      setMovingTaskId(null);
    }
  };

  return (
    <div className="dashboard-page" id="dashboard">
      <Sidebar
        activeOrganizationId={activeOrganizationId}
        onCreateOrganization={() => openModal("organization")}
        onSelectOrganization={handleSelectOrganization}
        organizations={organizations}
      />

      <div className="dashboard-main">
        <Navbar
          notificationCount={notificationCount}
          onLogout={logout}
          onRefresh={refreshUser}
          user={user}
        />

        {(workspaceError || feedbackMessage) && (
          <div className="dashboard-alert-stack">
            {workspaceError ? (
              <div className="dashboard-alert dashboard-alert--error">{workspaceError}</div>
            ) : null}

            {feedbackMessage ? (
              <div className="dashboard-alert dashboard-alert--success">{feedbackMessage}</div>
            ) : null}
          </div>
        )}

        {isWorkspaceLoading ? (
          <PageLoader message="Loading organizations, projects, and board data..." />
        ) : (
          <main className="dashboard-content">
            <section
              className={`dashboard-section ${
                spotlightSectionId === "organizations-section"
                  ? "dashboard-section--spotlight"
                  : ""
              }`}
              id="organizations-section"
            >
              <div className="dashboard-section__header">
                <h2>Your Organizations</h2>
              </div>

              {topOrganizations.length ? (
                <div className="organization-grid">
                  {topOrganizations.map((organization, index) => (
                    <article
                      className={`organization-card ${
                        organization.id === activeOrganizationId
                          ? "organization-card--active"
                          : ""
                      }`}
                      key={organization.id}
                    >
                      <div className="organization-card__identity">
                        <div className="organization-card__icon">
                          {index % 2 === 0 ? (
                            <BuildingIcon className="organization-card__icon-svg" />
                          ) : (
                            <TeamIcon className="organization-card__icon-svg" />
                          )}
                        </div>

                        <div>
                          <h3>{organization.name}</h3>
                          <p>{formatMembersLabel(organization.members_count)}</p>
                        </div>
                      </div>

                      <div className="organization-card__footer">
                        <span>{`${organization.projects_count ?? 0} project${
                          organization.projects_count === 1 ? "" : "s"
                        }`}</span>
                        <button
                          className="button button--compact"
                          onClick={() => handleViewOrganization(organization.id)}
                          type="button"
                        >
                          View Projects
                          <ArrowRightIcon className="button__icon" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  actionLabel="Create your first organization"
                  description="Your workspace starts here. Add an organization to unlock projects, insights, and the task board."
                  onAction={() => openModal("organization")}
                  title="No organizations yet"
                />
              )}
            </section>

            <section className="dashboard-panel-grid">
              <div className="dashboard-panel-grid__main">
                <section
                  className={`dashboard-section ${
                    spotlightSectionId === "projects-section"
                      ? "dashboard-section--spotlight"
                      : ""
                  }`}
                  id="projects-section"
                >
                  <div className="dashboard-section__header">
                    <h2>
                      {activeOrganization
                        ? `Projects in ${activeOrganization.name}`
                        : "Projects"}
                    </h2>

                    <button
                      className="button button--primary button--compact"
                      disabled={!activeOrganization}
                      onClick={() => openModal("project")}
                      type="button"
                    >
                      <PlusIcon className="button__icon" />
                      Create Project
                    </button>
                  </div>

                  {organizationProjects.length ? (
                    <div className="project-grid">
                      {organizationProjects.map((project) => (
                        <article
                          className={`project-card ${
                            project.id === activeProjectId ? "project-card--active" : ""
                          }`}
                          key={project.id}
                        >
                          <div className="project-card__body">
                            <h3>{project.name}</h3>
                            <p>{activeOrganization?.name || "Organization"}</p>
                          </div>

                          <div className="project-card__footer">
                            <span>{`${project.tasks_count ?? 0} task${
                              project.tasks_count === 1 ? "" : "s"
                            }`}</span>
                            <button
                              className="button button--compact"
                              onClick={() => handleViewProject(project.id)}
                              type="button"
                            >
                              Open Board
                              <ArrowRightIcon className="button__icon" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      actionLabel={activeOrganization ? "Create a project" : "Choose an organization"}
                      description={
                        activeOrganization
                          ? "Projects group the work shown in the board below. Create one to keep tasks organized."
                          : "Select or create an organization to begin adding projects."
                      }
                      onAction={
                        activeOrganization ? () => openModal("project") : () => openModal("organization")
                      }
                      title="No projects available"
                    />
                  )}
                </section>

                <section className="dashboard-section" id="insights-section">
                  <div className="dashboard-section__header">
                    <h2>Flow Insights</h2>
                  </div>

                  <div className="insight-grid">
                    <InsightCard
                      detail="This week"
                      icon={<SparkIcon className="insight-card__icon" />}
                      title="Tasks Completed"
                      value={completedThisWeek}
                    />
                    <InsightCard
                      detail="Need attention"
                      icon={<ArrowRightIcon className="insight-card__icon" />}
                      title="Upcoming Focus"
                      value={dueSoonCount}
                    />
                    <InsightCard
                      detail="Current team pace"
                      icon={<CheckCircleIcon className="insight-card__icon" />}
                      progress={productivityPercent}
                      title="Team Productivity"
                      value={`${productivityPercent}%`}
                    />
                  </div>
                </section>
              </div>

              <aside className="activity-panel" id="activity-panel">
                <div className="activity-panel__header">
                  <h2>Recent Activity</h2>
                </div>

                {recentActivity.length ? (
                  <div className="activity-list">
                    {recentActivity.map((item) => (
                      <article className="activity-item" key={item.id}>
                        <div className="activity-item__avatar">{getInitials(item.actor)}</div>
                        <div className="activity-item__copy">
                          <p>
                            <strong>{item.actor}</strong> {item.message}
                          </p>
                          <span>{item.timeLabel}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="activity-panel__empty">
                    Activity updates will appear as soon as projects and tasks start moving.
                  </p>
                )}
              </aside>
            </section>

            <section
              className={`dashboard-section ${
                spotlightSectionId === "board-section"
                  ? "dashboard-section--spotlight"
                  : ""
              }`}
              id="board-section"
            >
              <div className="dashboard-section__header">
                <h2>{activeProject ? `${activeProject.name} Board` : "Project Board"}</h2>
              </div>

              {activeProject ? (
                <div className="board-grid">
                  {Object.entries(BOARD_CONFIG).map(([statusKey, config]) => (
                    <BoardColumn
                      actioningTaskId={movingTaskId}
                      config={config}
                      isLoading={isBoardLoading}
                      key={statusKey}
                      onAddTask={() => openModal("task", statusKey)}
                      onAdvanceTask={handleAdvanceTask}
                      statusKey={statusKey}
                      tasks={board[statusKey] || []}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  actionLabel={activeOrganization ? "Create a project" : "Create an organization"}
                  description="Choose a project to populate the task lanes shown in your mockup-inspired board."
                  onAction={
                    activeOrganization ? () => openModal("project") : () => openModal("organization")
                  }
                  title="No active project selected"
                />
              )}
            </section>
          </main>
        )}
      </div>

      {modalState.type === "organization" ? (
        <ModalCard
          description="Create a workspace container for teams, members, and projects."
          onClose={closeModal}
          title="New Organization"
        >
          <form className="dashboard-form" onSubmit={handleOrganizationSubmit}>
            <label className="field">
              <span>Organization name</span>
              <input
                className="field__input"
                name="name"
                onChange={(event) =>
                  setOrganizationForm({ name: event.target.value })
                }
                placeholder="Grace Church"
                type="text"
                value={organizationForm.name}
              />
            </label>

            <div className="modal-actions">
              <button className="button button--secondary" onClick={closeModal} type="button">
                Cancel
              </button>
              <button className="button button--primary" disabled={isSaving} type="submit">
                {isSaving ? "Creating..." : "Create Organization"}
              </button>
            </div>
          </form>
        </ModalCard>
      ) : null}

      {modalState.type === "project" ? (
        <ModalCard
          description="Add a project under the selected organization to organize board work."
          onClose={closeModal}
          title="Create Project"
        >
          <form className="dashboard-form" onSubmit={handleProjectSubmit}>
            <label className="field">
              <span>Project name</span>
              <input
                className="field__input"
                name="name"
                onChange={(event) =>
                  setProjectForm((currentForm) => ({
                    ...currentForm,
                    name: event.target.value,
                  }))
                }
                placeholder="Youth Camp Planning"
                type="text"
                value={projectForm.name}
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                className="field__input field__input--textarea"
                name="description"
                onChange={(event) =>
                  setProjectForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                placeholder="Outline the milestones, tasks, and delivery goals for this project."
                rows="4"
                value={projectForm.description}
              />
            </label>

            <div className="modal-actions">
              <button className="button button--secondary" onClick={closeModal} type="button">
                Cancel
              </button>
              <button className="button button--primary" disabled={isSaving} type="submit">
                {isSaving ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </ModalCard>
      ) : null}

      {modalState.type === "task" ? (
        <ModalCard
          description="Add a new card directly into the selected project lane."
          onClose={closeModal}
          title={`Add Task to ${BOARD_CONFIG[modalState.status].label}`}
        >
          <form className="dashboard-form" onSubmit={handleTaskSubmit}>
            <label className="field">
              <span>Task title</span>
              <input
                className="field__input"
                name="title"
                onChange={(event) =>
                  setTaskForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value,
                  }))
                }
                placeholder="Design Posters"
                type="text"
                value={taskForm.title}
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                className="field__input field__input--textarea"
                name="description"
                onChange={(event) =>
                  setTaskForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                placeholder="Add any context the team should see on the board."
                rows="4"
                value={taskForm.description}
              />
            </label>

            <div className="modal-actions">
              <button className="button button--secondary" onClick={closeModal} type="button">
                Cancel
              </button>
              <button className="button button--primary" disabled={isSaving} type="submit">
                {isSaving ? "Adding..." : "Add Task"}
              </button>
            </div>
          </form>
        </ModalCard>
      ) : null}
    </div>
  );
}

function BoardColumn({
  actioningTaskId,
  config,
  isLoading,
  onAddTask,
  onAdvanceTask,
  statusKey,
  tasks,
}) {
  return (
    <section className={`board-column board-column--${statusKey}`}>
      <header className="board-column__header">
        <div className="board-column__title">
          <span className="board-column__badge">{config.badge}</span>
          <h3>{config.label}</h3>
        </div>
      </header>

      {isLoading ? (
        <div className="board-column__empty">Refreshing tasks...</div>
      ) : tasks.length ? (
        <div className="board-column__cards">
          {tasks.map((task) => (
            <TaskCard
              actionLabel={config.actionLabel}
              isActioning={actioningTaskId === task.id}
              key={task.id}
              nextStatus={config.nextStatus}
              onAdvanceTask={onAdvanceTask}
              statusKey={statusKey}
              task={task}
            />
          ))}
        </div>
      ) : (
        <div className="board-column__empty">{config.emptyMessage}</div>
      )}

      <button className="board-column__add-button" onClick={onAddTask} type="button">
        <PlusIcon className="board-column__add-icon" />
        {config.addLabel}
      </button>
    </section>
  );
}

function TaskCard({ actionLabel, isActioning, nextStatus, onAdvanceTask, statusKey, task }) {
  const subtaskCount = task.subtasks?.length ?? 0;
  const completedSubtasks =
    task.subtasks?.filter((subtask) => subtask.status === "done").length ?? 0;
  const progressPercent = subtaskCount
    ? Math.round((completedSubtasks / subtaskCount) * 100)
    : statusKey === "done"
      ? 100
      : statusKey === "doing"
        ? 55
        : 12;

  return (
    <article className="task-card">
      <div className="task-card__header">
        <div className="task-card__status-icon">
          {statusKey === "todo" ? (
            <CircleIcon className="task-card__status-svg" />
          ) : (
            <CheckCircleIcon className="task-card__status-svg" />
          )}
        </div>
        <h4>{task.title}</h4>
      </div>

      {task.description ? <p className="task-card__description">{task.description}</p> : null}

      {task.subtasks?.length ? (
        <ul className="task-card__subtasks">
          {task.subtasks.slice(0, 3).map((subtask) => (
            <li key={subtask.id}>
              {subtask.status === "done" ? (
                <CheckCircleIcon className="task-card__subtask-icon task-card__subtask-icon--done" />
              ) : (
                <CircleIcon className="task-card__subtask-icon" />
              )}
              <span>{subtask.title}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="task-card__footer">
        <div className="task-card__progress">
          <span>{subtaskCount ? `${completedSubtasks}/${subtaskCount} subtasks` : "Board task"}</span>
          <strong>{`${progressPercent}%`}</strong>
        </div>
        <div className="task-card__progress-bar">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <button
        className="task-card__action"
        disabled={isActioning}
        onClick={() => onAdvanceTask(task, nextStatus)}
        type="button"
      >
        {isActioning ? "Updating..." : actionLabel}
      </button>
    </article>
  );
}

function InsightCard({ detail, icon, progress, title, value }) {
  return (
    <article className="insight-card">
      <div className="insight-card__header">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="insight-card__value-row">
        <strong>{value}</strong>
        {progress !== undefined ? (
          <div className="insight-card__mini-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
      <p>{detail}</p>
    </article>
  );
}

function EmptyState({ actionLabel, description, onAction, title }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="button button--primary button--compact" onClick={onAction} type="button">
        {actionLabel}
      </button>
    </div>
  );
}

function ModalCard({ children, description, onClose, title }) {
  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-card__header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="modal-card__close" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

async function loadWorkspace({
  isActive,
  preferredOrganizationId,
  preferredProjectId,
  setActiveOrganizationId,
  setActiveProjectId,
  setBoard,
  setFeedbackMessage,
  setIsBoardLoading,
  setIsWorkspaceLoading,
  setOrganizations,
  setProjects,
  setProjectTasks,
  setWorkspaceError,
}) {
  setIsWorkspaceLoading(true);
  setWorkspaceError("");

  try {
    const [organizationResponse, projectResponse] = await Promise.all([
      api.get("/organizations"),
      api.get("/projects"),
    ]);

    if (!isActive) {
      return;
    }

    const nextOrganizations = organizationResponse.data;
    const nextProjects = projectResponse.data;
    const selection = resolveSelection({
      organizations: nextOrganizations,
      preferredOrganizationId,
      preferredProjectId,
      projects: nextProjects,
    });

    setOrganizations(nextOrganizations);
    setProjects(nextProjects);
    setActiveOrganizationId(selection.organizationId);
    setActiveProjectId(selection.projectId);

    await loadProjectBoard({
      isActive,
      projectId: selection.projectId,
      setBoard,
      setFeedbackMessage,
      setIsBoardLoading,
      setProjectTasks,
      setWorkspaceError,
    });
  } catch (error) {
    if (!isActive) {
      return;
    }

    setWorkspaceError(
      error.response?.data?.message || error.response?.data?.error || "Unable to load the dashboard."
    );
  } finally {
    if (isActive) {
      setIsWorkspaceLoading(false);
    }
  }
}

async function loadProjectBoard({
  isActive,
  projectId,
  setBoard,
  setFeedbackMessage,
  setIsBoardLoading,
  setProjectTasks,
  successMessage,
  setWorkspaceError,
}) {
  if (!projectId) {
    setBoard(EMPTY_BOARD);
    setProjectTasks([]);
    if (successMessage !== undefined) {
      setFeedbackMessage(successMessage);
    }
    return;
  }

  setIsBoardLoading(true);
  setWorkspaceError("");

  try {
    const [boardResponse, taskResponse] = await Promise.all([
      api.get(`/projects/${projectId}/board`),
      api.get(`/projects/${projectId}/tasks`),
    ]);

    if (!isActive) {
      return;
    }

    setBoard({
      todo: boardResponse.data.todo ?? [],
      doing: boardResponse.data.doing ?? [],
      done: boardResponse.data.done ?? [],
    });
    setProjectTasks(taskResponse.data ?? []);
    if (successMessage !== undefined) {
      setFeedbackMessage(successMessage);
    }
  } catch (error) {
    if (!isActive) {
      return;
    }

    setWorkspaceError(
      error.response?.data?.message || error.response?.data?.error || "Unable to load the project board."
    );
  } finally {
    if (isActive) {
      setIsBoardLoading(false);
    }
  }
}

function resolveSelection({ organizations, preferredOrganizationId, preferredProjectId, projects }) {
  const organizationId = organizations.some(
    (organization) => organization.id === preferredOrganizationId
  )
    ? preferredOrganizationId
    : organizations[0]?.id ?? null;

  const organizationProjects = projects.filter(
    (project) => project.organization_id === organizationId
  );

  const projectId = organizationProjects.some(
    (project) => project.id === preferredProjectId
  )
    ? preferredProjectId
    : organizationProjects[0]?.id ?? null;

  return {
    organizationId,
    projectId,
  };
}

function buildRecentActivity({ organization, projects, tasks, user }) {
  const taskEvents = tasks.map((task) => ({
    id: `task-${task.id}`,
    actor: task.assignee?.name || user.name,
    message:
      task.status === "done"
        ? `completed "${task.title}".`
        : task.status === "doing"
          ? `is progressing "${task.title}".`
          : `added "${task.title}" to ${organization?.name || "the workspace"}.`,
    time: task.updated_at || task.created_at,
  }));

  const projectEvents = projects.map((project) => ({
    id: `project-${project.id}`,
    actor: user.name,
    message: `updated the "${project.name}" project.`,
    time: project.updated_at || project.created_at,
  }));

  return [...taskEvents, ...projectEvents]
    .sort((left, right) => new Date(right.time) - new Date(left.time))
    .slice(0, 3)
    .map((entry) => ({
      ...entry,
      timeLabel: formatRelativeTime(entry.time),
    }));
}

function readStoredId(key) {
  const rawValue = localStorage.getItem(key);
  const numericValue = Number(rawValue);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function persistSelection(key, value) {
  if (value) {
    localStorage.setItem(key, String(value));
  } else {
    localStorage.removeItem(key);
  }
}

function formatMembersLabel(count = 0) {
  return `${count} member${count === 1 ? "" : "s"}`;
}

function formatRelativeTime(value) {
  if (!value) {
    return "Just now";
  }

  const diffInMs = Date.now() - new Date(value).getTime();
  const diffInHours = Math.max(1, Math.round(diffInMs / (1000 * 60 * 60)));

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}

function isWithinDays(value, days) {
  if (!value) {
    return false;
  }

  const diffInMs = Date.now() - new Date(value).getTime();
  return diffInMs <= days * 24 * 60 * 60 * 1000;
}

function getInitials(value) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
