import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for charts to load and stabilize
    await page.waitForTimeout(2000)
  })

  test('dashboard layout matches design', async ({ page }) => {
    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-full-page.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('metrics charts render consistently', async ({ page }) => {
    // Screenshot just the charts area
    const chartsContainer = page.locator('[data-testid="metrics-charts"]').first()
    if (await chartsContainer.isVisible()) {
      await expect(chartsContainer).toHaveScreenshot('metrics-charts.png', {
        animations: 'disabled'
      })
    } else {
      // Fallback to a broader selector if specific testid doesn't exist
      const chartArea = page.locator('.recharts-wrapper').first()
      await expect(chartArea).toHaveScreenshot('metrics-charts-fallback.png', {
        animations: 'disabled'
      })
    }
  })

  test('charts render correctly across all time ranges', async ({ page }) => {
    const timeRanges = [
      { label: 'Last 1 hour', filename: 'charts-1h.png' },
      { label: 'Last 6 hours', filename: 'charts-6h.png' },
      { label: 'Last 24 hours', filename: 'charts-24h.png' },
      { label: 'Last 7 days', filename: 'charts-7d.png' },
      { label: 'Last 30 days', filename: 'charts-30d.png' },
      { label: 'Last 90 days', filename: 'charts-90d.png' }
    ]

    for (const range of timeRanges) {
      // Click time range button
      await page.getByText(range.label).click()
      
      // Wait for charts to update
      await page.waitForTimeout(1000)
      
      // Take screenshot of charts area
      const chartArea = page.locator('.recharts-wrapper').first()
      if (await chartArea.isVisible()) {
        await expect(chartArea).toHaveScreenshot(range.filename, {
          animations: 'disabled'
        })
      }
    }
  })

  test('sidebar layout remains consistent', async ({ page }) => {
    const sidebar = page.locator('nav').first().or(page.locator('[data-testid="sidebar"]'))
    
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('sidebar-layout.png', {
        animations: 'disabled'
      })
    }
  })

  test('values panel displays correctly', async ({ page }) => {
    // Find values panel (right side of charts)
    const valuesPanel = page.locator('text=Read').locator('..').or(
      page.locator('[data-testid="values-panel"]')
    )
    
    if (await valuesPanel.isVisible()) {
      await expect(valuesPanel).toHaveScreenshot('values-panel.png', {
        animations: 'disabled'
      })
    }
  })

  test('time range selector styling', async ({ page }) => {
    const timeRangeSelector = page.locator('text=Last 1 hour').locator('..').or(
      page.locator('[data-testid="time-range-selector"]')
    )
    
    if (await timeRangeSelector.isVisible()) {
      await expect(timeRangeSelector).toHaveScreenshot('time-range-selector.png', {
        animations: 'disabled'
      })
    }
  })

  test('snapshot policy form layout', async ({ page }) => {
    // Navigate to policy page
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Take screenshot of the form
    await expect(page).toHaveScreenshot('snapshot-policy-form.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('policy form sections render correctly', async ({ page }) => {
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Screenshot specific form sections
    const scheduleSection = page.locator('text=Run Policy on the Following Schedule').locator('..')
    if (await scheduleSection.isVisible()) {
      await expect(scheduleSection).toHaveScreenshot('policy-schedule-section.png', {
        animations: 'disabled'
      })
    }
    
    const lockingSection = page.locator('text=Snapshot Locking').locator('..')
    if (await lockingSection.isVisible()) {
      await expect(lockingSection).toHaveScreenshot('policy-locking-section.png', {
        animations: 'disabled'
      })
    }
  })

  test('user dropdown appearance', async ({ page }) => {
    // Open user dropdown
    const userSection = page.locator('.bg-blue-600').filter({ hasText: /[BD]/ })
    if (await userSection.isVisible()) {
      await userSection.click()
      await page.waitForTimeout(300)
      
      // Screenshot the dropdown
      const dropdown = page.locator('text=Bryan').locator('..').or(
        page.locator('[data-testid="user-dropdown-menu"]')
      )
      
      if (await dropdown.isVisible()) {
        await expect(dropdown).toHaveScreenshot('user-dropdown.png', {
          animations: 'disabled'
        })
      }
    }
  })

  test('responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Screenshot mobile layout
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('responsive design - tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Screenshot tablet layout
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('charts hover states', async ({ page }) => {
    // Hover over chart to show tooltip
    const chartArea = page.locator('.recharts-wrapper').first()
    if (await chartArea.isVisible()) {
      await chartArea.hover({ position: { x: 200, y: 100 } })
      await page.waitForTimeout(500)
      
      // Screenshot with hover state
      await expect(chartArea).toHaveScreenshot('chart-hover-state.png', {
        animations: 'disabled'
      })
    }
  })

  test('active time range button styling', async ({ page }) => {
    // Click different time ranges and capture active states
    const timeRanges = ['Last 1 hour', 'Last 7 days', 'Last 90 days']
    
    for (const range of timeRanges) {
      await page.getByText(range).click()
      await page.waitForTimeout(300)
      
      const activeButton = page.getByText(range)
      const filename = `active-button-${range.replace(/\s+/g, '-').toLowerCase()}.png`
      
      await expect(activeButton).toHaveScreenshot(filename, {
        animations: 'disabled'
      })
    }
  })

  test('form validation states', async ({ page }) => {
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Clear required field to trigger validation
    const nameInput = page.locator('input').first()
    await nameInput.fill('')
    
    // Try to submit
    await page.getByText('Save Policy').click()
    await page.waitForTimeout(500)
    
    // Screenshot form with potential validation errors
    await expect(page).toHaveScreenshot('form-validation-state.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('cancel confirmation dialog styling', async ({ page }) => {
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Make changes and trigger cancel dialog
    const nameInput = page.locator('input').first()
    await nameInput.fill('TestChange')
    
    await page.getByText('Cancel').click()
    await page.waitForTimeout(300)
    
    // Screenshot the modal dialog
    const dialog = page.locator('text=Confirm Cancel').locator('..')
    if (await dialog.isVisible()) {
      await expect(dialog).toHaveScreenshot('cancel-confirmation-dialog.png', {
        animations: 'disabled'
      })
    }
  })

  test('different schedule type form states', async ({ page }) => {
    await page.getByText('Edit Snapshot Policy').click()
    await page.waitForLoadState('networkidle')
    
    // Screenshot daily schedule state
    const scheduleSelect = page.locator('select').first()
    await scheduleSelect.selectOption('daily')
    await page.waitForTimeout(300)
    
    const scheduleSection = page.locator('text=On the Following Day(s)').locator('..')
    if (await scheduleSection.isVisible()) {
      await expect(scheduleSection).toHaveScreenshot('schedule-daily-state.png', {
        animations: 'disabled'
      })
    }
    
    // Screenshot weekly schedule state
    await scheduleSelect.selectOption('weekly')
    await page.waitForTimeout(300)
    
    if (await scheduleSection.isVisible()) {
      await expect(scheduleSection).toHaveScreenshot('schedule-weekly-state.png', {
        animations: 'disabled'
      })
    }
  })

  test('cross-browser consistency', async ({ page, browserName }) => {
    // Take browser-specific screenshots to compare consistency
    await expect(page).toHaveScreenshot(`dashboard-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled'
    })
    
    // Charts should render consistently across browsers
    const chartArea = page.locator('.recharts-wrapper').first()
    if (await chartArea.isVisible()) {
      await expect(chartArea).toHaveScreenshot(`charts-${browserName}.png`, {
        animations: 'disabled'
      })
    }
  })

  test('dark theme consistency', async ({ page }) => {
    // The app appears to use a dark theme
    // Verify dark theme elements are consistent
    
    // Take screenshots of key dark theme elements
    const sidebar = page.locator('nav').first()
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('dark-theme-sidebar.png', {
        animations: 'disabled'
      })
    }
    
    const chartContainer = page.locator('.recharts-wrapper').first()
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toHaveScreenshot('dark-theme-charts.png', {
        animations: 'disabled'
      })
    }
  })

  test('loading states appearance', async ({ page }) => {
    // Intercept API to simulate slow loading
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })
    
    // Reload to trigger loading state
    await page.reload()
    
    // Try to capture loading state (timing dependent)
    await page.waitForTimeout(200)
    
    // Screenshot potential loading state
    await expect(page).toHaveScreenshot('loading-state.png', {
      animations: 'disabled'
    })
  })
})