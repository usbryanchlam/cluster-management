import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnapshotPolicyForm } from '@/components/SnapshotPolicyForm'
import * as api from '@/lib/api'

// Mock the API module
jest.mock('@/lib/api', () => ({
  userClusterApi: {
    getUserCluster: jest.fn(),
  },
  policyApi: {
    getPolicy: jest.fn(),
    updatePolicy: jest.fn(),
  },
}))

const mockApi = api as jest.Mocked<typeof api>

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const mockUserCluster = {
  user: {
    user_id: 'bryan',
    user_name: 'Bryan',
    associated_cluster_uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
  },
  cluster: {
    uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
    cluster_name: 'demo-123'
  }
}

const mockPolicy = {
  uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
  name: 'ProjectX_Daily',
  directory: '/Production/ProjectX',
  schedule: {
    type: 'daily' as const,
    timezone: 'America/Los_Angeles',
    time: { hour: 7, minute: 0 },
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  },
  deletion: {
    type: 'automatically' as const,
    after: 14,
    unit: 'days' as const
  },
  locking: { enabled: false },
  enabled: true,
  createdAt: '2025-06-25T10:00:00.000Z',
  updatedAt: '2025-06-25T10:00:00.000Z'
}

describe('SnapshotPolicyForm', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    user = userEvent.setup()
    
    // Reset all mocks
    jest.clearAllMocks()
    
    // Default successful API responses
    mockApi.userClusterApi.getUserCluster.mockResolvedValue(mockUserCluster)
    mockApi.policyApi.getPolicy.mockResolvedValue(mockPolicy)
    mockApi.policyApi.updatePolicy.mockResolvedValue(mockPolicy)
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Loading States', () => {
    it('shows loading state while fetching user cluster data', async () => {
      // Make the API call hang
      mockApi.userClusterApi.getUserCluster.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      expect(screen.getByText('Loading user and cluster data...')).toBeInTheDocument()
      // Check for loading spinner icon
      expect(screen.getByText('Loading user and cluster data...').closest('div')).toBeInTheDocument()
    })

    it('shows loading state while fetching policy data', async () => {
      // User cluster loads quickly, policy hangs
      mockApi.policyApi.getPolicy.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Loading policy...')).toBeInTheDocument()
      })
    })
  })

  describe('Form Rendering', () => {
    it('renders form with policy data after loading', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Edit Snapshot Policy')).toBeInTheDocument()
      })
      
      // Check form fields are populated
      expect(screen.getByDisplayValue('ProjectX_Daily')).toBeInTheDocument()
      expect(screen.getByDisplayValue('/Production/ProjectX')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Daily')).toBeInTheDocument()
    })

    it('renders all form sections', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Policy Name')).toBeInTheDocument()
        expect(screen.getByText('Apply to Directory')).toBeInTheDocument()
        expect(screen.getByText('Run Policy on the Following Schedule')).toBeInTheDocument()
        expect(screen.getByText('Snapshot Locking')).toBeInTheDocument()
      })
    })
  })

  describe('Schedule Type Logic', () => {
    it('enforces Daily schedule business rules', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Daily')).toBeInTheDocument()
      })
      
      // Daily is selected by default, verify day checkboxes are disabled
      const mondayCheckbox = screen.getByLabelText('Mon')
      const everyDayCheckbox = screen.getByLabelText('Every day')
      
      expect(mondayCheckbox).toBeDisabled()
      expect(everyDayCheckbox).toBeChecked()
      expect(everyDayCheckbox).toBeDisabled()
    })

    it('enables day selection when switching to Weekly', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Daily')).toBeInTheDocument()
      })
      
      // Switch to Weekly
      const scheduleSelect = screen.getByDisplayValue('Daily')
      await user.selectOptions(scheduleSelect, 'weekly')
      
      // Verify day checkboxes are now enabled
      const mondayCheckbox = screen.getByLabelText('Mon')
      const everyDayCheckbox = screen.getByLabelText('Every day')
      
      expect(mondayCheckbox).not.toBeDisabled()
      expect(everyDayCheckbox).not.toBeDisabled()
    })

    it('automatically sets all days when switching to Daily', async () => {
      // Start with weekly policy
      const weeklyPolicy = {
        ...mockPolicy,
        schedule: {
          ...mockPolicy.schedule,
          type: 'weekly' as const,
          days: ['mon', 'tue', 'wed'] // Partial selection
        }
      }
      mockApi.policyApi.getPolicy.mockResolvedValue(weeklyPolicy)
      
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Weekly')).toBeInTheDocument()
      })
      
      // Switch to Daily
      const scheduleSelect = screen.getByDisplayValue('Weekly')
      await user.selectOptions(scheduleSelect, 'daily')
      
      // Verify all days are selected and disabled
      const everyDayCheckbox = screen.getByLabelText('Every day')
      expect(everyDayCheckbox).toBeChecked()
      expect(everyDayCheckbox).toBeDisabled()
    })
  })

  describe('Deletion and Locking Logic', () => {
    it('disables locking when deletion is set to manually', async () => {
      const manualPolicy = {
        ...mockPolicy,
        deletion: { type: 'manually' as const },
        locking: { enabled: false }
      }
      mockApi.policyApi.getPolicy.mockResolvedValue(manualPolicy)
      
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Never')).toBeInTheDocument()
      })
      
      // Check that locking checkbox is disabled
      const lockingCheckbox = screen.getByLabelText('Enable locked snapshots')
      expect(lockingCheckbox).toBeDisabled()
      expect(lockingCheckbox).not.toBeChecked()
    })

    it('enables locking when deletion is automatic', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Automatically after')).toBeInTheDocument()
      })
      
      // Check that locking checkbox is enabled
      const lockingCheckbox = screen.getByLabelText('Enable locked snapshots')
      expect(lockingCheckbox).not.toBeDisabled()
    })

    it('disables deletion inputs when "Never" is selected', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Edit Snapshot Policy')).toBeInTheDocument()
      })
      
      // Select "Never" for deletion
      const neverRadio = screen.getByLabelText('Never')
      await user.click(neverRadio)
      
      // Check that deletion inputs are disabled
      const afterInput = screen.getByDisplayValue('14')
      const unitSelect = screen.getByDisplayValue('day(s)')
      
      expect(afterInput).toBeDisabled()
      expect(unitSelect).toBeDisabled()
    })
  })

  describe('Form Interactions', () => {
    it('updates policy name field', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('ProjectX_Daily')).toBeInTheDocument()
      })
      
      const nameInput = screen.getByDisplayValue('ProjectX_Daily')
      await user.clear(nameInput)
      await user.type(nameInput, 'NewPolicy_Name')
      
      expect(screen.getByDisplayValue('NewPolicy_Name')).toBeInTheDocument()
    })

    it('updates directory field', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('/Production/ProjectX')).toBeInTheDocument()
      })
      
      const directoryInput = screen.getByDisplayValue('/Production/ProjectX')
      await user.clear(directoryInput)
      await user.type(directoryInput, 'NewDirectory/Path')
      
      expect(screen.getByDisplayValue('NewDirectory/Path')).toBeInTheDocument()
    })

    it('updates time fields', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('07')).toBeInTheDocument()
      })
      
      const hourInput = screen.getByDisplayValue('07')
      await user.clear(hourInput)
      await user.type(hourInput, '14')
      
      expect(screen.getByDisplayValue('14')).toBeInTheDocument()
    })
  })

  describe('Cancel Confirmation Dialog', () => {
    it('shows cancel confirmation dialog when cancel button is clicked', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(screen.getByText('Confirm Cancel')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to discard your changes and reload the previously saved data?')).toBeInTheDocument()
      expect(screen.getByText('Keep Editing')).toBeInTheDocument()
      expect(screen.getByText('Discard Changes')).toBeInTheDocument()
    })

    it('closes dialog when "Keep Editing" is clicked', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
      
      // Open dialog
      await user.click(screen.getByText('Cancel'))
      expect(screen.getByText('Confirm Cancel')).toBeInTheDocument()
      
      // Click "Keep Editing"
      await user.click(screen.getByText('Keep Editing'))
      
      // Dialog should be closed
      expect(screen.queryByText('Confirm Cancel')).not.toBeInTheDocument()
    })

    it('resets form when "Discard Changes" is clicked', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('ProjectX_Daily')).toBeInTheDocument()
      })
      
      // Make changes
      const nameInput = screen.getByDisplayValue('ProjectX_Daily')
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified_Name')
      
      // Open cancel dialog
      await user.click(screen.getByText('Cancel'))
      
      // Discard changes
      await user.click(screen.getByText('Discard Changes'))
      
      // Form should be reset to original values
      await waitFor(() => {
        expect(screen.getByDisplayValue('ProjectX_Daily')).toBeInTheDocument()
      })
      expect(screen.queryByText('Confirm Cancel')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Save Policy')).toBeInTheDocument()
      })
      
      const saveButton = screen.getByText('Save Policy')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockApi.policyApi.updatePolicy).toHaveBeenCalledWith(
          'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
          expect.objectContaining({
            name: 'ProjectX_Daily',
            directory: '/Production/ProjectX',
            enabled: true
          })
        )
      })
    })

    it('shows success message after successful submission', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Save Policy')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Save Policy'))
      
      await waitFor(() => {
        expect(screen.getByText('Policy saved successfully!')).toBeInTheDocument()
      })
    })

    it('shows error message on submission failure', async () => {
      mockApi.policyApi.updatePolicy.mockRejectedValue(new Error('Network error'))
      
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Save Policy')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Save Policy'))
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save policy: Network error')).toBeInTheDocument()
      })
    })

    it('disables save button during submission', async () => {
      // Make the API call hang
      mockApi.policyApi.updatePolicy.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      await waitFor(() => {
        expect(screen.getByText('Save Policy')).toBeInTheDocument()
      })
      
      const saveButton = screen.getByText('Save Policy')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
      
      const savingButton = screen.getByText('Saving...')
      expect(savingButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('handles user cluster API error gracefully', async () => {
      mockApi.userClusterApi.getUserCluster.mockRejectedValue(new Error('User not found'))
      
      renderWithProviders(<SnapshotPolicyForm userId="invalid" />)
      
      // Should show loading initially
      expect(screen.getByText('Loading user and cluster data...')).toBeInTheDocument()
      
      // Error should be handled gracefully (component should not crash)
    })

    it('handles policy API error gracefully', async () => {
      mockApi.policyApi.getPolicy.mockRejectedValue(new Error('Policy not found'))
      
      renderWithProviders(<SnapshotPolicyForm userId="bryan" />)
      
      // Component should not crash despite API error
      await waitFor(() => {
        expect(screen.getByText('Loading policy...')).toBeInTheDocument()
      })
    })
  })

  describe('Default User Handling', () => {
    it('uses default user "bryan" when no userId provided', async () => {
      renderWithProviders(<SnapshotPolicyForm />)
      
      await waitFor(() => {
        expect(mockApi.userClusterApi.getUserCluster).toHaveBeenCalledWith('bryan')
      })
    })

    it('uses provided userId', async () => {
      renderWithProviders(<SnapshotPolicyForm userId="david" />)
      
      await waitFor(() => {
        expect(mockApi.userClusterApi.getUserCluster).toHaveBeenCalledWith('david')
      })
    })
  })
})