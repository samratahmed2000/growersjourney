import { Inquiry } from "../models/inquiry.js";
import { buildSort } from "../validators/admin/common.js";
import { containsFilter } from "../utils/mongo-search.js";

const LIST_PROJECTION =
  "name email company service status createdAt updatedAt";

function buildFilter({ status, service, search }) {
  const filter = {};
  if (status) filter.status = status;
  if (service) filter.service = service;

  if (search) {
    filter.$or = [
      { name: containsFilter(search) },
      { email: containsFilter(search) },
      { company: containsFilter(search) },
    ];
  }

  return filter;
}

/** Admin inquiry reads and status writes. */
export async function listInquiries({
  page,
  limit,
  status,
  service,
  search,
  sort,
  order,
}) {
  const filter = buildFilter({ status, service, search });
  const sortSpec = buildSort(sort, order, "createdAt");

  const [items, total] = await Promise.all([
    Inquiry.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(LIST_PROJECTION)
      .lean(),
    Inquiry.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findInquiryById(id) {
  return Inquiry.findById(id).lean();
}

export async function updateInquiryStatus({
  id,
  fromStatus,
  status,
  changedBy,
}) {
  return Inquiry.findOneAndUpdate(
    { _id: id, status: fromStatus },
    {
      $set: {
        status,
        statusChangedAt: new Date(),
        statusChangedBy: changedBy,
      },
    },
    { new: true, runValidators: true },
  ).lean();
}

export const adminInquiryRepository = Object.freeze({
  list: listInquiries,
  findById: findInquiryById,
  updateStatus: updateInquiryStatus,
});

export default adminInquiryRepository;
