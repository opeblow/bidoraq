import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.BIDORAQ_BASE_URL ?? 'http://127.0.0.1:4173'
const OUT = path.resolve(process.cwd(), 'docs/screenshots')
const BUYER = '0x1111111111111111111111111111111111111111'
const SUPPLIER_A = '0x2222222222222222222222222222222222222222'
const SUPPLIER_B = '0x3333333333333333333333333333333333333333'
const REVIEWER = '0x4444444444444444444444444444444444444444'
const APPROVER = '0x5555555555555555555555555555555555555555'
const pageErrors = []

await fs.mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
const page = await context.newPage()
page.on('pageerror', (error) => pageErrors.push(error.message))

async function settle() {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  await page.waitForTimeout(250)
}

async function shot(name) {
  await settle()
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  if (metrics.scrollWidth > metrics.innerWidth + 1) {
    throw new Error(`${name} has horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px`)
  }
  await page.screenshot({ path: path.join(OUT, name), fullPage: true })
  console.log(`captured ${name}`)
}

async function goto(route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
  await settle()
}

async function selectRole(role) {
  await page.locator('aside select').first().selectOption(role)
  await settle()
}

async function setWallet(address) {
  const trigger = page.locator('header').getByRole('button').filter({ hasText: /Connect|0x/ }).first()
  await trigger.click()
  await page.getByPlaceholder(/0x/).fill(address)
  await page.getByRole('button', { name: 'Use address' }).click()
  await settle()
}

async function commitBid(tenderId, address, amount, supplierName) {
  await selectRole('supplier')
  await setWallet(address)
  await goto(`/app/tenders/${tenderId}/submit`)
  await page.getByLabel(/Quotation amount/).fill(amount)
  await page.locator('input[type="file"]').setInputFiles({
    name: `${supplierName.toLowerCase().replace(/\s+/g, '-')}-quote.pdf`,
    mimeType: 'application/pdf',
    buffer: Buffer.from(`Sealed quotation for ${supplierName}`),
  })
  await page.getByRole('button', { name: 'Commit quotation' }).click()
  await page.getByRole('button', { name: 'Verify reveal' }).click()
  await settle()
}

await goto('/')
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await shot('01-landing.png')

await goto('/onboarding')
await page.getByRole('button', { name: /Buyer/ }).first().click()
await shot('02-onboarding-role.png')
await page.getByRole('button', { name: /Continue/ }).click()
await page.locator('input[placeholder^="0x"]').fill(BUYER)
await page.getByRole('button', { name: 'Use this address' }).click()
await page.getByLabel('Full name').fill('Ada Okafor')
await page.getByLabel('Organization').fill('Federal Procurement Office')
await page.getByLabel('Email').fill('ada.okafor@example.org')
await shot('03-onboarding-profile.png')
await page.getByRole('button', { name: 'Enter workspace' }).click()
await settle()

await goto('/app')
await shot('04-overview-empty.png')

await goto('/app/tenders/new')
await page.getByLabel('Tender title').fill('Regional learning centre laptops')
await page.getByLabel('Item name').fill('Business-class laptop')
await page.getByLabel('Quantity').fill('120')
await page.getByLabel('Budget (NGN)').fill('150000000')
await page.getByLabel('Delivery location').fill('Abuja, Nigeria')
await page.getByLabel('Description').fill('Supply, delivery and warranty of business-class laptops to six regional learning centres.')
await shot('05-new-rfq-brief.png')
await page.getByRole('button', { name: /Continue/ }).click()
await page.getByLabel('Invited supplier addresses').fill(`${SUPPLIER_A}\n${SUPPLIER_B}`)
await shot('06-new-rfq-policy.png')
await page.getByRole('button', { name: /Continue/ }).click()
await shot('07-new-rfq-review.png')
await page.getByRole('button', { name: /Publish RFQ/ }).click()
await settle()
const tenderId = page.url().split('/').pop()
console.log(`created tender ${tenderId}`)

await goto(`/app/tenders/${tenderId}`)
await shot('08-tender-detail.png')

await commitBid(tenderId, SUPPLIER_A, '10800000', 'Northline Systems')
await goto('/app')
await shot('09-overview-active.png')

await commitBid(tenderId, SUPPLIER_B, '11500000', 'Meridian Supply')
await goto(`/app/tenders/${tenderId}/submit`)
await shot('10-submit-bid.png')

await selectRole('buyer')
await setWallet(BUYER)
await goto(`/app/tenders/${tenderId}`)
await page.getByRole('button', { name: 'Close commitments' }).click()
await page.getByRole('button', { name: 'Open evaluation' }).click()
await settle()

await selectRole('reviewer')
await setWallet(REVIEWER)
await goto(`/app/tenders/${tenderId}/review`)
const specButtons = page.locator('button').filter({ hasText: 'Specification check' })
const specCount = await specButtons.count()
for (let index = 0; index < specCount; index += 1) await specButtons.nth(index).click()
const attestButtons = page.getByRole('button', { name: /Attest eligibility/ })
const attestCount = await attestButtons.count()
for (let index = attestCount - 1; index >= 0; index -= 1) await attestButtons.nth(index).click()
await settle()
await shot('11-evidence-review.png')

await selectRole('approver')
await setWallet(APPROVER)
await goto(`/app/tenders/${tenderId}/award`)
await shot('12-award-control.png')
await page.getByRole('button', { name: /Finalize compliant award/ }).click()
await settle()
await shot('13-award-finalized.png')

await goto('/verify')
await page.getByRole('button', { name: 'Run verification' }).click()
await settle()
await shot('14-receipt-verifier.png')

await goto('/settings')
await shot('15-settings.png')

await goto('/app')
await shot('16-overview-final.png')

await goto('/pricing')
await shot('18-pricing.png')

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const mobilePage = await mobile.newPage()
await mobilePage.goto(BASE, { waitUntil: 'networkidle' })
await mobilePage.evaluate(async () => {
  if (document.fonts?.ready) await document.fonts.ready
})
await mobilePage.waitForTimeout(250)
const mobileMetrics = await mobilePage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}))
if (mobileMetrics.scrollWidth > mobileMetrics.innerWidth + 1) {
  throw new Error(`mobile landing has horizontal overflow: ${mobileMetrics.scrollWidth}px > ${mobileMetrics.innerWidth}px`)
}
await mobilePage.screenshot({ path: path.join(OUT, '17-landing-mobile.png'), fullPage: true })
console.log('captured 17-landing-mobile.png')

await browser.close()

if (pageErrors.length > 0) {
  throw new Error(`Browser errors detected: ${pageErrors.join(' | ')}`)
}
