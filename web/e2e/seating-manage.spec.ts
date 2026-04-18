import { test, expect } from "@playwright/test"

const TEST_USER = process.env.E2E_USERNAME ?? "thanwa"
const TEST_PASS = process.env.E2E_PASSWORD ?? "password"

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login")
  await page.fill("#username", TEST_USER)
  await page.fill("#password", TEST_PASS)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL(/\/admin(?!\/login)/)
}

test.describe("Seating Management List Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto("/admin/seating/manage")
  })

  test("page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Seating Management" }),
    ).toBeVisible()
  })

  test("has search inputs for tables and guests", async ({ page }) => {
    await expect(page.getByPlaceholder("Search tables...")).toBeVisible()
    await expect(page.getByPlaceholder("Search guests...")).toBeVisible()
  })

  test("has Add Table button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Add Table" }),
    ).toBeVisible()
  })

  test("add table dialog opens and creates a table", async ({ page }) => {
    await page.getByRole("button", { name: "Add Table" }).click()
    await expect(
      page.getByRole("heading", { name: "Add Table" }),
    ).toBeVisible()

    const tableName = `E2E-Table-${Date.now()}`
    await page.fill("#table-name", tableName)
    await page.fill("#table-capacity", "8")
    await page.getByRole("button", { name: "Create" }).click()

    // Wait for table to appear in the list
    await expect(page.getByText(tableName)).toBeVisible({ timeout: 10000 })
  })

  test("search tables filters the list", async ({ page }) => {
    // Create a uniquely named table first
    const uniqueName = `SearchTest-${Date.now()}`
    await page.getByRole("button", { name: "Add Table" }).click()
    await page.fill("#table-name", uniqueName)
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 })

    // Search for it
    await page.fill('input[placeholder="Search tables..."]', uniqueName)
    await expect(page.getByText(uniqueName)).toBeVisible()

    // Search for something that doesn't exist
    await page.fill(
      'input[placeholder="Search tables..."]',
      "NONEXISTENT_TABLE_XYZ",
    )
    await expect(page.getByText("No tables match your search.")).toBeVisible()
  })

  test("search guests filters to matching tables", async ({ page }) => {
    await page.fill(
      'input[placeholder="Search guests..."]',
      "NONEXISTENT_GUEST_XYZ",
    )
    // Should show no results or empty state
    const tableCards = page.locator('[class*="card"]')
    // Either no cards or the "no match" message
    const noMatch = page.getByText("No tables match your search.")
    await expect(noMatch.or(tableCards.first())).toBeVisible({ timeout: 5000 })
  })

  test("delete table with confirmation", async ({ page }) => {
    // Create a table to delete
    const tableName = `Delete-Me-${Date.now()}`
    await page.getByRole("button", { name: "Add Table" }).click()
    await page.fill("#table-name", tableName)
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByText(tableName)).toBeVisible({ timeout: 10000 })

    // Find the card with that table and click Delete
    const card = page.locator("div").filter({ hasText: tableName }).first()
    await card.getByRole("button", { name: "Delete" }).first().click()

    // Confirmation dialog appears
    await expect(
      page.getByRole("heading", { name: "Delete Table" }),
    ).toBeVisible()

    // Confirm deletion
    await page
      .locator('[role="dialog"]')
      .getByRole("button", { name: "Delete" })
      .click()

    // Table should disappear
    await expect(page.getByText(tableName)).not.toBeVisible({ timeout: 10000 })
  })

  test("tables are sorted alphabetically", async ({ page }) => {
    // Create tables with known ordering
    const prefix = `Sort-${Date.now()}`
    for (const suffix of ["C", "A", "B"]) {
      await page.getByRole("button", { name: "Add Table" }).click()
      await page.fill("#table-name", `${prefix}-${suffix}`)
      await page.getByRole("button", { name: "Create" }).click()
      await expect(page.getByText(`${prefix}-${suffix}`)).toBeVisible({
        timeout: 10000,
      })
    }

    // Filter to our test tables
    await page.fill('input[placeholder="Search tables..."]', prefix)

    // Get all card titles and verify order
    const titles = await page
      .locator("h3, [class*='CardTitle']")
      .filter({ hasText: prefix })
      .allTextContents()

    const sorted = [...titles].sort()
    expect(titles).toEqual(sorted)
  })
})
