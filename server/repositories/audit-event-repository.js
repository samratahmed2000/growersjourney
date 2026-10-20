import { AuditEvent } from "../models/audit-event.js";

export async function recordAuditEvent(data, session = null) {
  const [event] = await AuditEvent.create([data], { session });
  return event;
}

export const auditEventRepository = Object.freeze({
  record: recordAuditEvent,
});

export default auditEventRepository;
