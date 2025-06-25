import { test } from '@japa/runner'

test.group('Metrics API Integration Tests', () => {

  test('should return 400 without clusterId', async ({ client, assert }) => {
    const response = await client.get('/api/metrics')
    
    assert.equal(response.status(), 400)
    assert.property(response.body(), 'error')
    assert.equal(response.body().error, 'clusterId is required')
  })

  test('should return valid response with clusterId', async ({ client, assert }) => {
    const response = await client.get('/api/metrics').qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c' })
    
    assert.equal(response.status(), 200)
    
    const body = response.body()
    assert.property(body, 'clusterId')
    assert.property(body, 'timeRange')
    assert.property(body, 'resolution')
    assert.property(body, 'data')
    assert.property(body, 'metadata')
    
    assert.equal(body.clusterId, 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
    assert.equal(body.timeRange, '24h') // Default value
  })

  test('should respect timeRange parameter - 1h', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c', timeRange: '1h' })
    
    assert.equal(response.status(), 200)
    const body = response.body()
    assert.equal(body.timeRange, '1h')
    assert.equal(body.resolution, '1min')
    assert.equal(body.data.timestamps.length, 60)
  })

  test('should respect timeRange parameter - 6h', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c', timeRange: '6h' })
    
    assert.equal(response.status(), 200)
    const body = response.body()
    assert.equal(body.timeRange, '6h')
    assert.equal(body.resolution, '5min')
    assert.equal(body.data.timestamps.length, 72)
  })

  test('should respect timeRange parameter - 24h', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c', timeRange: '24h' })
    
    assert.equal(response.status(), 200)
    const body = response.body()
    assert.equal(body.timeRange, '24h')
    assert.equal(body.resolution, '15min')
    assert.equal(body.data.timestamps.length, 96)
  })

  test('should respect custom resolution parameter', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ 
        clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c', 
        timeRange: '24h',
        resolution: '1h'
      })
    
    assert.equal(response.status(), 200)
    
    const body = response.body()
    assert.equal(body.resolution, '1h')
  })

  test('should return valid data structure', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c' })
    
    assert.equal(response.status(), 200)
    
    const { data } = response.body()
    
    // Verify data structure
    assert.property(data, 'timestamps')
    assert.property(data, 'iops')
    assert.property(data, 'throughput')
    assert.property(data.iops, 'read')
    assert.property(data.iops, 'write')
    assert.property(data.throughput, 'read')
    assert.property(data.throughput, 'write')
    
    // Verify arrays have same length
    const length = data.timestamps.length
    assert.equal(data.iops.read.length, length)
    assert.equal(data.iops.write.length, length)
    assert.equal(data.throughput.read.length, length)
    assert.equal(data.throughput.write.length, length)
  })

  test('should return positive metric values', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c' })
    
    assert.equal(response.status(), 200)
    
    const { data } = response.body()
    
    // Verify all metrics are positive numbers
    data.iops.read.forEach((value: number) => {
      assert.isNumber(value)
      assert.isAbove(value, 0)
    })
    
    data.iops.write.forEach((value: number) => {
      assert.isNumber(value)
      assert.isAbove(value, 0)
    })
    
    data.throughput.read.forEach((value: number) => {
      assert.isNumber(value)
      assert.isAbove(value, 0)
    })
    
    data.throughput.write.forEach((value: number) => {
      assert.isNumber(value)
      assert.isAbove(value, 0)
    })
  })

  test('should return chronological timestamps', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c', timeRange: '1h' })
    
    assert.equal(response.status(), 200)
    
    const { data } = response.body()
    const timestamps = data.timestamps.map((ts: string) => new Date(ts).getTime())
    
    // Verify timestamps are in ascending order
    for (let i = 1; i < timestamps.length; i++) {
      assert.isBelow(timestamps[i - 1], timestamps[i], 'Timestamps should be in chronological order')
    }
  })

  test('should include proper metadata', async ({ client, assert }) => {
    const response = await client
      .get('/api/metrics')
      .qs({ clusterId: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c', timeRange: '6h' })
    
    assert.equal(response.status(), 200)
    
    const { metadata, data } = response.body()
    
    assert.property(metadata, 'totalPoints')
    assert.property(metadata, 'startTime')
    assert.property(metadata, 'endTime')
    assert.property(metadata, 'aggregationMethod')
    
    assert.equal(metadata.totalPoints, data.timestamps.length)
    assert.equal(metadata.startTime, data.timestamps[0])
    assert.equal(metadata.endTime, data.timestamps[data.timestamps.length - 1])
    assert.equal(metadata.aggregationMethod, 'avg')
  })

  test('should handle different cluster IDs', async ({ client, assert }) => {
    const clusterIds = ['f2398d2e-f92d-482a-ab2d-4b9a9f79186c', '40fd90d6-7c7d-4099-8564-fe53b02a8abf']
    
    for (const clusterId of clusterIds) {
      const response = await client
        .get('/api/metrics')
        .qs({ clusterId })
      
      assert.equal(response.status(), 200)
      assert.equal(response.body().clusterId, clusterId)
    }
  })
})