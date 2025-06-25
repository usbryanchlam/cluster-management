# Cluster Management Frontend

A modern web application for monitoring cluster performance metrics and managing snapshot policies, built with Next.js and React.

## Features

- **Performance Metrics Dashboard**: Real-time visualization of IOPS and throughput metrics
- **Multi-timerange Support**: View data across 6 different time ranges (1 hour to 90 days)  
- **Snapshot Policy Management**: Create and configure automated snapshot policies
- **User Management**: Switch between different users and their associated clusters
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Dark Theme**: Professional dark theme with consistent styling

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **TypeScript**: Full TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or 
pnpm install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Requirements

The frontend requires the backend API server to be running on `http://localhost:3333`. See the backend README for setup instructions.

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI/CD

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable UI components
│   └── lib/                 # Utilities and API client
├── __tests__/               # Unit tests
│   ├── components/          # Component tests  
│   └── lib/                 # Library and utility tests
├── public/                  # Static assets
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Jest test setup
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Components

### MetricsChart
- Displays IOPS and throughput metrics in line charts
- Supports 6 different time ranges with dynamic scaling
- Interactive tooltips and hover states
- Responsive design with mobile optimization

### SnapshotPolicyForm
- Configure snapshot policies with schedule types (Daily/Weekly)
- Advanced options for retention and locking
- Form validation and error handling
- Cancel confirmation dialog

### Sidebar
- Navigation between dashboard and policy pages
- User switching with dropdown menu
- User avatar and cluster association display

## API Integration

The frontend communicates with the backend API for:
- Fetching performance metrics data
- Retrieving and updating snapshot policies
- Managing user-cluster associations

API endpoints are defined in `src/lib/api.ts` with full TypeScript support.

## Testing

The project includes a comprehensive, **simplified testing approach** for reliability and maintainability:

### Test Suite (55 tests passing)
- **Component Tests**: 43 tests covering MetricsChart and SnapshotPolicyForm
- **Library Tests**: 12 tests for API client and utility functions
- **Simple & Fast**: ~2.5s execution time with no complex dependencies
- **Reliable**: No environment setup issues or external dependencies

### Test Coverage (42% statement coverage)
- **MetricsChart**: 53% coverage - Interactive charts, time ranges, error handling
- **SnapshotPolicyForm**: 73% coverage - Form validation, user interactions
- **Utils**: 100% coverage - Complete utility function testing
- **API Client**: 36% coverage - Method availability and structure

### Testing Philosophy
- **Lightweight Approach**: Simple Jest mocks instead of complex MSW setup
- **Focus on Core Logic**: Component behavior and user interactions
- **Fast Feedback**: Quick test execution for development workflow
- **CI/CD Friendly**: No browser dependencies or system requirements
- **Maintainable**: Easy to understand and modify test cases
- **Reliable**: No flaky tests due to network or timing issues

## Environment Variables

Create a `.env.local` file for development:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Vercel Deployment

The app is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized bundle size with Next.js
- Lazy loading of components
- Efficient data fetching with React Query
- Responsive images and fonts
- Tree-shaking and code splitting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Submit a pull request

## License

This project is private and proprietary.