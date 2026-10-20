import { Client } from "../models/client.js";
import { buildSort } from "../validators/admin/common.js";
import { containsFilter } from "../utils/mongo-search.js";

function buildFilter({ status, search }) {
  const filter = {};
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { displayName: containsFilter(search) },
      { companyName: containsFilter(search) },
      { primaryEmail: containsFilter(search) },
    ];
  }

  return filter;
}

export async function listClients({ page, limit, status, search, sort, order }) {
  const filter = buildFilter({ status, search });
  const sortSpec = buildSort(sort, order, "createdAt");

  const [items, total] = await Promise.all([
    Client.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-updatedBy -notes")
      .lean(),
    Client.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findClientById(id) {
  return Client.findById(id).lean();
}

export async function findClientByEmail(primaryEmail) {
  return Client.findOne({ primaryEmail: String(primaryEmail).toLowerCase() })
    .select("_id")
    .lean();
}

export async function createClient(data) {
  return Client.create(data);
}

export async function updateClient({ id, changes }) {
  const client = await Client.findById(id);
  if (!client) return null;

  for (const [key, value] of Object.entries(changes)) {
    client[key] = value;
  }

  await client.save();
  return client.toObject();
}

export const clientRepository = Object.freeze({
  list: listClients,
  findById: findClientById,
  findByEmail: findClientByEmail,
  create: createClient,
  update: updateClient,
});

export default clientRepository;
