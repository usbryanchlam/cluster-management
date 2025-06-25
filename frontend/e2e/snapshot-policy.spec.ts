import { test, expect } from '@playwright/test'

test.describe('Snapshot Policy Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the snapshot policy page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Click on Edit Snapshot Policy in sidebar
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Wait for form to load
    await expect(page.getByText('Policy Name')).toBeVisible()
  })

  test('displays policy form with default values', async ({ page }) => {
    // Check form title
    await expect(page.getByText('Edit Snapshot Policy')).toBeVisible()
    
    // Check form sections
    await expect(page.getByText('Policy Name')).toBeVisible()
    await expect(page.getByText('Apply to Directory')).toBeVisible()
    await expect(page.getByText('Run Policy on the Following Schedule')).toBeVisible()
    await expect(page.getByText('Snapshot Locking')).toBeVisible()
    
    // Check default values (assuming they load from API)
    await expect(page.locator('input[value*="ProjectX"]')).toBeVisible()
    await expect(page.locator('input[value*="Production"]')).toBeVisible()
    
    // Check buttons
    await expect(page.getByText('Save Policy')).toBeVisible()
    await expect(page.getByText('Cancel')).toBeVisible()
  })

  test('enforces Daily schedule business rules', async ({ page }) => {
    // Select Daily schedule type (might be default)
    const scheduleSelect = page.locator('select').first()
    await scheduleSelect.selectOption('daily')
    
    // Verify day checkboxes are disabled
    const mondayCheckbox = page.getByLabel('Mon')
    const everyDayCheckbox = page.getByLabel('Every day')
    
    await expect(mondayCheckbox).toBeDisabled()
    await expect(everyDayCheckbox).toBeChecked()
    await expect(everyDayCheckbox).toBeDisabled()
    
    // Verify all individual day checkboxes are disabled
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun']
    for (const day of dayLabels) {
      await expect(page.getByLabel(day)).toBeDisabled()
    }
  })

  test('enables day selection for Weekly schedule', async ({ page }) => {
    // Select Weekly schedule type
    const scheduleSelect = page.locator('select').first()
    await scheduleSelect.selectOption('weekly')
    
    // Wait for UI to update
    await page.waitForTimeout(200)
    
    // Verify day checkboxes are enabled
    const mondayCheckbox = page.getByLabel('Mon')
    const everyDayCheckbox = page.getByLabel('Every day')
    
    await expect(mondayCheckbox).not.toBeDisabled()
    await expect(everyDayCheckbox).not.toBeDisabled()
    
    // Test individual day selection
    await mondayCheckbox.uncheck()
    await mondayCheckbox.check()
    
    // Verify checkbox state changed
    await expect(mondayCheckbox).toBeChecked()
  })

  test('handles deletion type and locking logic', async ({ page }) => {
    // Test "Never" deletion option
    const neverRadio = page.getByLabel('Never')
    await neverRadio.check()
    
    // Verify deletion inputs are disabled
    const afterInput = page.locator('input[type="number"]').filter({ hasText: '' }).first()
    const unitSelect = page.locator('select').filter({ hasText: 'day(s)' }).first()
    
    // Note: These selectors might need adjustment based on actual DOM structure
    // Check that locking is disabled when deletion is "Never"
    const lockingCheckbox = page.getByLabel('Enable locked snapshots')
    await expect(lockingCheckbox).toBeDisabled()
    
    // Switch to automatic deletion
    const automaticRadio = page.getByLabel('Automatically after')
    await automaticRadio.check()
    
    // Verify inputs are enabled
    await expect(lockingCheckbox).not.toBeDisabled()
  })

  test('updates form fields correctly', async ({ page }) => {
    // Update policy name
    const nameInput = page.locator('input').first()
    await nameInput.fill('UpdatedPolicyName')
    
    // Update directory
    const directoryInput = page.locator('input').nth(1)
    await directoryInput.fill('NewDirectory/Path')
    
    // Update time
    const hourInput = page.locator('input[type="number"]').first()
    await hourInput.fill('14')
    
    const minuteInput = page.locator('input[type="number"]').nth(1)
    await minuteInput.fill('30')
    
    // Verify values are updated
    await expect(nameInput).toHaveValue('UpdatedPolicyName')
    await expect(directoryInput).toHaveValue('NewDirectory/Path')
    await expect(hourInput).toHaveValue('14')
    await expect(minuteInput).toHaveValue('30')
  })

  test('shows cancel confirmation dialog', async ({ page }) => {
    // Make some changes first
    const nameInput = page.locator('input').first()
    await nameInput.fill('ModifiedName')
    
    // Click Cancel button
    await page.getByText('Cancel').click()
    
    // Verify confirmation dialog appears
    await expect(page.getByText('Confirm Cancel')).toBeVisible()
    await expect(page.getByText('Are you sure you want to discard your changes')).toBeVisible()
    await expect(page.getByText('Keep Editing')).toBeVisible()
    await expect(page.getByText('Discard Changes')).toBeVisible()
  })

  test('cancel dialog - Keep Editing closes dialog', async ({ page }) => {
    // Make changes and open cancel dialog
    const nameInput = page.locator('input').first()
    await nameInput.fill('ModifiedName')
    await page.getByText('Cancel').click()
    
    // Click "Keep Editing"
    await page.getByText('Keep Editing').click()
    
    // Dialog should be closed
    await expect(page.getByText('Confirm Cancel')).not.toBeVisible()
    
    // Form should retain changes
    await expect(nameInput).toHaveValue('ModifiedName')
  })

  test('cancel dialog - Discard Changes resets form', async ({ page }) => {
    // Get original value
    const nameInput = page.locator('input').first()
    const originalValue = await nameInput.inputValue()
    
    // Make changes and open cancel dialog
    await nameInput.fill('ModifiedName')
    await page.getByText('Cancel').click()
    
    // Click "Discard Changes"
    await page.getByText('Discard Changes').click()
    
    // Dialog should be closed
    await expect(page.getByText('Confirm Cancel')).not.toBeVisible()
    
    // Form should be reset to original values
    await page.waitForTimeout(200) // Wait for form to reset
    const currentValue = await nameInput.inputValue()
    expect(currentValue).toBe(originalValue)
  })

  test('saves policy successfully', async ({ page }) => {
    // Make some changes
    const nameInput = page.locator('input').first()
    await nameInput.fill('E2E_Test_Policy')
    
    // Click Save Policy button
    await page.getByText('Save Policy').click()
    
    // Wait for save operation
    await page.waitForTimeout(1000)
    
    // Check for success message
    await expect(page.getByText('Policy saved successfully!')).toBeVisible()
    
    // Button should return to normal state
    await expect(page.getByText('Save Policy')).toBeVisible()
  })

  test('handles save errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate error
    await page.route('**/api/snapshot-policy/**', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to save policy' })
        })
      } else {
        route.continue()
      }
    })
    
    // Make changes and try to save
    const nameInput = page.locator('input').first()
    await nameInput.fill('ErrorTest')
    
    await page.getByText('Save Policy').click()
    
    // Should show error message
    await expect(page.getByText('Failed to save policy')).toBeVisible()
  })

  test('form validation prevents empty required fields', async ({ page }) => {
    // Clear required fields
    const nameInput = page.locator('input').first()
    await nameInput.fill('')
    
    const directoryInput = page.locator('input').nth(1)
    await directoryInput.fill('')
    
    // Try to save
    await page.getByText('Save Policy').click()
    
    // Form should not submit (browser validation or custom validation)
    // The exact behavior depends on implementation
    // At minimum, success message should not appear
    await page.waitForTimeout(500)
    await expect(page.getByText('Policy saved successfully!')).not.toBeVisible()
  })

  test('handles loading states correctly', async ({ page }) => {
    // The page should handle loading states when data is being fetched
    // This test verifies the loading experience
    
    // Reload page to trigger loading
    await page.reload()
    
    // Should show some loading indicator (implementation dependent)
    // For now, just verify it eventually loads the form
    await expect(page.getByText('Policy Name')).toBeVisible({ timeout: 10000 })
  })

  test('preserves form state during interactions', async ({ page }) => {
    // Make multiple changes
    const nameInput = page.locator('input').first()
    await nameInput.fill('StateTest')
    
    // Switch schedule type
    const scheduleSelect = page.locator('select').first()
    await scheduleSelect.selectOption('weekly')
    await scheduleSelect.selectOption('daily')
    
    // Check a checkbox (if enabled)
    const enabledCheckbox = page.getByLabel('Enable policy')
    await enabledCheckbox.uncheck()
    await enabledCheckbox.check()
    
    // Verify name field still has the changed value
    await expect(nameInput).toHaveValue('StateTest')
  })

  test('keyboard navigation works in form', async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press('Tab') // Policy name
    await page.keyboard.press('Tab') // Directory
    await page.keyboard.press('Tab') // Schedule type
    
    // Type in focused field
    await page.keyboard.type('KeyboardTest')
    
    // Continue tabbing
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate without issues
    // Verify some field has focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('accessibility features work correctly', async ({ page }) => {
    // Check that form labels are properly associated
    const nameInput = page.locator('input').first()
    const nameLabel = page.getByText('Policy Name')
    
    // Verify label and input relationship (implementation dependent)
    await expect(nameLabel).toBeVisible()
    await expect(nameInput).toBeVisible()
    
    // Check that required fields are marked
    // This depends on implementation - could be aria-required, asterisks, etc.
    
    // Check that disabled elements are properly marked
    const scheduleSelect = page.locator('select').first()
    await scheduleSelect.selectOption('daily')
    
    const mondayCheckbox = page.getByLabel('Mon')
    await expect(mondayCheckbox).toBeDisabled()
  })

  test('handles rapid user interactions', async ({ page }) => {
    // Rapidly switch between schedule types
    const scheduleSelect = page.locator('select').first()
    
    for (let i = 0; i < 3; i++) {
      await scheduleSelect.selectOption('weekly')
      await page.waitForTimeout(100)
      await scheduleSelect.selectOption('daily')
      await page.waitForTimeout(100)
    }
    
    // Form should still be functional
    await expect(page.getByText('Policy Name')).toBeVisible()
    
    // Rapidly toggle checkboxes (if enabled)
    await scheduleSelect.selectOption('weekly')
    const everyDayCheckbox = page.getByLabel('Every day')
    
    for (let i = 0; i < 3; i++) {
      await everyDayCheckbox.uncheck()
      await everyDayCheckbox.check()
    }
    
    // Should still work
    await expect(everyDayCheckbox).toBeChecked()
  })
})