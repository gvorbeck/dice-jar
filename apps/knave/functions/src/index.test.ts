import { beforeEach, describe, expect, it, vi } from 'vitest';

const { billing, state } = vi.hoisted(() => ({
  billing: { getProjectBillingInfo: vi.fn(), updateProjectBillingInfo: vi.fn() },
  state: { handler: undefined as undefined | ((e: unknown) => Promise<void>) },
}));
vi.mock('firebase-functions/v2/pubsub', () => ({
  onMessagePublished: (_options: unknown, handler: (e: unknown) => Promise<void>) => (state.handler = handler),
}));
vi.mock('firebase-functions/params', () => ({ projectID: { value: () => 'proj' } }));
vi.mock('firebase-functions', () => ({ logger: { warn: vi.fn() } }));
vi.mock('@google-cloud/billing', () => ({
  CloudBillingClient: class {
    getProjectBillingInfo = billing.getProjectBillingInfo;
    updateProjectBillingInfo = billing.updateProjectBillingInfo;
  },
}));
await import('./index.js');

const alert = (costAmount: unknown, budgetAmount: unknown) => ({ data: { message: { json: { costAmount, budgetAmount } } } });

describe('budgetKillSwitch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does nothing under the budget, without even asking Google', async () => {
    await state.handler!(alert(4.5, 5));
    expect(billing.getProjectBillingInfo).not.toHaveBeenCalled();
  });
  it('unlinks the billing account once the budget is reached', async () => {
    billing.getProjectBillingInfo.mockResolvedValue([{ billingEnabled: true }]);
    await state.handler!(alert(5, 5));
    expect(billing.updateProjectBillingInfo).toHaveBeenCalledWith({
      name: 'projects/proj',
      projectBillingInfo: { billingAccountName: '' },
    });
  });
  it('leaves billing alone when it is already off', async () => {
    billing.getProjectBillingInfo.mockResolvedValue([{ billingEnabled: false }]);
    await state.handler!(alert(9, 5));
    expect(billing.updateProjectBillingInfo).not.toHaveBeenCalled();
  });
});
