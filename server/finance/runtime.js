import { createPaymentProvider } from "../payments/create-provider.js";
import { invoiceRepository as defaultInvoiceRepository } from "../repositories/invoice-repository.js";
import { invoiceCounterRepository as defaultCounterRepository } from "../repositories/invoice-counter-repository.js";
import { paymentRepository as defaultPaymentRepository } from "../repositories/payment-repository.js";
import { paymentEventRepository as defaultPaymentEventRepository } from "../repositories/payment-event-repository.js";
import { paymentRefundRepository as defaultRefundRepository } from "../repositories/payment-refund-repository.js";
import { auditEventRepository as defaultAuditRepository } from "../repositories/audit-event-repository.js";
import { clientRepository as defaultClientRepository } from "../repositories/client-repository.js";
import { projectRepository as defaultProjectRepository } from "../repositories/project-repository.js";
import { createInvoiceService } from "../services/invoice-service.js";
import { createPaymentService } from "../services/payment-service.js";

/**
 * Build the invoice/payment runtime from validated configuration.
 *
 * `createApp()` never reads process.env. Production calls this factory from
 * `server/index.js`; tests inject in-memory repositories and a fake provider.
 */
export function createFinanceRuntime({
  env,
  repositories = {},
  providerOverride,
  transactionRunner,
} = {}) {
  if (!env) throw new Error("Finance runtime requires validated env.");

  const invoiceRepository = repositories.invoices ?? defaultInvoiceRepository;
  const counterRepository = repositories.counters ?? defaultCounterRepository;
  const clientRepository = repositories.clients ?? defaultClientRepository;
  const projectRepository = repositories.projects ?? defaultProjectRepository;
  const paymentRepository = repositories.payments ?? defaultPaymentRepository;
  const paymentEventRepository = repositories.events ?? defaultPaymentEventRepository;
  const refundRepository = repositories.refunds ?? defaultRefundRepository;
  const auditRepository = repositories.audit ?? defaultAuditRepository;

  const provider =
    providerOverride ??
    (env.paymentsEnabled
      ? createPaymentProvider({
          provider: env.paymentProvider,
          environment: env.paymentEnvironment,
          webhookSecret: env.paymentWebhookSecret,
          mockTokenSecret: env.paymentMockTokenSecret,
          apiBaseUrl: env.paymentPublicBaseUrl,
          frontendUrl: env.frontendUrls[0],
          isProduction: env.isProduction,
        })
      : null);

  const sharedConfig = {
    supportedCurrencies: env.invoiceSupportedCurrencies,
    taxEnabled: env.invoiceTaxEnabled,
    discountEnabled: env.invoiceDiscountEnabled,
    timezone: env.invoiceTimezone,
    overdueGraceDays: env.invoiceOverdueGraceDays,
    invoiceNumberPrefix: env.invoiceNumberPrefix,
    paymentsEnabled: Boolean(provider),
  };

  const invoiceService = createInvoiceService({
    invoiceRepository,
    counterRepository,
    clientRepository,
    projectRepository,
    auditRepository,
    config: sharedConfig,
  });

  const paymentService = createPaymentService({
    paymentRepository,
    invoiceRepository,
    paymentEventRepository,
    refundRepository,
    auditRepository,
    provider,
    transactionRunner,
    config: {
      ...sharedConfig,
      environment: env.paymentEnvironment,
      publicBaseUrl: env.paymentPublicBaseUrl,
      frontendUrl: env.frontendUrls[0],
      transactions: env.mongodbTransactions,
    },
  });

  return {
    invoiceService,
    paymentService,
    provider,
    config: sharedConfig,
    repositories: {
      invoices: invoiceRepository,
      counters: counterRepository,
      clients: clientRepository,
      projects: projectRepository,
      payments: paymentRepository,
      events: paymentEventRepository,
      refunds: refundRepository,
      audit: auditRepository,
    },
  };
}

export default createFinanceRuntime;
