import mongoose from "mongoose";
import { Milestone } from "../models/milestone.js";

function startOfUtcDay(value) {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function listMilestonesForProject(projectId) {
  return Milestone.find({ projectId })
    .sort({ sortOrder: 1, dueDate: 1, _id: 1 })
    .lean();
}

export async function findMilestoneForProject({ id, projectId }) {
  return Milestone.findOne({ _id: id, projectId }).lean();
}

export async function createMilestone(data) {
  let sortOrder = data.sortOrder;

  if (sortOrder === undefined) {
    const last = await Milestone.findOne({ projectId: data.projectId })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  return Milestone.create({ ...data, sortOrder });
}

export async function updateMilestone({
  id,
  projectId,
  changes,
  expectedStatus,
}) {
  const filter = { _id: id, projectId };
  if (expectedStatus) filter.status = expectedStatus;

  const milestone = await Milestone.findOne(filter);
  if (!milestone) return null;

  for (const [key, value] of Object.entries(changes)) {
    milestone[key] = value === null ? undefined : value;
  }

  await milestone.save();
  return milestone.toObject();
}

export async function milestoneCountsForProjects(projectIds) {
  if (!projectIds.length) return new Map();

  const rows = await Milestone.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    {
      $group: {
        _id: "$projectId",
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      { total: row.total, completed: row.completed },
    ]),
  );
}

function upcomingPipeline(clientId, now) {
  return [
    {
      $match: {
        status: { $ne: "COMPLETED" },
        dueDate: { $type: "date", $gte: startOfUtcDay(now) },
      },
    },
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
        "project.status": { $nin: ["COMPLETED", "CANCELLED"] },
      },
    },
  ];
}

export async function listUpcomingMilestonesForClient({
  clientId,
  now = new Date(),
  limit = 5,
}) {
  return Milestone.aggregate([
    ...upcomingPipeline(clientId, now),
    { $sort: { dueDate: 1, _id: 1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        projectId: 1,
        projectName: "$project.name",
        title: 1,
        status: 1,
        dueDate: 1,
      },
    },
  ]);
}

export async function countUpcomingMilestonesForClient({
  clientId,
  now = new Date(),
}) {
  const rows = await Milestone.aggregate([
    ...upcomingPipeline(clientId, now),
    { $count: "total" },
  ]);
  return rows[0]?.total ?? 0;
}

export async function countCompletedMilestonesForClient(clientId) {
  const rows = await Milestone.aggregate([
    { $match: { status: "COMPLETED" } },
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
    { $count: "total" },
  ]);
  return rows[0]?.total ?? 0;
}

export const milestoneRepository = Object.freeze({
  listForProject: listMilestonesForProject,
  findForProject: findMilestoneForProject,
  create: createMilestone,
  update: updateMilestone,
  countsForProjects: milestoneCountsForProjects,
  listUpcomingForClient: listUpcomingMilestonesForClient,
  countUpcomingForClient: countUpcomingMilestonesForClient,
  countCompletedForClient: countCompletedMilestonesForClient,
});

export default milestoneRepository;
