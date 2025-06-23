# Cluster Management Application

A modern web application for cluster monitoring and management with time series data visualization and snapshot policy configuration.

## 🏗️ Architecture

- **Frontend**: NextJS with TypeScript, Tailwind CSS, and Recharts (planned)
- **Backend**: AdonisJS 6 with TypeScript and JSON file storage
- **Data**: Time series metrics and snapshot policy management

## 📁 Project Structure

```
cluster-management/
├── backend/           # AdonisJS API server
├── frontend/          # NextJS web application (planned)
├── spec/             # Requirements and specifications
├── design/           # System design diagrams
└── docs/             # Additional documentation
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API will be available at `http://localhost:3333`

### API Endpoints

- `GET /api/metrics?clusterId={uuid}&timeRange={period}` - Time series metrics
- `GET /api/snapshot-policy/{uuid}` - Get snapshot policy
- `PUT /api/snapshot-policy/{uuid}` - Update snapshot policy

## 🧪 Testing

```bash
cd backend
npm run test                    # Run all tests
npm run test -- --grep "Unit"  # Run unit tests only
```

## 📊 Features

### Performance Metrics Dashboard
- **Time Series Visualization**: IOPS and throughput metrics with automatic resolution selection
- **Smart Aggregation**: Optimal data point selection (60-168 points) for smooth chart rendering
- **Time Range Support**: 1h, 6h, 24h, 7d, 30d, 90d with auto-resolution
- **Real-time Updates**: Live metrics with configurable refresh intervals

### Snapshot Policy Management
- **Policy Configuration**: Schedule, retention, and locking settings
- **Timezone Support**: Global timezone configuration for backup schedules
- **Flexible Scheduling**: Daily/weekly schedules with specific day selection
- **Automatic Cleanup**: Configurable retention periods with automatic deletion

## 🛠️ Development

### Backend Technology Stack
- **Framework**: AdonisJS 6 with TypeScript
- **Testing**: Japa test runner with comprehensive unit and integration tests
- **Architecture**: RESTful API with controller-based routing
- **Data Storage**: JSON file system for policies, mock data generation for metrics
- **CORS**: Configured for frontend integration

### Time Series Data Strategy
Automatic resolution selection optimizes chart performance:
- **1h → 1min intervals** (60 points)
- **6h → 5min intervals** (72 points)
- **24h → 15min intervals** (96 points)
- **7d → 1h intervals** (168 points)
- **30d → 6h intervals** (120 points)
- **90d → 1d intervals** (90 points)

## 📋 Requirements

Implemented based on detailed specifications in `/spec/req-spec.md`:
- NextJS frontend with TypeScript and Tailwind CSS
- AdonisJS backend with time series API
- Performance metrics visualization
- Snapshot policy CRUD operations
- Responsive design for various screen sizes

## 🎯 Design Diagrams

System architecture and user flow diagrams available in `/design/`:
- **User Flow**: Navigation between metrics and policy management
- **System Design**: Component interaction and data flow

## 🚦 Project Status

- ✅ **Backend API**: Complete with comprehensive testing
- ✅ **Time Series Metrics**: Implemented with smart aggregation
- ✅ **Snapshot Policies**: Full CRUD operations
- ✅ **Testing Suite**: Unit and integration tests (34 tests passing)
- 🔄 **Frontend**: Planned NextJS implementation
- 🔄 **Integration**: Frontend-backend connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of a take-home exercise demonstrating full-stack development capabilities with modern web technologies.