import { Project } from "../models/project.js";
import { buildSort } from "../validators/admin/common.js";
import { containsFilter } from "../utils/mongo-search.js";
import {
  ACTIVE_PROJECT_STATUSES,
  PROJECT_STATUS_TRANSITIONS,
} from "../constants/project.js";

const CLIENT_POPULATE = {
  path: "clientId",
  select: "displayName companyName primaryEmail status",
};

function buildFilter({ status, clientId, search }) {
  const filter = {};
  if (status) filter.status = status;
  if (clientId) filter.clientId = clientId;

  if (search) {
    filter.$or = [
      { name: containsFilter(search) },
      { description: containsFilter(search) },
    ];
  }

  return filter;
}

export async function listProjects({
  page,
  limit,
  status,
  clientId,
  search,
  sort,
  order,
}) {
  const filter = buildFilter({ status, clientId, search });
  const sortSpec = buildSort(sort, order, "updatedAt");

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(CLIENT_POPULATE)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findProjectById(id) {
  return Project.findById(id).populate(CLIENT_POPULATE).lean();
}

export async function findProjectRawById(id) {
  return Project.findById(id).lean();
}

export async function listProjectsByClientId(clientId, limit = 25) {
  return Project.find({ clientId })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .populate(CLIENT_POPULATE)
    .lean();
}

export async function createProject(data) {
  const project = await Project.create(data);
  return findProjectById(project._id);
}

export async function updateProject({ id, changes }) {
  const project = await Project.findById(id);
  if (!project) return null;

  for (const [key, value] of Object.entries(changes)) {
    // `null` is how the API clears an optional date. Setting undefined makes
    // Mongoose remove the field instead of storing a null that breaks sparse
    // index assumptions elsewhere.
    project[key] = value === null ? undefined : value;
  }

  await project.save();
  return findProjectById(project._id);
}

/**
 * Atomically change project status.
 *
 * Returns a discriminated result so the route can distinguish a missing
 * project, an invalid transition, and a concurrent change.
 */
export async function updateProjectStatus({ id, status, changedBy }) {
  const current = await Project.findById(id).select("status").lean();
  if (!current) return { kind: "not_found" };

  if (current.status === status) {
    return { kind: "ok", project: await findProjectById(id) };
  }

  const allowed = PROJECT_STATUS_TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(status)) {
    return { kind: "invalid", currentStatus: current.status };
  }

  const $set = {
    status,
    statusChangedAt: new Date(),
    statusChangedBy: changedBy,
    updatedBy: changedBy,
  };
  const $unset = {};

  if (status === "COMPLETED") {
    $set.completedAt = new Date();
  } else {
    $unset.completedAt = 1;
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, status: current.status },
    {
      $set,
      ...(Object.keys($unset).length > 0 ? { $unset } : {}),
    },
    { new: true, runValidators: true },
  )
    .populate(CLIENT_POPULATE)
    .lean();

  if (!project) return { kind: "conflict" };
  return { kind: "ok", project };
}

/** Milestone and update writes bump the parent project's activity timestamp. */
export async function touchProject({ id, updatedBy }) {
  await Project.updateOne(
    { _id: id },
    { $set: { updatedBy, updatedAt: new Date() } },
  );
}

export async function listProjectsForClient({
  clientId,
  page,
  limit,
  status,
}) {
  const filter = { clientId };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findProjectForClient({ id, clientId }) {
  return Project.findOne({ _id: id, clientId }).lean();
}

export async function listActiveProjectsForClient({ clientId, limit }) {
  return Project.find({
    clientId,
    status: { $in: ACTIVE_PROJECT_STATUSES },
  })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .lean();
}

export async function listRecentProjectsForClient({ clientId, limit }) {
  return Project.find({ clientId })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .lean();
}

export async function countActiveProjectsForClient(clientId) {
  return Project.countDocuments({
    clientId,
    status: { $in: ACTIVE_PROJECT_STATUSES },
  });
}

export const projectRepository = Object.freeze({
  list: listProjects,
  findById: findProjectById,
  findRawById: findProjectRawById,
  listByClientId: listProjectsByClientId,
  create: createProject,
  update: updateProject,
  updateStatus: updateProjectStatus,
  touch: touchProject,
  listForClient: listProjectsForClient,
  findForClient: findProjectForClient,
  listActiveForClient: listActiveProjectsForClient,
  listRecentForClient: listRecentProjectsForClient,
  countActiveForClient: countActiveProjectsForClient,
});

export default projectRepository;
