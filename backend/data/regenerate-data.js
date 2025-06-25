import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data ranges as specified
const RANGES = {
  iops: {
    read: { min: 5000, max: 70000 },    // 5.0k to 70.0k
    write: { min: 100, max: 2000 }      // 100.0 to 2000.0
  },
  throughput: {
    read: { min: 10, max: 200 },        // 10.0 KB/s to 200.0 KB/s
    write: { min: 100, max: 2000 }      // 100 KB/s to 2000 KB/s
  }
};

// Generate random value within range
function randomValue(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

// Calculate date range: 90 days before to current date
function generateDateRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 90); // 90 days ago
  const endDate = new Date(today); // Current date
  
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { dates, startDate, endDate };
}

// Generate raw metrics data (1-minute intervals) for all 91 days
function generateRawMetrics(dates) {
  console.log('🔄 Generating raw-metrics data (1-minute intervals)...');
  
  const allRawData = [];
  
  dates.forEach((date, dayIndex) => {
    // Generate 1440 data points per day (24 hours × 60 minutes)
    for (let minute = 0; minute < 1440; minute++) {
      const hour = Math.floor(minute / 60);
      const min = minute % 60;
      const timestamp = `${date}T${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00.000Z`;
      
      // Create realistic daily activity pattern
      const hourActivity = 0.3 + 0.7 * Math.sin((hour - 6) * Math.PI / 12);
      const clampedActivity = Math.max(0.1, Math.min(1.0, hourActivity));
      
      // Add minute-level variation (±20%)
      const minuteNoise = 0.8 + Math.random() * 0.4;
      const finalMultiplier = clampedActivity * minuteNoise;
      
      // Add weekly pattern (weekends slightly lower)
      const dayOfWeek = new Date(date).getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;
      
      const finalActivity = finalMultiplier * weekendMultiplier;
      
      allRawData.push({
        timestamp: timestamp,
        iops: {
          read: randomValue(
            RANGES.iops.read.min * finalActivity,
            RANGES.iops.read.max * finalActivity
          ),
          write: randomValue(
            RANGES.iops.write.min * finalActivity,
            RANGES.iops.write.max * finalActivity
          )
        },
        throughput: {
          read: randomValue(
            RANGES.throughput.read.min * finalActivity,
            RANGES.throughput.read.max * finalActivity
          ),
          write: randomValue(
            RANGES.throughput.write.min * finalActivity,
            RANGES.throughput.write.max * finalActivity
          )
        }
      });
    }
    
    if ((dayIndex + 1) % 20 === 0 || dayIndex === dates.length - 1) {
      console.log(`   Generated ${dayIndex + 1}/${dates.length} days (${allRawData.length} data points)`);
    }
  });
  
  return allRawData;
}

// Derive hourly-aggregated data from raw-metrics
function deriveHourlyAggregated(rawData) {
  console.log('🔄 Deriving hourly-aggregated data from raw-metrics...');
  
  const hourlyMap = new Map();
  
  // Group raw data by hour
  rawData.forEach(point => {
    const hourKey = point.timestamp.substring(0, 13) + ':00:00.000Z'; // YYYY-MM-DDTHH:00:00.000Z
    
    if (!hourlyMap.has(hourKey)) {
      hourlyMap.set(hourKey, []);
    }
    hourlyMap.get(hourKey).push(point);
  });
  
  // Calculate hourly averages
  const hourlyData = [];
  for (const [hourKey, points] of hourlyMap) {
    const avgPoint = {
      timestamp: hourKey,
      iops: {
        read: points.reduce((sum, p) => sum + p.iops.read, 0) / points.length,
        write: points.reduce((sum, p) => sum + p.iops.write, 0) / points.length
      },
      throughput: {
        read: points.reduce((sum, p) => sum + p.throughput.read, 0) / points.length,
        write: points.reduce((sum, p) => sum + p.throughput.write, 0) / points.length
      }
    };
    
    // Round to 1 decimal place
    avgPoint.iops.read = parseFloat(avgPoint.iops.read.toFixed(1));
    avgPoint.iops.write = parseFloat(avgPoint.iops.write.toFixed(1));
    avgPoint.throughput.read = parseFloat(avgPoint.throughput.read.toFixed(1));
    avgPoint.throughput.write = parseFloat(avgPoint.throughput.write.toFixed(1));
    
    hourlyData.push(avgPoint);
  }
  
  // Sort by timestamp
  hourlyData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  console.log(`   Generated ${hourlyData.length} hourly data points from ${rawData.length} raw points`);
  return hourlyData;
}

// Derive daily-aggregated data from hourly-aggregated
function deriveDailyAggregated(hourlyData) {
  console.log('🔄 Deriving daily-aggregated data from hourly-aggregated...');
  
  const dailyMap = new Map();
  
  // Group hourly data by day
  hourlyData.forEach(point => {
    const dayKey = point.timestamp.substring(0, 10); // YYYY-MM-DD
    
    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, []);
    }
    dailyMap.get(dayKey).push(point);
  });
  
  // Calculate daily averages (using current minute timestamp)
  const dailyData = [];
  for (const [dayKey, points] of dailyMap) {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const avgPoint = {
      timestamp: `${dayKey}T${currentHour}:${currentMinute}:00.000Z`, // Use current time as the daily timestamp
      iops: {
        read: points.reduce((sum, p) => sum + p.iops.read, 0) / points.length,
        write: points.reduce((sum, p) => sum + p.iops.write, 0) / points.length
      },
      throughput: {
        read: points.reduce((sum, p) => sum + p.throughput.read, 0) / points.length,
        write: points.reduce((sum, p) => sum + p.throughput.write, 0) / points.length
      }
    };
    
    // Round to 1 decimal place
    avgPoint.iops.read = parseFloat(avgPoint.iops.read.toFixed(1));
    avgPoint.iops.write = parseFloat(avgPoint.iops.write.toFixed(1));
    avgPoint.throughput.read = parseFloat(avgPoint.throughput.read.toFixed(1));
    avgPoint.throughput.write = parseFloat(avgPoint.throughput.write.toFixed(1));
    
    dailyData.push(avgPoint);
  }
  
  // Sort by timestamp
  dailyData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  console.log(`   Generated ${dailyData.length} daily data points from ${hourlyData.length} hourly points`);
  return dailyData;
}

// Create consolidated files for different time ranges
function createConsolidatedFiles(rawData, hourlyData, dailyData, clusterId) {
  console.log('🔄 Creating consolidated files for time ranges...');
  
  // Use UUID directly as folder name (no prefix)
  const baseDir = path.join(__dirname, clusterId);
  
  // Remove old structure and create new
  if (fs.existsSync(baseDir)) {
    fs.rmSync(baseDir, { recursive: true });
  }
  fs.mkdirSync(baseDir, { recursive: true });
  
  // Use current date/time for filtering recent data (local time)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0); // Use current time
  // 1. raw-metrics-1h.json (last 1 hour of data)
  const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000);
  const raw1h = rawData.filter(p => new Date(p.timestamp) >= oneHourAgo && new Date(p.timestamp) <= today);
  fs.writeFileSync(
    path.join(baseDir, 'raw-metrics-1h.json'),
    JSON.stringify({
      cluster_id: clusterId,
      time_range: "1h",
      resolution: "1min",
      data: {
        timestamps: raw1h.map(p => p.timestamp),
        iops: {
          read: raw1h.map(p => p.iops.read),
          write: raw1h.map(p => p.iops.write)
        },
        throughput: {
          read: raw1h.map(p => p.throughput.read),
          write: raw1h.map(p => p.throughput.write)
        }
      }
    }, null, 2)
  );
  
  // 2. raw-metrics-6h.json (last 6 hours of data)
  const sixHoursAgo = new Date(today.getTime() - 6 * 60 * 60 * 1000);
  const raw6h = rawData.filter(p => new Date(p.timestamp) >= sixHoursAgo && new Date(p.timestamp) <= today);
  fs.writeFileSync(
    path.join(baseDir, 'raw-metrics-6h.json'),
    JSON.stringify({
      cluster_id: clusterId,
      time_range: "6h",
      resolution: "1min",
      data: {
        timestamps: raw6h.map(p => p.timestamp),
        iops: {
          read: raw6h.map(p => p.iops.read),
          write: raw6h.map(p => p.iops.write)
        },
        throughput: {
          read: raw6h.map(p => p.throughput.read),
          write: raw6h.map(p => p.throughput.write)
        }
      }
    }, null, 2)
  );
  
  // 3. raw-metrics-24h.json (last 24 hours of data)
  const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const raw24h = rawData.filter(p => new Date(p.timestamp) >= oneDayAgo && new Date(p.timestamp) <= today);
  fs.writeFileSync(
    path.join(baseDir, 'raw-metrics-24h.json'),
    JSON.stringify({
      cluster_id: clusterId,
      time_range: "24h",
      resolution: "1min",
      data: {
        timestamps: raw24h.map(p => p.timestamp),
        iops: {
          read: raw24h.map(p => p.iops.read),
          write: raw24h.map(p => p.iops.write)
        },
        throughput: {
          read: raw24h.map(p => p.throughput.read),
          write: raw24h.map(p => p.throughput.write)
        }
      }
    }, null, 2)
  );
  
  // 4. hourly-aggregated-7d.json (last 7 days of hourly data)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const hourly7d = hourlyData.filter(p => new Date(p.timestamp) >= sevenDaysAgo && new Date(p.timestamp) <= today);
  fs.writeFileSync(
    path.join(baseDir, 'hourly-aggregated-7d.json'),
    JSON.stringify({
      cluster_id: clusterId,
      time_range: "7d",
      resolution: "1h",
      data: {
        timestamps: hourly7d.map(p => p.timestamp),
        iops: {
          read: hourly7d.map(p => p.iops.read),
          write: hourly7d.map(p => p.iops.write)
        },
        throughput: {
          read: hourly7d.map(p => p.throughput.read),
          write: hourly7d.map(p => p.throughput.write)
        }
      }
    }, null, 2)
  );
  
  // 5. hourly-aggregated-30d.json (last 30 days of hourly data)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const hourly30d = hourlyData.filter(p => new Date(p.timestamp) >= thirtyDaysAgo && new Date(p.timestamp) <= today);
  fs.writeFileSync(
    path.join(baseDir, 'hourly-aggregated-30d.json'),
    JSON.stringify({
      cluster_id: clusterId,
      time_range: "30d",
      resolution: "1h",
      data: {
        timestamps: hourly30d.map(p => p.timestamp),
        iops: {
          read: hourly30d.map(p => p.iops.read),
          write: hourly30d.map(p => p.iops.write)
        },
        throughput: {
          read: hourly30d.map(p => p.throughput.read),
          write: hourly30d.map(p => p.throughput.write)
        }
      }
    }, null, 2)
  );
  
  // 6. daily-aggregated-90d.json (all 91 days of daily data)
  fs.writeFileSync(
    path.join(baseDir, 'daily-aggregated-90d.json'),
    JSON.stringify({
      cluster_id: clusterId,
      time_range: "90d",
      resolution: "1d",
      data: {
        timestamps: dailyData.map(p => p.timestamp),
        iops: {
          read: dailyData.map(p => p.iops.read),
          write: dailyData.map(p => p.iops.write)
        },
        throughput: {
          read: dailyData.map(p => p.throughput.read),
          write: dailyData.map(p => p.throughput.write)
        }
      }
    }, null, 2)
  );
  
  console.log('✅ Created consolidated files:');
  console.log(`   📄 raw-metrics-1h.json (${raw1h.length} points)`);
  console.log(`   📄 raw-metrics-6h.json (${raw6h.length} points)`);
  console.log(`   📄 raw-metrics-24h.json (${raw24h.length} points)`);
  console.log(`   📄 hourly-aggregated-7d.json (${hourly7d.length} points)`);
  console.log(`   📄 hourly-aggregated-30d.json (${hourly30d.length} points)`);
  console.log(`   📄 daily-aggregated-90d.json (${dailyData.length} points)`);
}

// Generate data for a single cluster
function generateClusterData(clusterId, clusterName) {
  console.log(`🚀 Generating consolidated time-series data for ${clusterName} (${clusterId})...`);
  const currentDate = new Date().toISOString().split('T')[0];
  console.log(`📅 Date range: 90 days before to ${currentDate} (current date)`);
  
  const { dates, startDate, endDate } = generateDateRange();
  console.log(`📊 Total period: ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} days)`);
  
  // Step 1: Generate raw metrics (foundation data)
  const rawData = generateRawMetrics(dates);
  
  // Step 2: Derive hourly aggregated from raw metrics
  const hourlyData = deriveHourlyAggregated(rawData);
  
  // Step 3: Derive daily aggregated from hourly data
  const dailyData = deriveDailyAggregated(hourlyData);
  
  // Step 4: Create consolidated files for API time ranges
  createConsolidatedFiles(rawData, hourlyData, dailyData, clusterId);
  
  console.log('');
  console.log(`✅ Data generation complete for ${clusterName} (${clusterId})!`);
  console.log(`📁 Location: ${clusterId}/`);
  console.log(`📊 Total raw data points: ${rawData.length}`);
  console.log(`📊 Total hourly data points: ${hourlyData.length}`);
  console.log(`📊 Total daily data points: ${dailyData.length}`);
  console.log('');
}

// Main execution
function main() {
  // Read cluster data from clusters.json
  const clustersFilePath = path.join(__dirname, 'clusters.json');
  
  if (!fs.existsSync(clustersFilePath)) {
    console.error('❌ clusters.json not found. Please ensure the file exists.');
    process.exit(1);
  }
  
  const clustersData = JSON.parse(fs.readFileSync(clustersFilePath, 'utf-8'));
  
  console.log('🚀 Regenerating consolidated data for all clusters...');
  console.log(`📋 Clusters found: ${clustersData.length}`);
  clustersData.forEach(cluster => {
    console.log(`   • ${cluster.cluster_name}: ${cluster.uuid}`);
  });
  console.log('');
  
  clustersData.forEach((cluster, index) => {
    generateClusterData(cluster.uuid, cluster.cluster_name);
    
    if (index < clustersData.length - 1) {
      console.log('─'.repeat(60));
      console.log('');
    }
  });
  
  console.log('🎯 File structure optimized for API performance:');
  console.log('   • 1 file read per API call instead of 90+ files');
  console.log('   • Derived aggregations ensure data consistency');
  console.log('   • Ready for all time range testing');
  console.log('   • Folder names match cluster UUIDs for API consistency');
  console.log('');
  console.log('✅ All cluster data regenerated successfully!');
}

main();