# Cluster Management Application

A comprehensive full-stack web application for cluster monitoring and management with real-time metrics visualization, snapshot policy configuration, and multi-user support.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, and Recharts
- **Backend**: AdonisJS 6 with TypeScript and JSON file storage
- **Data**: Time series metrics with smart aggregation and snapshot policy management
- **Testing**: Comprehensive unit, integration, and E2E testing suites

## 📁 Project Structure

```
cluster-management/
├── frontend/          # Next.js web application
│   ├── src/           # Source code
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/# Reusable UI components
│   │   └── lib/       # Utilities and API client
│   ├── __tests__/     # Unit and integration tests
│   ├── e2e/           # End-to-end tests
│   └── public/        # Static assets
├── backend/           # AdonisJS API server
│   ├── app/           # Application logic
│   ├── data/          # Time series data and policies
│   └── tests/         # Backend test suites
├── design/            # System design diagrams
└── docs/              # Additional documentation
```

## 🚀 Quick Start

### Full Stack Setup

1. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Access the Application**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3333`

### Development Scripts

**Frontend**
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Run tests with coverage
```

**Backend**
```bash
npm run dev              # Start development server
npm run test             # Run all tests
npm run build            # Build for production
```

## 📊 Features

### 🎯 Performance Metrics Dashboard
- **Real-time Visualization**: IOPS and throughput metrics with interactive charts
- **Smart Time Ranges**: 6 time periods (1h to 90d) with optimized data resolution
- **Dynamic Scaling**: Automatic Y-axis adjustment with clean number formatting
- **Interactive Charts**: Hover tooltips, mouse tracking, and responsive design
- **Values Panel**: Live display of latest read/write metrics

### 👥 Multi-User Support
- **User Switching**: Seamless switching between different users
- **Cluster Association**: Each user associated with specific clusters
- **Session Persistence**: Maintains user preferences across sessions
- **User Avatar**: Visual user identification with initials

### ⚙️ Snapshot Policy Management
- **Flexible Scheduling**: Daily/weekly schedules with specific day selection
- **Advanced Options**: Retention policies, snapshot locking, and deletion rules
- **Form Validation**: Real-time validation with error handling
- **Confirmation Dialogs**: Safe cancellation with unsaved changes detection
- **Timezone Support**: Local timezone display for all scheduling

### 🎨 User Experience
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile
- **Dark Theme**: Professional dark theme with consistent styling
- **Loading States**: Smooth loading indicators and skeleton screens
- **Error Handling**: Graceful error handling with user-friendly messages

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Charts**: Recharts for data visualization
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Testing**: Jest, React Testing Library, Playwright

### Backend
- **Framework**: AdonisJS 6 with TypeScript
- **Testing**: Japa test runner with comprehensive coverage
- **Architecture**: RESTful API with controller-based routing
- **Data Storage**: JSON file system with mock data generation
- **CORS**: Configured for frontend integration
- **Validation**: Request validation with custom rules

### Testing Infrastructure
- **Unit Tests**: 43 passing component tests with 45% coverage
- **Integration Tests**: API testing with MSW mocking
- **E2E Tests**: Playwright cross-browser testing
- **Visual Regression**: Screenshot-based UI consistency testing
- **CI/CD Ready**: Test scripts for automated pipelines

## 🔄 API Endpoints

### Metrics API
- `GET /api/metrics?clusterId={uuid}&timeRange={period}` - Time series metrics
- `GET /api/metrics/aggregation-levels` - Available time ranges and resolutions

### Snapshot Policy API
- `GET /api/snapshot-policy/{uuid}` - Get snapshot policy
- `PUT /api/snapshot-policy/{uuid}` - Update snapshot policy

### User Management API
- `GET /api/user/{userId}` - Get user information
- `GET /api/user/{userId}/cluster` - Get user's cluster association
- `GET /api/users-clusters` - Get all user-cluster associations
- `GET /api/cluster/{uuid}` - Get cluster information

## 📈 Time Series Data Strategy

Automatic resolution selection optimizes performance and user experience:

| Time Range | Resolution | Data Points | Interval |
|------------|------------|-------------|----------|
| 1 hour     | 1 minute   | 60 points   | 1min     |
| 6 hours    | 5 minutes  | 72 points   | 5min     |
| 24 hours   | 15 minutes | 96 points   | 15min    |
| 7 days     | 1 hour     | 168 points  | 1h       |
| 30 days    | 6 hours    | 120 points  | 6h       |
| 90 days    | 1 day      | 90 points   | 1d       |

## 🧪 Testing

### Component Testing (43 tests passing)
```bash
cd frontend
npm run test                    # Run unit tests
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Run with coverage report
```

### API Testing (34 tests passing)
```bash
cd backend
npm run test                    # Run all backend tests
npm run test -- --grep "Unit"  # Run unit tests only
```

### End-to-End Testing
```bash
cd frontend
npm run test:e2e                # Run E2E tests
npm run test:e2e:ui             # Run with Playwright UI
npm run test:e2e:headed         # Run with browser UI
```

### Coverage Reports
- **Frontend Components**: 45% statement coverage
- **Backend API**: 100% endpoint coverage
- **E2E Workflows**: Critical user journeys covered

## 🎯 Key Components

### MetricsChart
- Interactive time series visualization
- Real-time data updates with hover states
- Dynamic Y-axis scaling and formatting
- Responsive design with mobile optimization
- Error handling for missing/invalid data

### SnapshotPolicyForm
- Complex form with conditional logic
- Real-time validation and error display
- Schedule type switching (Daily/Weekly)
- Confirmation dialogs for destructive actions
- Integration with user cluster management

### Sidebar Navigation
- User switching with dropdown menu
- Visual user identification
- Navigation between dashboard and policy pages
- Responsive collapse on mobile devices

## 🚦 Project Status

- ✅ **Frontend Application**: Complete with comprehensive UI/UX
- ✅ **Backend API**: Full RESTful API with validation
- ✅ **Time Series Visualization**: Interactive charts with smart aggregation  
- ✅ **Snapshot Policy Management**: Complete CRUD operations
- ✅ **User Management**: Multi-user support with cluster associations
- ✅ **Testing Suite**: Unit, integration, and E2E tests
- ✅ **Responsive Design**: Mobile-first responsive layout
- ✅ **Error Handling**: Comprehensive error states and recovery
- ✅ **Documentation**: Complete project documentation

## 🔧 Development Highlights

### Frontend Architecture
- **Component-based Design**: Reusable components with TypeScript
- **State Management**: Efficient data fetching with React Query
- **Performance**: Optimized bundle size and lazy loading
- **Accessibility**: ARIA labels and keyboard navigation
- **Type Safety**: Full TypeScript coverage with strict mode

### Backend Architecture  
- **Controller Pattern**: Organized business logic separation
- **Service Layer**: Reusable business logic components
- **Validation**: Request validation with custom error handling
- **Testing**: Comprehensive test coverage with mocking
- **Data Management**: Efficient JSON file operations

### Code Quality
- **ESLint**: Consistent code style enforcement
- **TypeScript**: Strict type checking throughout
- **Testing**: High test coverage with quality assertions
- **Documentation**: Comprehensive inline and README documentation
- **Git Workflow**: Structured commit history with meaningful messages

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#1B222C to #2D3748)
- **Accent**: Purple (#955FD5) and Cyan (#00A3CA)
- **Background**: Dark theme with subtle gradients
- **Text**: High contrast white/gray hierarchy

### Typography
- **Font**: Nunito Sans for clean, modern appearance
- **Hierarchy**: Clear size and weight distinctions
- **Responsive**: Scales appropriately across devices

### Components
- **Consistent Spacing**: 4px grid system
- **Border Radius**: Consistent 4px radius
- **Shadows**: Subtle depth with dark theme
- **Animations**: Smooth transitions and loading states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run the test suite (`npm run test:all`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow TypeScript strict mode
- Use ESLint configuration
- Document new API endpoints
- Update README for significant changes

## 📝 License

This project demonstrates full-stack development capabilities with modern web technologies including React 19, Next.js 15, AdonisJS 6, and comprehensive testing practices.