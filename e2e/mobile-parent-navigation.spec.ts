import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
});

test("parent navigation recovers after a brief connection drop", async ({ context, page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /家长端/ }).click();
  await page.getByLabel("密码").fill("demo1234");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/parent$/);
  await expect(page.getByRole("heading", { name: "张小禾的学习概览" })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      for (const request of await cache.keys()) {
        if (!new URL(request.url).pathname.startsWith("/login")) await cache.delete(request);
      }
    }
  });

  await context.setOffline(true);
  await page.getByRole("link", { name: "学情简报", exact: true }).click();
  await page.waitForTimeout(250);
  await context.setOffline(false);

  await expect(page).toHaveURL(/\/parent\/reports$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "学情简报" })).toBeVisible();
});
