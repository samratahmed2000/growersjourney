import { PENDING_INQUIRY_STATUSES } from "../constants/inquiry.js";
import { ACTIVE_PROJECT_STATUSES } from "../constants/project.js";
import { Inquiry } from "../models/inquiry.js";
import { Project } from "../models/project.js";
import { Client } from "../models/client.js";
import { serializeInquirySummary } from "../utils/serializers.js";

/**
 * Dashboard summary.
 *
 * Every number comes from a real collection. There are no invoice or revenue
 * metrics here because those modules do not exist yet.
 */
export async function getDashboardSummary() {
  const [
    inquiryTotal,
    newInquiries,
    pendingInquiries,
    projectTotal,
    activeProjects,
    clientTotal,
    activeClients,
    recent,
  ] = await Promise.all([
    Inquiry.countDocuments({}),
    Inquiry.countDocuments({ status: "NEW" }),
    Inquiry.countDocuments({ status: { $in: PENDING_INQUIRY_STATUSES } }),
    Project.countDocuments({}),
    Project.countDocuments({ status: { $in: ACTIVE_PROJECT_STATUSES } }),
    Client.countDocuments({}),
    Client.countDocuments({ status: "ACTIVE" }),
    Inquiry.find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .select("name email company service status createdAt updatedAt")
      .lean(),
  ]);

  return {
    inquiries: {
      total: inquiryTotal,
      new: newInquiries,
      pending: pendingInquiries,
    },
    projects: { total: projectTotal, active: activeProjects },
    clients: { total: clientTotal, active: activeClients },
    recentInquiries: recent.map(serializeInquirySummary),
  };
}

export const dashboardRepository = Object.freeze({
  getSummary: getDashboardSummary,
});

export default dashboardRepository;
