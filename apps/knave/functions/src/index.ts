import { logger } from 'firebase-functions';
import { projectID } from 'firebase-functions/params';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { overBudget, type BudgetAlert } from '../../../../packages/budget';

// Same handler as delta-green's: Functions can't bundle shared packages, so only the pure check (`overBudget`) is shared, and the SDK calls stay per app.
/**
 * Kill switch: the $5 budget publishes to `budget-alerts`. Once actual cost reaches the budget,
 * unlink the billing account, which stops everything that costs money (and takes the site down).
 * To bring the site back, see "If the site was shut off for going over budget" in the README.
 */
export const budgetKillSwitch = onMessagePublished<BudgetAlert>(
  { topic: 'budget-alerts', region: 'us-east1', maxInstances: 1 },
  async (event) => {
    const alert = event.data.message.json;
    if (!overBudget(alert)) return;

    const { CloudBillingClient } = await import('@google-cloud/billing');
    const billing = new CloudBillingClient();
    const name = `projects/${projectID.value()}`;
    const [info] = await billing.getProjectBillingInfo({ name });
    if (!info.billingEnabled) return; // already off; Google keeps sending alerts for the rest of the month

    await billing.updateProjectBillingInfo({ name, projectBillingInfo: { billingAccountName: '' } });
    logger.warn('Budget reached: billing disabled', { cost: alert.costAmount, budget: alert.budgetAmount });
  },
);
