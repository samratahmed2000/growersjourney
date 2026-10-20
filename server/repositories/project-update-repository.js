import mongoose from "mongoose";
import { ProjectUpdate } from "../models/project-update.js";

export async function listProjectUpdatesForProject({
  projectId,
  page = 1,
  limit = 20,
  visibility,
}) {
  const filter = { projectId };
  if (visibility) filter.visibility = visibility;

  const [items, total] = await Promise.all([
    ProjectUpdate.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ProjectUpdate.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findProjectUpdateForProject({ id, projectId }) {
  return ProjectUpdate.findOne({ _id: id, projectId }).lean();
}

export async function createProjectUpdate(data) {
  return ProjectUpdate.create(data);
}

export async function updateProjectUpdate({ id, projectId, changes }) {
  const update = await ProjectUpdate.findOne({ _id: id, projectId });
  if (!update) return null;

  for (const [key, value] of Object.entries(changes)) {
    update[key] = value;
  }

  await update.save();
  return update.toObject();
}

export async function listRecentProjectUpdatesForClient({
  clientId,
  limit = 8,
}) {
  return ProjectUpdate.aggregate([
    { $match: { visibility: "CLIENT" } },
    {
      $lookup: {
        from: "projects",
        localField: "projectId",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$project" },
    {
      $match: {
        "project.clientId": new mongoose.Types.ObjectId(clientId),
        "project.status": { $ne: "CANCELLED" },
      },
    },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        projectId: 1,
        projectName: "$project.name",
        title: 1,
        body: 1,
        authorName: 1,
        createdAt: 1,
      },
    },
  ]);
}

export const projectUpdateRepository = Object.freeze({
  listForProject: listProjectUpdatesForProject,
  findForProject: findProjectUpdateForProject,
  create: createProjectUpdate,
  update: updateProjectUpdate,
  listRecentForClient: listRecentProjectUpdatesForClient,
});

export default projectUpdateRepository;
