import { Service } from "../models/service.js";
import { buildSort } from "../validators/admin/common.js";
import { containsFilter } from "../utils/mongo-search.js";

function buildFilter({ search, published, includeArchived }) {
  const filter = {};
  if (published !== undefined) filter.isPublished = published;
  if (!includeArchived) filter.isArchived = false;

  if (search) {
    filter.$or = [
      { title: containsFilter(search) },
      { slug: containsFilter(search) },
      { summary: containsFilter(search) },
    ];
  }

  return filter;
}

export async function listServices({
  page,
  limit,
  search,
  published,
  includeArchived,
  sort,
  order,
}) {
  const filter = buildFilter({ search, published, includeArchived });
  const sortSpec = buildSort(sort, order, "sortOrder");

  const [items, total] = await Promise.all([
    Service.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Service.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findServiceById(id) {
  return Service.findById(id).lean();
}

export async function findServiceBySlug(slug) {
  return Service.findOne({ slug }).select("_id").lean();
}

export async function createService(data) {
  return Service.create(data);
}

export async function updateService({ id, changes }) {
  const service = await Service.findById(id);
  if (!service) return null;

  for (const [key, value] of Object.entries(changes)) {
    service[key] = value;
  }

  await service.save();
  return service.toObject();
}

export async function archiveService({ id, updatedBy }) {
  const service = await Service.findById(id);
  if (!service) return null;

  service.isArchived = true;
  service.isPublished = false;
  service.updatedBy = updatedBy;
  await service.save();
  return service.toObject();
}

export const serviceRepository = Object.freeze({
  list: listServices,
  findById: findServiceById,
  findBySlug: findServiceBySlug,
  create: createService,
  update: updateService,
  archive: archiveService,
});

export default serviceRepository;
