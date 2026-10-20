import { Project } from "../models/project.js";
import { buildSort } from "../validators/admin/common.js";
import { containsFilter } from "../utils/mongo-search.js";

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

export async function listProjectsByClientId(clientId, limit = 25) {
  return Project.find({ clientId })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .populate(CLIENT_POPULATE)
    .lean();
}

export const projectRepository = Object.freeze({
  list: listProjects,
  findById: findProjectById,
  listByClientId: listProjectsByClientId,
});

export default projectRepository;
