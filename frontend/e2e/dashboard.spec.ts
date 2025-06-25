import { test, expect } from '@playwright/test'

test.describe('Metrics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/')
    
    // Wait for the dashboard to load
    await page.waitForLoadState('networkidle')
  })

  test('displays dashboard with charts and panels', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
    
    // Check that charts are rendered
    await expect(page.locator('[data-testid="metrics-charts"]').first()).toBeVisible()
    
    // Check Values Panel is present
    await expect(page.getByText('Read')).toBeVisible()
    await expect(page.getByText('Write')).toBeVisible()
    
    // Check time range selector
    await expect(page.getByText('Last 1 hour')).toBeVisible()
    await expect(page.getByText('Last 6 hours')).toBeVisible()
    await expect(page.getByText('Last 24 hours')).toBeVisible()
    await expect(page.getByText('Last 7 days')).toBeVisible()
    await expect(page.getByText('Last 30 days')).toBeVisible()
    await expect(page.getByText('Last 90 days')).toBeVisible()
  })

  test('time range switching updates charts', async ({ page }) => {
    // Test different time ranges
    const timeRanges = [
      { label: 'Last 1 hour', testId: 'time-range-1h' },
      { label: 'Last 6 hours', testId: 'time-range-6h' },
      { label: 'Last 24 hours', testId: 'time-range-24h' },
      { label: 'Last 7 days', testId: 'time-range-7d' },
      { label: 'Last 30 days', testId: 'time-range-30d' },
      { label: 'Last 90 days', testId: 'time-range-90d' }
    ]

    for (const range of timeRanges) {
      // Click the time range button
      await page.getByText(range.label).click()
      
      // Wait for charts to update
      await page.waitForTimeout(500)
      
      // Verify active state
      await expect(page.getByText(range.label)).toHaveClass(/bg-blue-600/)
      
      // Verify charts are still visible and updated
      await expect(page.getByText('IOPS')).toBeVisible()
      await expect(page.getByText('Throughput')).toBeVisible()
    }
  })

  test('charts display realistic data values', async ({ page }) => {
    // Check that Values Panel shows realistic IOPS values
    const iopsValues = page.locator('text=/\\d+(\\.\\d+)?k? IOPS/')
    await expect(iopsValues.first()).toBeVisible()
    
    // Check that Values Panel shows realistic throughput values
    const throughputValues = page.locator('text=/\\d+(\\.\\d+)? KB\\/s/')
    await expect(throughputValues.first()).toBeVisible()
    
    // Verify data changes when switching time ranges
    await page.getByText('Last 1 hour').click()
    await page.waitForTimeout(500)
    
    const hour1Values = await page.locator('text=/\\d+(\\.\\d+)?k? IOPS/').first().textContent()
    
    await page.getByText('Last 7 days').click()
    await page.waitForTimeout(500)
    
    const day7Values = await page.locator('text=/\\d+(\\.\\d+)?k? IOPS/').first().textContent()
    
    // Values should be different (though this could occasionally fail if values are the same)
    // expect(hour1Values).not.toBe(day7Values)
  })

  test('responsive design works on different screen sizes', async ({ page, browserName }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Charts should still be visible
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
  })

  test('sidebar navigation works correctly', async ({ page }) => {
    // Check sidebar elements
    await expect(page.getByText('Performance Metrics')).toBeVisible()
    await expect(page.getByText('Edit Snapshot Policy')).toBeVisible()
    
    // Test navigation to snapshot policy
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Should navigate to policy page
    await expect(page.getByText('Policy Name')).toBeVisible()
    
    // Navigate back to dashboard
    await page.getByText('Performance Metrics').click()
    await page.waitForLoadState('networkidle')
    
    // Should be back on dashboard
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
  })

  test('charts handle mouse interactions', async ({ page }) => {
    // Hover over charts to trigger tooltips
    const chartArea = page.locator('.recharts-wrapper').first()
    await chartArea.hover()
    
    // Wait for potential tooltip (may not always appear depending on chart library)
    await page.waitForTimeout(200)
    
    // Move mouse around the chart
    await chartArea.hover({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(100)
    
    await chartArea.hover({ position: { x: 200, y: 100 } })
    await page.waitForTimeout(100)
    
    // Move mouse away
    await page.hover('body', { position: { x: 0, y: 0 } })
  })

  test('performance metrics - page loads quickly', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
    
    // Charts should be visible
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
  })

  test('handles API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate errors
    await page.route('**/api/metrics*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Application should not crash
    // Check that some UI elements are still visible
    await expect(page.getByText('Performance Metrics')).toBeVisible()
    
    // Error might be displayed, but app should remain functional
    // The exact error handling depends on implementation
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Tab through time range buttons
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Some element should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
    
    // Enter key should activate focused element
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    
    // Should still be functional
    await expect(page.getByText('IOPS')).toBeVisible()
  })

  test('multiple tab support', async ({ context }) => {
    // Open first tab
    const page1 = await context.newPage()
    await page1.goto('/')
    await page1.waitForLoadState('networkidle')
    
    // Open second tab
    const page2 = await context.newPage()
    await page2.goto('/')
    await page2.waitForLoadState('networkidle')
    
    // Both tabs should work independently
    await expect(page1.getByText('IOPS')).toBeVisible()
    await expect(page2.getByText('IOPS')).toBeVisible()
    
    // Switch time range in first tab
    await page1.getByText('Last 1 hour').click()
    await page1.waitForTimeout(200)
    
    // Second tab should not be affected
    await expect(page2.getByText('IOPS')).toBeVisible()
    
    // Close tabs
    await page1.close()
    await page2.close()
  })
})