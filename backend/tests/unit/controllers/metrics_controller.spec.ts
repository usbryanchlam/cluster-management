import { test } from '@japa/runner'
import MetricsController from '#controllers/metrics_controller'

test.group('MetricsController Unit Tests - JSON Based', (group) => {
  let controller: MetricsController

  group.setup(() => {
    controller = new MetricsController()
  })

  test('getResolution - should return 1min resolution for 1h timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const resolution = controller.getResolution('1h')
    assert.equal(resolution, '1min')
  })

  test('getResolution - should return 5min resolution for 6h timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const resolution = controller.getResolution('6h')
    assert.equal(resolution, '5min')
  })

  test('getResolution - should return 15min resolution for 24h timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const resolution = controller.getResolution('24h')
    assert.equal(resolution, '15min')
  })

  test('getResolution - should return 1h resolution for 7d timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const resolution = controller.getResolution('7d')
    assert.equal(resolution, '1h')
  })

  test('getResolution - should return 6h resolution for 30d timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const resolution = controller.getResolution('30d')
    assert.equal(resolution, '6h')
  })

  test('getResolution - should return 1d resolution for 90d timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const resolution = controller.getResolution('90d')
    assert.equal(resolution, '1d')
  })

  test('getResolution - should return default 1h resolution for invalid timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const resolution = controller.getResolution('invalid' as any)
    assert.equal(resolution, '1h')
  })

  test('getDataPointCount - should return correct data points for each time range', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    assert.equal(controller.getDataPointCount('1h'), 60)
    assert.equal(controller.getDataPointCount('6h'), 72)
    assert.equal(controller.getDataPointCount('24h'), 96)
    assert.equal(controller.getDataPointCount('7d'), 168)
    assert.equal(controller.getDataPointCount('30d'), 120)
    assert.equal(controller.getDataPointCount('90d'), 90)
  })

  test('getDataPointCount - should return default 96 points for invalid timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const count = controller.getDataPointCount('invalid' as any)
    assert.equal(count, 96)
  })

  test('getIntervalMs - should return correct milliseconds for each resolution', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    assert.equal(controller.getIntervalMs('1min'), 60 * 1000)
    assert.equal(controller.getIntervalMs('5min'), 5 * 60 * 1000)
    assert.equal(controller.getIntervalMs('15min'), 15 * 60 * 1000)
    assert.equal(controller.getIntervalMs('1h'), 60 * 60 * 1000)
    assert.equal(controller.getIntervalMs('6h'), 6 * 60 * 60 * 1000)
    assert.equal(controller.getIntervalMs('1d'), 24 * 60 * 60 * 1000)
  })

  test('getIntervalMs - should return default 1h interval for invalid resolution', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const ms = controller.getIntervalMs('invalid' as any)
    assert.equal(ms, 60 * 60 * 1000)
  })

  test('getAggregationLevel - should return correct aggregation level for time ranges', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    assert.equal(controller.getAggregationLevel('1h'), 'raw-metrics')
    assert.equal(controller.getAggregationLevel('6h'), 'raw-metrics')
    assert.equal(controller.getAggregationLevel('24h'), 'raw-metrics')
    assert.equal(controller.getAggregationLevel('7d'), 'hourly-aggregated')
    assert.equal(controller.getAggregationLevel('30d'), 'hourly-aggregated')
    assert.equal(controller.getAggregationLevel('90d'), 'daily-aggregated')
  })

  test('sampleDataForResolution - should sample data correctly', ({ assert }) => {
    // Create mock data with 1000 points
    const mockData = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 60000).toISOString(),
      iops: { read: 1000 + i, write: 500 + i },
      throughput: { read: 100 + i, write: 200 + i }
    }))

    // @ts-ignore - Accessing private method for unit testing
    const sampledData = controller.sampleDataForResolution(mockData, '1h', '24h')
    
    // Should sample down to 96 points for 24h range
    assert.equal(sampledData.length, 96)
    assert.property(sampledData[0], 'timestamp')
    assert.property(sampledData[0], 'iops')
    assert.property(sampledData[0], 'throughput')
  })

  test('sampleDataForResolution - should return original data if under target', ({ assert }) => {
    // Create mock data with only 50 points
    const mockData = Array.from({ length: 50 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 60000).toISOString(),
      iops: { read: 1000 + i, write: 500 + i },
      throughput: { read: 100 + i, write: 200 + i }
    }))

    // @ts-ignore - Accessing private method for unit testing  
    const sampledData = controller.sampleDataForResolution(mockData, '1h', '24h')
    
    // Should return all 50 points since it's under target of 96
    assert.equal(sampledData.length, 50)
  })
})