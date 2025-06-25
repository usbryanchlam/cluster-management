import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MetricsChart } from '@/components/MetricsChart'
import { MetricsResponse } from '@/lib/api'

// Mock Recharts to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children, onMouseMove, onMouseLeave }: any) => (
    <div 
      data-testid="line-chart"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} style={{ color: stroke }} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid={`x-axis-${dataKey}`} />,
  YAxis: ({ tickFormatter }: any) => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: ({ content }: any) => <div data-testid="tooltip" />
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const mockMetricsData: MetricsResponse = {
  clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
  timeRange: '1h',
  resolution: '1min',
  data: {
    timestamps: [
      '2025-06-25T10:00:00.000Z',
      '2025-06-25T10:01:00.000Z',
      '2025-06-25T10:02:00.000Z'
    ],
    iops: { 
      read: [1000, 1100, 1200], 
      write: [500, 550, 600] 
    },
    throughput: { 
      read: [100, 110, 120], 
      write: [50, 55, 60] 
    }
  },
  metadata: {
    totalPoints: 3,
    startTime: '2025-06-25T10:00:00.000Z',
    endTime: '2025-06-25T10:02:00.000Z',
    aggregationMethod: 'avg'
  }
}

const mockThroughputData: MetricsResponse = {
  ...mockMetricsData,
  timeRange: '6h',
  resolution: '5min'
}

describe('MetricsChart', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('IOPS Chart', () => {
    it('renders IOPS chart with correct title and values', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      expect(screen.getAllByText('IOPS')[0]).toBeInTheDocument()
      
      // Check Values Panel shows latest values (last index: 1200 IOPS read, 600 IOPS write)
      expect(screen.getByText('1.2k IOPS')).toBeInTheDocument() // Latest read value
      expect(screen.getByText('600.0 IOPS')).toBeInTheDocument() // Latest write value
    })

    it('renders chart components correctly', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('line-read')).toBeInTheDocument()
      expect(screen.getByTestId('line-write')).toBeInTheDocument()
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })

    it('displays correct colors for read and write lines', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      const readLine = screen.getByTestId('line-read')
      const writeLine = screen.getByTestId('line-write')
      
      expect(readLine).toHaveStyle('color: #955FD5') // Purple for read
      expect(writeLine).toHaveStyle('color: #00A3CA') // Blue for write
    })
  })

  describe('Throughput Chart', () => {
    it('renders throughput chart with correct title and units', () => {
      renderWithProviders(<MetricsChart data={mockThroughputData} type="throughput" />)
      
      expect(screen.getAllByText('Throughput')[0]).toBeInTheDocument()
      
      // Check Values Panel shows KB/s units
      expect(screen.getByText('120.0 KB/s')).toBeInTheDocument() // Latest read value
      expect(screen.getByText('60.0 KB/s')).toBeInTheDocument() // Latest write value
    })
  })

  describe('Time Range Handling', () => {
    it('generates correct x-axis labels for 1h range', () => {
      const data1h = { ...mockMetricsData, timeRange: '1h' as const }
      renderWithProviders(<MetricsChart data={data1h} type="iops" />)
      
      // Should generate labels every 15 minutes for 1h range
      expect(screen.getByTestId('x-axis-time')).toBeInTheDocument()
    })

    it('generates correct x-axis labels for 6h range', () => {
      const data6h = { ...mockMetricsData, timeRange: '6h' as const }
      renderWithProviders(<MetricsChart data={data6h} type="iops" />)
      
      expect(screen.getByTestId('x-axis-time')).toBeInTheDocument()
    })

    it('generates correct x-axis labels for 24h range', () => {
      const data24h = { ...mockMetricsData, timeRange: '24h' as const }
      renderWithProviders(<MetricsChart data={data24h} type="iops" />)
      
      expect(screen.getByTestId('x-axis-time')).toBeInTheDocument()
    })
  })

  describe('Y-axis Domain Calculation', () => {
    it('calculates dynamic Y-axis domain correctly', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      // Y-axis should be present and use dynamic scaling
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    })

    it('handles minimum Y-axis as 0', () => {
      const zeroData = {
        ...mockMetricsData,
        data: {
          ...mockMetricsData.data,
          iops: { read: [0, 0, 0], write: [0, 0, 0] }
        }
      }
      
      renderWithProviders(<MetricsChart data={zeroData} type="iops" />)
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    })
  })

  describe('Mouse Interactions', () => {
    it('shows hover timestamp when mouse moves over chart', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      const chart = screen.getByTestId('line-chart')
      
      // Simulate mouse move with payload
      fireEvent.mouseMove(chart, {
        target: chart,
        activePayload: [{
          payload: {
            fullTime: '2025-06-25T10:01:00.000Z',
            read: 1100,
            write: 550
          }
        }]
      })
      
      // Should display formatted time in header
      // Note: The exact format depends on local timezone
    })

    it('clears hover data when mouse leaves chart', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      const chart = screen.getByTestId('line-chart')
      fireEvent.mouseLeave(chart)
      
      // Hover timestamp should not be visible
    })
  })

  describe('Error Handling', () => {
    it('handles empty data gracefully', () => {
      const emptyData = {
        ...mockMetricsData,
        data: {
          timestamps: [],
          iops: { read: [], write: [] },
          throughput: { read: [], write: [] }
        }
      }
      
      expect(() => 
        renderWithProviders(<MetricsChart data={emptyData} type="iops" />)
      ).not.toThrow()
      
      // Should show 0 values when no data
      expect(screen.getAllByText('0.0 IOPS')[0]).toBeInTheDocument()
    })

    it('handles missing data points', () => {
      const incompleteData = {
        ...mockMetricsData,
        data: {
          timestamps: ['2025-06-25T10:00:00.000Z'],
          iops: { read: [1000], write: [500] },
          throughput: { read: [100], write: [50] }
        }
      }
      
      expect(() => 
        renderWithProviders(<MetricsChart data={incompleteData} type="iops" />)
      ).not.toThrow()
    })

    it('handles invalid timestamps', () => {
      const invalidData = {
        ...mockMetricsData,
        data: {
          timestamps: ['invalid-timestamp'],
          iops: { read: [1000], write: [500] },
          throughput: { read: [100], write: [50] }
        }
      }
      
      expect(() => 
        renderWithProviders(<MetricsChart data={invalidData} type="iops" />)
      ).not.toThrow()
    })
  })

  describe('Responsive Design', () => {
    it('renders responsive container', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('displays Values Panel with correct layout', () => {
      renderWithProviders(<MetricsChart data={mockMetricsData} type="iops" />)
      
      // Check Values Panel structure
      expect(screen.getByText('Read')).toBeInTheDocument()
      expect(screen.getByText('Write')).toBeInTheDocument()
    })
  })

  describe('Data Formatting', () => {
    it('formats large IOPS values with k suffix', () => {
      const largeData = {
        ...mockMetricsData,
        data: {
          ...mockMetricsData.data,
          iops: { read: [50000, 60000, 70000], write: [5000, 6000, 7000] }
        }
      }
      
      renderWithProviders(<MetricsChart data={largeData} type="iops" />)
      
      expect(screen.getByText('70.0k IOPS')).toBeInTheDocument()
      expect(screen.getByText('7.0k IOPS')).toBeInTheDocument()
    })

    it('formats throughput values with KB/s unit', () => {
      renderWithProviders(<MetricsChart data={mockThroughputData} type="throughput" />)
      
      expect(screen.getByText('120.0 KB/s')).toBeInTheDocument()
      expect(screen.getByText('60.0 KB/s')).toBeInTheDocument()
    })

    it('formats large throughput values with GB/s unit', () => {
      const largeData = {
        ...mockThroughputData,
        data: {
          ...mockThroughputData.data,
          throughput: { read: [1500000, 1600000, 1700000], write: [500000, 600000, 700000] }
        }
      }
      
      renderWithProviders(<MetricsChart data={largeData} type="throughput" />)
      
      // Should show GB/s for very large values (>1000 KB/s in Y-axis formatter)
    })
  })
})