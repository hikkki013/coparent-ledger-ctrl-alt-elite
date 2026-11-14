import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Synthetic browser scenarios only. These tests are prepared but UNRUN in the
 * restricted authoring environment: browser packages and loopback serving were
 * unavailable. They are deliberately not skipped or presented as live-backend
 * integration evidence. Point PLAYWRIGHT_BASE_URL at React (5173) or the separate
 * standalone demo (4173); both expose /demo and share the real DemoLedger.
 */
class DemoDriver {
  readonly page: Page;
  readonly standalone: boolean;
  readonly browserErrors: string[];
  readonly backendRequests: string[];
  readonly nativeDialogs: string[];
  constructor(page: Page, standalone: boolean, browserErrors: string[], backendRequests: string[], nativeDialogs: string[]) {
    this.page = page; this.standalone = standalone; this.browserErrors = browserErrors; this.backendRequests = backendRequests; this.nativeDialogs = nativeDialogs;
  }
  static async open(page: Page) {
    const browserErrors: string[] = [], backendRequests: string[] = [], nativeDialogs: string[] = [];
    page.on('pageerror', error => browserErrors.push(error.message));
    page.on('request', request => { if (/\/auth\/v1\/|\/rest\/v1\/|\/functions\/v1\//.test(request.url())) backendRequests.push(request.url()); });
    // Standalone uses native confirmation dialogs for synthetic actions only.
    page.on('dialog', async dialog => { nativeDialogs.push(dialog.message()); await dialog.accept(); });
    await page.goto('/demo');
    await expect(page.locator('#demo-person, #actor')).toBeVisible();
    return new DemoDriver(page, await page.locator('#actor').count() === 1, browserErrors, backendRequests, nativeDialogs);
  }
  dialog() { return this.page.locator('dialog[open]'); }
  amount(term: string): Locator {
    return this.page.locator('dt').filter({ hasText: new RegExp(`^${term}$`) }).locator('..').locator('dd');
  }
  balance(direction: 'owe' | 'owed') {
    if (this.standalone) return this.page.getByTestId(direction === 'owe' ? 'you-owe' : 'owed-to-you');
    return this.page.locator('.balance-card').filter({ has: this.page.getByText(direction === 'owe' ? 'You owe' : 'Owed to you', { exact: true }) }).locator('strong');
  }
  async clean() {
    await this.page.getByRole('button', { name: 'Start clean', exact: true }).click();
    await expect(this.page.locator('.expense-row')).toHaveCount(0);
    await expect(this.balance('owe')).toHaveText('$0.00');
  }
  async examples() {
    await this.page.getByRole('button', { name: 'Load examples', exact: true }).click();
    await expect(this.page.locator('.expense-row')).toHaveCount(4);
  }
  async viewAs(actor: 'alex' | 'jordan') {
    await this.page.locator('#demo-person, #actor').selectOption(actor);
    await expect(this.page.locator('#demo-person, #actor')).toHaveValue(actor);
    await expect(this.page.locator('.expense-list, .ledger')).toBeVisible();
  }
  async openExpense(description: string) {
    await this.page.locator('.expense-row').filter({ hasText: description }).click();
    await expect(this.page.getByRole('heading', { name: description, exact: true, level: 1 })).toBeVisible();
  }
  async back() {
    await this.page.getByRole('button', { name: this.standalone ? /All expenses/ : 'Back to ledger' }).click();
    await expect(this.page.locator('.expense-list, .ledger')).toBeVisible();
  }
  async createExpense(description: string) {
    await this.page.getByRole('button', { name: /Add expense/ }).click();
    const dialog = this.dialog();
    await dialog.locator('#expense-description, input[name="description"]').fill(description);
    await dialog.locator('#expense-amount, input[name="amount"]').fill('120.01');
    await dialog.locator('#expense-share, input[name="share"]').fill('40');
    await expect(dialog.locator('input[type="file"]')).toHaveCount(0);
    if (!this.standalone) await dialog.getByRole('checkbox', { name: 'Attach a built-in SAMPLE receipt' }).check();
    await expect(dialog).toContainText('$48.00');
    await dialog.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(this.page.getByRole('heading', { name: description, exact: true, level: 1 })).toBeVisible();
    if (this.standalone) {
      await this.page.getByRole('button', { name: 'Attach sample receipt', exact: true }).click();
      const image = this.page.getByRole('img', { name: 'Synthetic sample receipt, not a real purchase' });
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    } else {
      await expect(this.page.getByText('Receipt attached', { exact: true })).toBeVisible();
      await this.page.getByRole('button', { name: 'View receipt', exact: true }).click();
      const image = this.dialog().getByRole('img', { name: 'Synthetic sample receipt for demonstration only' });
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await this.page.keyboard.press('Escape');
    }
  }
  async submitExpense() {
    await this.page.getByRole('button', { name: 'Send for review', exact: true }).click();
    if (!this.standalone) {
      await expect(this.dialog()).toContainText('$48.00');
      await this.dialog().getByRole('button', { name: 'Send for review', exact: true }).click();
    }
    await expect(this.page.getByText(this.standalone ? 'Needs review' : 'Awaiting review', { exact: true })).toBeVisible();
  }
  async approve(share = '$48.00', disputed = false) {
    const name = this.standalone ? (disputed ? 'Agree to this unchanged expense' : 'Agree to this share') : (disputed ? 'Approve unchanged share' : 'Approve share');
    await this.page.getByRole('button', { name, exact: true }).click();
    if (!this.standalone) {
      await expect(this.dialog()).toContainText(share);
      await this.dialog().getByRole('button', { name: `Approve ${share} share`, exact: true }).click();
    } else expect(this.nativeDialogs.at(-1)).toContain(share);
    await expect(this.page.getByText('Agreed', { exact: true })).toBeVisible();
  }
  async reportPayment(amount: string) {
    await this.page.getByRole('button', { name: 'Record external payment', exact: true }).click();
    const dialog = this.dialog();
    await dialog.locator('#payment-amount, input[name="amount"]').fill(amount);
    await dialog.locator('#payment-method, input[name="methodLabel"]').fill('Sample cash');
    await dialog.getByRole('button', { name: this.standalone ? 'Record payment' : 'Record external payment', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
  async confirmReceipt(amount: string) {
    await this.page.getByRole('button', { name: 'I received this payment', exact: true }).click();
    if (!this.standalone) {
      await expect(this.dialog()).toContainText(amount);
      await this.dialog().getByRole('button', { name: `Confirm receipt of ${amount}`, exact: true }).click();
    } else expect(this.nativeDialogs.at(-1)).toContain(amount);
    await expect(this.page.getByRole('button', { name: 'I received this payment', exact: true })).toHaveCount(0);
  }
  assertNoRuntimeOrBackendUse() {
    expect(this.browserErrors).toEqual([]);
    expect(this.backendRequests).toEqual([]);
  }
}

test('a sample payment leaves the balance unchanged until its recipient confirms, then survives reload', async ({ page }) => {
  const demo = await DemoDriver.open(page);
  await demo.clean();
  await demo.createExpense('School supplies — browser sample');
  await demo.submitExpense();
  await expect(page.getByRole('button', { name: /^(Approve share|Agree to this share)$/ })).toHaveCount(0);
  await demo.viewAs('jordan');
  await demo.openExpense('School supplies — browser sample');
  await demo.approve();
  await demo.reportPayment('20.00');
  await expect(demo.amount('Remaining')).toHaveText('$48.00');
  await expect(demo.amount('Awaiting receipt confirmation')).toHaveText('$20.00');
  await expect(page.getByRole('button', { name: 'I received this payment', exact: true })).toHaveCount(0);
  await demo.viewAs('alex');
  await demo.openExpense('School supplies — browser sample');
  await demo.confirmReceipt('$20.00');
  await expect(demo.amount('Remaining')).toHaveText('$28.00');
  await expect(demo.amount('Awaiting receipt confirmation')).toHaveText('$0.00');
  await expect(page.getByRole('heading', { name: /^(Activity history|History)$/ })).toBeVisible();
  await page.reload();
  await expect(demo.amount('Remaining')).toHaveText('$28.00');
  await expect(demo.amount('Awaiting receipt confirmation')).toHaveText('$0.00');
  demo.assertNoRuntimeOrBackendUse();
});

test('golden examples keep two directions separate and exclude pending or disputed shares', async ({ page }) => {
  const demo = await DemoDriver.open(page);
  await demo.examples();
  await expect(demo.balance('owe')).toHaveText('$42.78');
  await expect(demo.balance('owed')).toHaveText('$28.00');
  await expect(page.getByText('$14.78', { exact: true })).toHaveCount(0);
  await demo.openExpense('School supplies');
  await expect(demo.amount('Remaining')).toHaveText('$28.00');
  await expect(demo.amount('Awaiting receipt confirmation')).toHaveText('$10.00');
  await demo.back();
  await demo.openExpense('Activity fee');
  await expect(page.getByText('Disputed', { exact: true })).toBeVisible();
  await expect(page.getByText('Please clarify which session this charge covers.', { exact: false }).first()).toBeVisible();
  await expect(page.locator('dt').filter({ hasText: /^Proposed.*share/ }).locator('..').locator('dd')).toContainText('$69.99');
  await expect(page.getByRole('button', { name: 'Record external payment', exact: true })).toHaveCount(0);
  await demo.back();
  await expect(demo.balance('owe')).toHaveText('$42.78');
  await expect(demo.balance('owed')).toHaveText('$28.00');
  demo.assertNoRuntimeOrBackendUse();
});

test('a reviewer can raise a concern and later approve the same unchanged share', async ({ page }) => {
  const demo = await DemoDriver.open(page);
  await demo.examples();
  await demo.openExpense('School backpack');
  await page.getByRole('button', { name: demo.standalone ? 'Raise an objection' : 'Raise a concern', exact: true }).click();
  const dialog = demo.dialog();
  await dialog.locator('#decision-note, textarea[name="reason"]').fill('   ');
  await dialog.getByRole('button', { name: demo.standalone ? 'Raise an objection' : 'Raise concern', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.field-error, #form-error')).toContainText(/reason|required|non-space/i);
  await dialog.locator('#decision-note, textarea[name="reason"]').fill('Please confirm which backpack this receipt covers.');
  await dialog.getByRole('button', { name: demo.standalone ? 'Raise an objection' : 'Raise concern', exact: true }).click();
  await expect(page.getByText('Disputed', { exact: true })).toBeVisible();
  await demo.back();
  await expect(demo.balance('owe')).toHaveText('$42.78');
  await demo.openExpense('School backpack');
  await demo.approve('$13.35', true);
  await demo.back();
  await expect(demo.balance('owe')).toHaveText('$56.13');
  await expect(demo.balance('owed')).toHaveText('$28.00');
  demo.assertNoRuntimeOrBackendUse();
});

test('reset affects only this tab’s sample data and preserves unrelated storage', async ({ page, context }) => {
  const first = await DemoDriver.open(page);
  const secondPage = await context.newPage();
  const second = await DemoDriver.open(secondPage);
  await page.evaluate(() => sessionStorage.setItem('unrelated-demo-test-key', 'keep-me'));
  await first.clean();
  await expect(first.balance('owe')).toHaveText('$0.00');
  await secondPage.reload();
  await expect(second.balance('owe')).toHaveText('$42.78');
  await expect(second.balance('owed')).toHaveText('$28.00');
  expect(await page.evaluate(() => sessionStorage.getItem('unrelated-demo-test-key'))).toBe('keep-me');
  first.assertNoRuntimeOrBackendUse(); second.assertNoRuntimeOrBackendUse();
  await secondPage.close();
});

test('ledger, detail and expense form fit the configured mobile or desktop viewport', async ({ page }) => {
  const demo = await DemoDriver.open(page);
  const expectNoHorizontalOverflow = async () => {
    const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  };
  await expectNoHorizontalOverflow();
  await demo.openExpense('Activity fee');
  await expectNoHorizontalOverflow();
  await demo.back();
  await page.getByRole('button', { name: /Add expense/ }).click();
  const dialog = demo.dialog();
  await dialog.locator('#expense-amount, input[name="amount"]').fill('1000000.00');
  await dialog.locator('#expense-share, input[name="share"]').fill('50');
  await expect(dialog).toContainText('$500,000.00');
  await expectNoHorizontalOverflow();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  const dialogDimensions = await dialog.evaluate(element => ({ content: element.scrollWidth, viewport: element.clientWidth }));
  expect(dialogDimensions.content).toBeLessThanOrEqual(dialogDimensions.viewport + 1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  demo.assertNoRuntimeOrBackendUse();
});
