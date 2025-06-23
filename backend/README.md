# Cluster Management Backend

AdonisJS 6 TypeScript API server providing time series metrics and snapshot policy management for cluster monitoring applications.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm run test
```

Server runs on `http://localhost:3333`

## 📡 API Endpoints

### Metrics API
```bash
# Get time series metrics with automatic resolution selection
GET /api/metrics?clusterId={uuid}&timeRange={period}&resolution={optional}

# Examples
curl "http://localhost:3333/api/metrics?clusterId=test-123&timeRange=24h"
curl "http://localhost:3333/api/metrics?clusterId=test-123&timeRange=1h"
curl "http://localhost:3333/api/metrics?clusterId=test-123&timeRange=7d&resolution=1h"
```

**Response Format:**
```json
{
  "clusterId": "test-123",
  "timeRange": "24h",
  "resolution": "15min",
  "data": {
    "timestamps": ["2024-01-01T00:00:00.000Z", "..."],
    "iops": {
      "read": [1200, 1150, "..."],
      "write": [800, 750, "..."]
    },
    "throughput": {
      "read": [14400, 13800, "..."],
      "write": [12000, 11250, "..."]
    }
  },
  "metadata": {
    "totalPoints": 96,
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T23:45:00.000Z",
    "aggregationMethod": "avg"
  }
}
```

### Snapshot Policy API
```bash
# Get snapshot policy (creates mock if doesn't exist)
GET /api/snapshot-policy/{uuid}

# Update/create snapshot policy
PUT /api/snapshot-policy/{uuid}
Content-Type: application/json

{
  "name": "Production_Daily",
  "directory": "/production/data",
  "schedule": {
    "type": "daily",
    "timezone": "UTC",
    "time": { "hour": 2, "minute": 30 },
    "days": ["mon", "tue", "wed", "thu", "fri"]
  },
  "deletion": {
    "type": "automatically",
    "after": 30
  },
  "locking": {
    "enabled": true
  },
  "enabled": true
}
```

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Test Categories
```bash
# Unit tests only (faster, no HTTP server)
npm run test -- --grep "Unit Tests"

# Integration tests only (full API testing)
npm run test -- --grep "Integration Tests"

# Specific controller tests
npm run test tests/unit/controllers/metrics_controller.spec.ts
npm run test tests/functional/api/snapshot_policy.spec.ts
```

### Test Coverage
- **34 tests total** (all passing)
- **Unit Tests**: Controller business logic (16 + 9 tests)
- **Integration Tests**: Full API endpoints (9 tests)
- **Test Utilities**: Helper functions and validation

## 🏗️ Architecture

### Controllers
- **MetricsController**: Time series data with automatic aggregation
- **SnapshotPolicyController**: CRUD operations for backup policies

### Key Features
- **Smart Resolution Selection**: Automatic data point optimization (60-168 points)
- **Realistic Mock Data**: Mathematical patterns for believable metrics
- **JSON File Storage**: Policy persistence with atomic updates
- **Type Safety**: Full TypeScript implementation
- **CORS Support**: Ready for frontend integration

### Time Series Optimization

Automatic resolution selection ensures optimal chart performance:

| Time Range | Resolution | Data Points | Use Case |
|------------|------------|-------------|----------|
| 1h | 1min | 60 | Real-time monitoring |
| 6h | 5min | 72 | Short-term analysis |
| 24h | 15min | 96 | Daily patterns |
| 7d | 1h | 168 | Weekly trends |
| 30d | 6h | 120 | Monthly overview |
| 90d | 1d | 90 | Long-term analysis |

## 📁 Project Structure

```
backend/
├── app/
│   └── controllers/           # API controllers
│       ├── metrics_controller.ts
│       └── snapshot_policy_controller.ts
├── config/                    # AdonisJS configuration
├── data/
│   └── policies/             # JSON policy storage
├── start/
│   └── routes.ts             # API route definitions
├── tests/
│   ├── unit/                 # Unit tests
│   ├── functional/           # Integration tests
│   └── helpers/              # Test utilities
└── package.json
```

## 🔧 Development

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with AdonisJS configuration
- **Prettier**: Consistent code formatting
- **Comments**: Comprehensive documentation of complex logic

### Mock Data Generation
The metrics controller generates realistic time series data using:
- **Sine/Cosine waves**: Cyclical patterns simulating daily/weekly cycles
- **Random noise**: Realistic variance in measurements
- **Correlated throughput**: IOPS × average block size calculations
- **Chronological timestamps**: Proper time sequence validation

### Policy Management
- **UUID-based identification**: Unique policy identification
- **System field preservation**: Automatic createdAt/updatedAt handling
- **Business rule validation**: Required fields and format checking
- **File-based persistence**: JSON storage with error handling

## 🚦 Environment Variables

```bash
# .env file
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
APP_KEY=your-secret-key-here
LOG_LEVEL=info
```

## 🛠️ Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run test       # Run test suite
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run typecheck  # TypeScript type checking
```

## 🔍 API Testing Examples

### Metrics Testing
```bash
# Get 1-hour metrics with 1-minute resolution
curl "http://localhost:3333/api/metrics?clusterId=prod-cluster-1&timeRange=1h"

# Get weekly metrics with hourly resolution
curl "http://localhost:3333/api/metrics?clusterId=prod-cluster-1&timeRange=7d"

# Override automatic resolution
curl "http://localhost:3333/api/metrics?clusterId=prod-cluster-1&timeRange=24h&resolution=1h"
```

### Policy Testing
```bash
# Get existing policy (or create mock)
curl http://localhost:3333/api/snapshot-policy/policy-123

# Create/update policy
curl -X PUT http://localhost:3333/api/snapshot-policy/policy-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Critical_Data_Backup",
    "directory": "/critical/database",
    "schedule": {
      "type": "daily",
      "timezone": "America/New_York",
      "time": {"hour": 1, "minute": 0},
      "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    },
    "deletion": {"type": "automatically", "after": 90},
    "locking": {"enabled": true},
    "enabled": true
  }'
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Support (if needed)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3333
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow TypeScript strict mode requirements
2. Add tests for new features (unit + integration)
3. Update API documentation for endpoint changes
4. Run `npm run lint` and `npm run typecheck` before commits
5. Ensure all tests pass with `npm run test`