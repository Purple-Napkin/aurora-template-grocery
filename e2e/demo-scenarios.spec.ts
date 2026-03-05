import { test, expect } from "@playwright/test";

/** Holmes first infer runs ~3s after load; add buffer for network + directive application */
const HOLMES_APPLY_MS = 10_000;

test.describe("Holmes Demo Scenarios", () => {
  test("demo page loads and shows all scenario cards", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByTestId("demo-page-title")).toBeVisible();
    await expect(page.getByTestId("demo-page-title")).toHaveText(/Holmes Demo Scenarios/i);
    await expect(page.getByText("Urgent Replenishment")).toBeVisible();
    await expect(page.getByText("Browsing")).toBeVisible();
    await expect(page.getByText("Ready to Pay")).toBeVisible();
    await expect(page.getByText("Discovery")).toBeVisible();
  });

  test("urgent scenario: checkout-extras has holmes-hidden when holmes_demo=urgent_replenishment", async ({
    page,
  }) => {
    await page.goto("/catalogue?holmes_demo=urgent_replenishment");

    // Wait for Holmes to apply
    await page.waitForSelector("body[data-holmes-active='true']", { timeout: HOLMES_APPLY_MS });

    // Need at least one product to add to cart
    const addToCartBtn = page.getByRole("button", { name: /add to cart/i }).first();
    const productCount = await addToCartBtn.count();
    if (productCount === 0) {
      test.skip(true, "No products in catalog — run with provisioned store for full E2E");
      return;
    }

    await addToCartBtn.click();
    await page.goto("/cart");
    await page.goto("/checkout");

    // Urgent: enable_fast_checkout hides checkout-extras
    const checkoutExtras = page.locator("[data-holmes=checkout-extras]");
    const count = await checkoutExtras.count();
    expect(count, "Checkout page must have [data-holmes=checkout-extras] element").toBeGreaterThan(
      0
    );
    await expect(checkoutExtras.first()).toHaveClass(/holmes-hidden/);
  });

  test("browsing scenario: recommendations visible and not holmes-hidden when holmes_demo=browsing", async ({
    page,
  }) => {
    // Recommendations exist on product detail page (YouMayAlsoLike)
    await page.goto("/catalogue?holmes_demo=browsing");

    await page.waitForSelector("body[data-holmes-active='true']", { timeout: HOLMES_APPLY_MS });

    // Navigate to first product to get recommendations section
    const productLink = page.locator('a[href^="/catalogue/"]').first();
    const linkCount = await productLink.count();
    if (linkCount === 0) {
      test.skip(true, "No products — run with provisioned store for full E2E");
      return;
    }

    await productLink.click();

    const recommendations = page.locator("[data-holmes=recommendations]");
    await expect(recommendations).toBeVisible({ timeout: 5_000 });
    await expect(recommendations).not.toHaveClass(/holmes-hidden/);
  });

  test("holmes_demo persists in sessionStorage across navigation", async ({ page }) => {
    await page.goto("/catalogue?holmes_demo=urgent_replenishment");
    await page.waitForSelector("body[data-holmes-active='true']", { timeout: HOLMES_APPLY_MS });

    const stored = await page.evaluate(() => sessionStorage.getItem("holmes_demo"));
    expect(stored).toBe("urgent_replenishment");

    await page.goto("/cart");
    const storedAfterNav = await page.evaluate(() => sessionStorage.getItem("holmes_demo"));
    expect(storedAfterNav).toBe("urgent_replenishment");
  });
});
