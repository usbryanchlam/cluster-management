import { test } from '@japa/runner'
import MetricsController from '#controllers/metrics_controller'

test.group('MetricsController Unit Tests', (group) => {
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
    const testCases = [
      { timeRange: '1h', expected: 60 },
      { timeRange: '6h', expected: 72 },
      { timeRange: '24h', expected: 96 },
      { timeRange: '7d', expected: 168 },
      { timeRange: '30d', expected: 120 },
      { timeRange: '90d', expected: 90 }
    ]

    testCases.forEach(({ timeRange, expected }) => {
      // @ts-ignore - Accessing private method for unit testing
      const count = controller.getDataPointCount(timeRange as any)
      assert.equal(count, expected, `Failed for timeRange: ${timeRange}`)
    })
  })

  test('getDataPointCount - should return default 96 points for invalid timeRange', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const count = controller.getDataPointCount('invalid' as any)
    assert.equal(count, 96)
  })

  test('getIntervalMs - should return correct milliseconds for each resolution', ({ assert }) => {
    const testCases = [
      { resolution: '1min', expected: 60 * 1000 },
      { resolution: '5min', expected: 5 * 60 * 1000 },
      { resolution: '15min', expected: 15 * 60 * 1000 },
      { resolution: '1h', expected: 60 * 60 * 1000 },
      { resolution: '6h', expected: 6 * 60 * 60 * 1000 },
      { resolution: '1d', expected: 24 * 60 * 60 * 1000 }
    ]

    testCases.forEach(({ resolution, expected }) => {
      // @ts-ignore - Accessing private method for unit testing
      const ms = controller.getIntervalMs(resolution as any)
      assert.equal(ms, expected, `Failed for resolution: ${resolution}`)
    })
  })

  test('getIntervalMs - should return default 1h interval for invalid resolution', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const ms = controller.getIntervalMs('invalid' as any)
    assert.equal(ms, 60 * 60 * 1000)
  })

  test('generateMockData - should generate data with correct structure', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const data = controller.generateMockData('1h', '24h')
    
    // Verify structure
    assert.property(data, 'timestamps')
    assert.property(data, 'iops')
    assert.property(data, 'throughput')
    assert.property(data.iops, 'read')
    assert.property(data.iops, 'write')
    assert.property(data.throughput, 'read')
    assert.property(data.throughput, 'write')
  })

  test('generateMockData - should generate correct number of data points', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const data = controller.generateMockData('15min', '24h')
    
    // 24h with 15min intervals should be 96 points
    assert.equal(data.timestamps.length, 96)
    assert.equal(data.iops.read.length, 96)
    assert.equal(data.iops.write.length, 96)
    assert.equal(data.throughput.read.length, 96)
    assert.equal(data.throughput.write.length, 96)
  })

  test('generateMockData - should generate realistic positive values', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const data = controller.generateMockData('1h', '7d')
    
    // All values should be positive
    data.iops.read.forEach(val => assert.isAbove(val, 0))
    data.iops.write.forEach(val => assert.isAbove(val, 0))
    data.throughput.read.forEach(val => assert.isAbove(val, 0))
    data.throughput.write.forEach(val => assert.isAbove(val, 0))
  })

  test('generateMockData - should generate timestamps in chronological order', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const data = controller.generateMockData('1h', '7d')
    
    for (let i = 1; i < data.timestamps.length; i++) {
      const prev = new Date(data.timestamps[i - 1])
      const current = new Date(data.timestamps[i])
      assert.isBelow(prev.getTime(), current.getTime(), 'Timestamps should be in ascending order')
    }
  })

  test('generateMockData - should correlate throughput with IOPS', ({ assert }) => {
    // @ts-ignore - Accessing private method for unit testing
    const data = controller.generateMockData('1h', '24h')
    
    // Throughput should generally correlate with IOPS (within reasonable bounds)
    for (let i = 0; i < data.timestamps.length; i++) {
      const readRatio = data.throughput.read[i] / data.iops.read[i]
      const writeRatio = data.throughput.write[i] / data.iops.write[i]
      
      // Ratios should be within expected ranges (simulating block sizes)
      assert.isAbove(readRatio, 5, 'Read throughput ratio too low')
      assert.isBelow(readRatio, 25, 'Read throughput ratio too high')
      assert.isAbove(writeRatio, 8, 'Write throughput ratio too low')
      assert.isBelow(writeRatio, 30, 'Write throughput ratio too high')
    }
  })
})