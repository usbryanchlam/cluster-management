# Cluster Management Data Directory

This directory contains all data for the cluster management application, including metrics, policies, and user associations.

## Quick Commands

### Regenerate All Cluster Data
```bash
node regenerate-data.js
```

This command:
- Generates fresh data for all clusters defined in `clusters.json`
- Creates 91 days of data (90 days before to current date)
- Uses local time for timestamps
- Creates consolidated file structure for optimal API performance

## Directory Structure

```
data/
├── README.md                           # This file
├── regenerate-data.js                  # Data generation script
├── clusters.json                       # Cluster definitions
├── users.json                          # User-cluster associations
├── policies/                           # Snapshot policy storage
│   ├── {cluster-uuid}.json            # Policy files named by cluster UUID
├── {cluster-uuid}/                     # Metrics data (one folder per cluster)
│   ├── raw-metrics-1h.json            # Last 1 hour (1-minute intervals)
│   ├── raw-metrics-6h.json            # Last 6 hours (5-minute intervals)
│   ├── raw-metrics-24h.json           # Last 24 hours (15-minute intervals)
│   ├── hourly-aggregated-7d.json      # Last 7 days (1-hour intervals)
│   ├── hourly-aggregated-30d.json     # Last 30 days (6-hour intervals)
│   └── daily-aggregated-90d.json      # 91 days total (1-day intervals)
└── policies-test/                      # Test policy storage (legacy)
```

## Current Configuration

### Clusters
- **demo-123**: `f2398d2e-f92d-482a-ab2d-4b9a9f79186c`
- **demo-456**: `40fd90d6-7c7d-4099-8564-fe53b02a8abf`

### User Associations
- **Bryan** (`bryan`) → demo-123 cluster
- **David** (`david`) → demo-456 cluster

## Data Generation Details

### Time Range Strategy
- **Date Range**: 90 days before current date to current date (91 total days)
- **Timezone**: Uses local system time for all timestamps
- **Reference Point**: Current time (not fixed to noon)

### Performance Optimization
Each time range uses pre-aggregated data optimized for chart rendering:

| Time Range | Resolution | Target Points | Source File |
|------------|------------|---------------|-------------|
| 1h | 1 minute | 60 points | raw-metrics-1h.json |
| 6h | 5 minutes | 72 points | raw-metrics-6h.json |
| 24h | 15 minutes | 96 points | raw-metrics-24h.json |
| 7d | 1 hour | 168 points | hourly-aggregated-7d.json |
| 30d | 6 hours | 120 points | hourly-aggregated-30d.json |
| 90d | 1 day | 90 points | daily-aggregated-90d.json |

### Generated Metrics Ranges

#### IOPS (Input/Output Operations Per Second)
- **Read**: 5,000 - 70,000 IOPS
- **Write**: 100 - 2,000 IOPS

#### Throughput (Data Transfer Rate)
- **Read**: 10 - 200 KB/s
- **Write**: 100 - 2,000 KB/s

### Realistic Data Patterns
- **Daily Activity Cycles**: Lower activity during night hours, peak during business hours
- **Weekend Variations**: Reduced activity on weekends (80% of weekday levels)
- **Minute-Level Noise**: ±20% variation for realistic fluctuations

## API Integration

### Metrics API
- **Endpoint**: `/api/metrics?clusterId={uuid}&timeRange={range}`
- **Performance**: 1 file read per API call (vs 90+ individual files)
- **Caching**: Optimized file structure enables efficient caching

### Policy API
- **Get**: `/api/snapshot-policy/{cluster-uuid}`
- **Update**: `/api/snapshot-policy/{cluster-uuid}` (PUT)
- **Storage**: JSON files in `policies/` directory

### User-Cluster API
- **Get User**: `/api/user/{userId}`
- **Get Cluster**: `/api/cluster/{uuid}`
- **Get Association**: `/api/user/{userId}/cluster`
- **Get All**: `/api/users-clusters`

## Benefits

✅ **API Performance**: 1 file read per request instead of 90+ files  
✅ **Data Consistency**: Derived aggregations ensure data integrity  
✅ **Dynamic Updates**: Data relative to current date for easy refresh  
✅ **Realistic Patterns**: Includes daily activity cycles and weekend variations  
✅ **UUID-based Organization**: Proper cluster identification and data isolation  
✅ **Local Time Support**: All timestamps use local system time  
✅ **Scalable Architecture**: Easy to add new clusters and users

## Adding New Clusters

1. Add cluster definition to `clusters.json`:
```json
{
  "uuid": "new-cluster-uuid",
  "cluster_name": "new-cluster-name"
}
```

2. Run data regeneration:
```bash
node regenerate-data.js
```

3. Optionally add user associations in `users.json`

## File Formats

All JSON files follow consistent schemas:
- **Metrics**: Arrays of timestamped IOPS and throughput data
- **Policies**: Snapshot policy configuration objects
- **Users/Clusters**: Simple association objects

The data directory is designed for both development convenience and production performance.