import { PortfolioProject } from "../models/portfolio-project.js";
import { buildSort } from "../validators/admin/common.js";
import { containsFilter } from "../utils/mongo-search.js";

function buildFilter({ search, published, includeArchived, featured }) {
  const filter = {};
  if (published !== undefined) filter.isPublished = published;
  if (!includeArchived) filter.isArchived = false;
  if (featured !== undefined) filter.isFeatured = featured;

  if (search) {
    filter.$or = [
      { title: containsFilter(search) },
      { slug: containsFilter(search) },
      { category: containsFilter(search) },
    ];
  }

  return filter;
}

export async function listPortfolio({
  page,
  limit,
  search,
  published,
  includeArchived,
  featured,
  sort,
  order,
}) {
  const filter = buildFilter({ search, published, includeArchived, featured });
  const sortSpec = buildSort(sort, order, "updatedAt");

  const [items, total] = await Promise.all([
    PortfolioProject.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PortfolioProject.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findPortfolioById(id) {
  return PortfolioProject.findById(id).lean();
}

export async function createPortfolio(data) {
  return PortfolioProject.create(data);
}

export async function updatePortfolio({ id, changes, updatedBy }) {
  const project = await PortfolioProject.findById(id);
  if (!project) return null;

  for (const [key, value] of Object.entries(changes)) {
    project[key] = value;
  }

  if (changes.isPublished === true && !project.publishedAt) {
    project.publishedAt = new Date();
  }
  if (changes.isPublished === false) {
    project.isFeatured = false;
  }
  project.updatedBy = updatedBy;

  await project.save();
  return project.toObject();
}

export async function archivePortfolio({ id, updatedBy }) {
  const project = await PortfolioProject.findById(id);
  if (!project) return null;

  project.isArchived = true;
  project.isPublished = false;
  project.isFeatured = false;
  project.updatedBy = updatedBy;
  await project.save();
  return project.toObject();
}

export const portfolioRepository = Object.freeze({
  list: listPortfolio,
  findById: findPortfolioById,
  create: createPortfolio,
  update: updatePortfolio,
  archive: archivePortfolio,
});

export default portfolioRepository;
