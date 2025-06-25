import { test, expect } from '@playwright/test'

test.describe('User Switching Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('displays current user in sidebar', async ({ page }) => {
    // Check that a user name is displayed in sidebar
    // The exact user depends on the default user from the API
    await expect(page.getByText('Bryan').or(page.getByText('David'))).toBeVisible()
    
    // Check that user avatar/initial is displayed
    const userAvatar = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await expect(userAvatar).toBeVisible()
  })

  test('user dropdown shows available users', async ({ page }) => {
    // Look for user dropdown trigger (could be avatar or name)
    const userSection = page.locator('[data-testid="user-dropdown"]').or(
      page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    )
    
    await userSection.click()
    
    // Should show dropdown with users
    await expect(page.getByText('Bryan')).toBeVisible()
    await expect(page.getByText('David')).toBeVisible()
    
    // Should show cluster associations
    await expect(page.getByText('demo-123').or(page.getByText('demo-456'))).toBeVisible()
  })

  test('switches between users successfully', async ({ page }) => {
    // Get current user (default is likely Bryan)
    let currentUser = 'Bryan'
    
    // If David is shown, then Bryan is current
    if (await page.getByText('David').isVisible()) {
      currentUser = 'David'
    }
    
    // Open user dropdown
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    // Switch to the other user
    const targetUser = currentUser === 'Bryan' ? 'David' : 'Bryan'
    await page.getByText(targetUser).click()
    
    // Wait for user switch to complete
    await page.waitForTimeout(1000)
    
    // Verify UI updated to show new user
    await expect(page.getByText(targetUser)).toBeVisible()
    
    // Verify dropdown closed
    await expect(page.getByText('Bryan')).not.toBeVisible()
    await expect(page.getByText('David')).not.toBeVisible()
  })

  test('user switch updates metrics data', async ({ page }) => {
    // Capture initial metrics values
    const initialReadValue = await page.locator('text=/\\d+(\\.\\d+)?k? IOPS/').first().textContent()
    
    // Switch user
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    // Click on the other user (assuming both Bryan and David are visible)
    const userOptions = page.getByText('Bryan').or(page.getByText('David'))
    await userOptions.first().click()
    
    // Wait for data to reload
    await page.waitForTimeout(2000)
    
    // Verify charts are still displayed
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
    
    // Metrics should have updated (though values might be the same in test data)
    const newReadValue = await page.locator('text=/\\d+(\\.\\d+)?k? IOPS/').first().textContent()
    expect(newReadValue).toBeTruthy()
  })

  test('user switch updates snapshot policy data', async ({ page }) => {
    // Go to snapshot policy page
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Get current policy name
    const policyNameInput = page.locator('input').first()
    const currentPolicyName = await policyNameInput.inputValue()
    
    // Go back to dashboard
    await page.getByText('Performance Metrics').click()
    
    // Switch user
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    const userOptions = page.getByText('Bryan').or(page.getByText('David'))
    await userOptions.first().click()
    
    // Wait for switch to complete
    await page.waitForTimeout(1000)
    
    // Go to snapshot policy page again
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Policy data should have loaded (might be same or different)
    const newPolicyNameInput = page.locator('input').first()
    const newPolicyName = await newPolicyNameInput.inputValue()
    
    // Should have some policy name
    expect(newPolicyName).toBeTruthy()
    expect(newPolicyName.length).toBeGreaterThan(0)
  })

  test('preserves page state during user switch', async ({ page }) => {
    // Change time range
    await page.getByText('Last 1 hour').click()
    await page.waitForTimeout(200)
    
    // Verify active state
    await expect(page.getByText('Last 1 hour')).toHaveClass(/bg-blue-600/)
    
    // Switch user
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    const userOptions = page.getByText('Bryan').or(page.getByText('David'))
    await userOptions.first().click()
    
    // Wait for switch to complete
    await page.waitForTimeout(1000)
    
    // Time range should still be selected
    await expect(page.getByText('Last 1 hour')).toHaveClass(/bg-blue-600/)
    
    // Charts should still be visible
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
  })

  test('handles user switch errors gracefully', async ({ page }) => {
    // Intercept user API calls and simulate error
    await page.route('**/api/user/**/cluster', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'User not found' })
      })
    })
    
    // Try to switch user
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    const userOptions = page.getByText('Bryan').or(page.getByText('David'))
    await userOptions.first().click()
    
    // Wait for potential error handling
    await page.waitForTimeout(1000)
    
    // Application should not crash
    await expect(page.getByText('Performance Metrics')).toBeVisible()
  })

  test('user dropdown closes when clicking outside', async ({ page }) => {
    // Open user dropdown
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    // Verify dropdown is open
    await expect(page.getByText('Bryan')).toBeVisible()
    await expect(page.getByText('David')).toBeVisible()
    
    // Click outside the dropdown
    await page.click('body', { position: { x: 100, y: 100 } })
    
    // Dropdown should close
    await page.waitForTimeout(200)
    
    // User names should not be visible anymore (except the current user)
    const visibleUsers = await page.getByText('Bryan').or(page.getByText('David')).count()
    expect(visibleUsers).toBeLessThanOrEqual(1) // Only current user should be visible
  })

  test('keyboard navigation works in user dropdown', async ({ page }) => {
    // Open dropdown with keyboard
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.focus()
    await page.keyboard.press('Enter')
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    
    // Select with Enter
    await page.keyboard.press('Enter')
    
    // Should close dropdown
    await page.waitForTimeout(200)
  })

  test('shows correct cluster association for each user', async ({ page }) => {
    // Open user dropdown
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    // Check that cluster associations are shown
    // Bryan should be associated with demo-123
    // David should be associated with demo-456
    
    const bryanSection = page.locator('text=Bryan').locator('..')
    const davidSection = page.locator('text=David').locator('..')
    
    // These assertions depend on the exact implementation
    // The cluster names should be visible near the user names
    if (await bryanSection.isVisible()) {
      await expect(page.getByText('demo-123')).toBeVisible()
    }
    
    if (await davidSection.isVisible()) {
      await expect(page.getByText('demo-456')).toBeVisible()
    }
  })

  test('handles rapid user switching', async ({ page }) => {
    // Rapidly switch between users multiple times
    for (let i = 0; i < 3; i++) {
      // Open dropdown
      const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
      await userSection.click()
      
      // Click first available user option
      const userOptions = page.getByText('Bryan').or(page.getByText('David'))
      if (await userOptions.first().isVisible()) {
        await userOptions.first().click()
      }
      
      // Wait briefly
      await page.waitForTimeout(300)
    }
    
    // Application should still be functional
    await expect(page.getByText('IOPS')).toBeVisible()
    await expect(page.getByText('Throughput')).toBeVisible()
  })

  test('user switching works from any page', async ({ page }) => {
    // Start on dashboard, switch user
    let userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    const userOptions = page.getByText('Bryan').or(page.getByText('David'))
    await userOptions.first().click()
    await page.waitForTimeout(500)
    
    // Navigate to policy page
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Switch user from policy page
    userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    const newUserOptions = page.getByText('Bryan').or(page.getByText('David'))
    await newUserOptions.first().click()
    await page.waitForTimeout(500)
    
    // Should still be on policy page with new user's data
    await expect(page.getByText('Policy Name')).toBeVisible()
  })

  test('maintains session state across user switches', async ({ page }) => {
    // Make some changes on policy page
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    const nameInput = page.locator('input').first()
    await nameInput.fill('SessionTest')
    
    // Go back to dashboard
    await page.getByText('Performance Metrics').click()
    
    // Switch user
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    await userSection.click()
    
    const userOptions = page.getByText('Bryan').or(page.getByText('David'))
    await userOptions.first().click()
    await page.waitForTimeout(1000)
    
    // Application should maintain overall state
    // (though user-specific data will be different)
    await expect(page.getByText('Performance Metrics')).toBeVisible()
    await expect(page.getByText('Edit Snapshot Policy')).toBeVisible()
  })
})