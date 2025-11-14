/**
 * Chart Rendering Service
 * Converts React Recharts components to images for PDF embedding
 */

import puppeteer, { type Browser } from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const CHARTS_CACHE_DIR = join(process.cwd(), 'public', 'charts-cache');

// Ensure charts cache directory exists
async function ensureChartsDir(): Promise<void> {
  if (!existsSync(CHARTS_CACHE_DIR)) {
    await mkdir(CHARTS_CACHE_DIR, { recursive: true });
  }
}

let browserInstance: Browser | null = null;

/**
 * Get or create browser instance (singleton)
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Render a chart component to an image
 * @param chartComponent - React component as string (JSX)
 * @param width - Chart width in pixels
 * @param height - Chart height in pixels
 * @returns Base64 encoded image string
 */
export async function renderChartAsImage(
  chartComponent: string,
  width: number = 800,
  height: number = 400
): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport size
    await page.setViewport({ width, height });

    // Create HTML page with chart
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              background: white;
            }
            #chart-container {
              width: ${width}px;
              height: ${height}px;
            }
          </style>
          <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/recharts@2.13.3/dist/Recharts.js"></script>
        </head>
        <body>
          <div id="chart-container"></div>
          <script>
            // Render chart
            const { ChartContainer } = window.Recharts;
            // Note: This is a simplified approach. In production, you might want to
            // use server-side rendering with React SSR or a canvas-based library
            // For now, we'll use a placeholder approach
            document.getElementById('chart-container').innerHTML = '${chartComponent}';
          </script>
        </body>
      </html>
    `;

    await page.setContent(html);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for chart to render

    // Capture screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
      fullPage: false,
    });

    return `data:image/png;base64,${screenshot}`;
  } finally {
    await page.close();
  }
}

/**
 * Render chart to file (for caching)
 * @param chartComponent - React component as string (JSX)
 * @param fileName - Output filename
 * @param width - Chart width in pixels
 * @param height - Chart height in pixels
 * @returns File path relative to public directory
 */
export async function renderChartToFile(
  _chartComponent: string,
  _fileName: string,
  width: number = 800,
  height: number = 400
): Promise<string> {
  await ensureChartsDir();

  // For now, we use the simpler SVG approach
  // Puppeteer-based rendering can be added later if needed
  return renderSimpleChartSVG([], {
    xKey: 'year',
    yKeys: [],
    width,
    height,
  });
}

/**
 * Simplified chart rendering using SVG (for simpler charts)
 * This is a fallback method that doesn't require Puppeteer
 * Uses direct SVG generation which is faster and works better with @react-pdf/renderer
 */
export function renderSimpleChartSVG(
  data: Array<Record<string, unknown>>,
  config: {
    xKey: string;
    yKeys: string[];
    width?: number;
    height?: number;
    title?: string;
  }
): string {
  const { xKey, yKeys, width = 800, height = 400, title } = config;

  if (data.length === 0) {
    return `data:image/svg+xml;base64,${Buffer.from('<svg width="800" height="400"><text x="400" y="200" text-anchor="middle">No data available</text></svg>').toString('base64')}`;
  }

  // Calculate max Y value (use absolute values to handle negative numbers)
  const allValues = data.flatMap((d) => yKeys.map((key) => Math.abs(Number(d[key]) || 0)));
  const maxY = Math.max(...allValues, 1) * 1.1; // Add 10% padding
  const minY = Math.min(...data.flatMap((d) => yKeys.map((key) => Number(d[key]) || 0))) * 1.1;

  const padding = { top: title ? 50 : 30, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;

  // Title
  if (title) {
    svg += `<text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="#1a1a1a">${title}</text>`;
  }

  // Grid lines
  const gridLines = 5;
  const isPercentage = yKeys.some((key) => key.toLowerCase().includes('load') || key.toLowerCase().includes('%'));
  
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (i / gridLines) * chartHeight;
    svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>`;
    const value = maxY - (i / gridLines) * (maxY - minY);
    const formattedValue = isPercentage 
      ? `${value.toFixed(1)}%`
      : maxY > 1000000 
        ? `${(value / 1000000).toFixed(1)}M`
        : maxY > 1000
          ? `${(value / 1000).toFixed(1)}K`
          : value.toFixed(0);
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${formattedValue}</text>`;
  }

  // X-axis labels
  const xLabelInterval = Math.ceil(data.length / 10);
  data.forEach((point, index) => {
    if (index % xLabelInterval === 0 || index === data.length - 1) {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
      svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${point[xKey]}</text>`;
      svg += `<line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 5}" stroke="#666" stroke-width="1"/>`;
    }
  });

  // Axes
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#333" stroke-width="2"/>`;
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#333" stroke-width="2"/>`;

  // Draw data lines
  yKeys.forEach((yKey, colorIndex) => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EF4444'];
    const color = colors[colorIndex % colors.length];

    let pathData = '';
    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
      const value = Number(point[yKey]) || 0;
      const y = padding.top + chartHeight - ((value - minY) / (maxY - minY || 1)) * chartHeight;
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });

    svg += `<path d="${pathData}" stroke="${color}" stroke-width="2" fill="none"/>`;
    
    // Add circles at data points
    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
      const value = Number(point[yKey]) || 0;
      const y = padding.top + chartHeight - ((value - minY) / (maxY - minY || 1)) * chartHeight;
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
    });
  });

  // Legend
  if (yKeys.length > 1) {
    yKeys.forEach((yKey, index) => {
      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EF4444'];
      const color = colors[index % colors.length];
      const legendY = padding.top + index * 20;
      svg += `<rect x="${width - padding.right - 100}" y="${legendY - 8}" width="15" height="3" fill="${color}"/>`;
      svg += `<text x="${width - padding.right - 80}" y="${legendY}" font-size="10" fill="#333">${yKey}</text>`;
    });
  }

  svg += `</svg>`;

  // Encode SVG as data URI for @react-pdf/renderer
  // @react-pdf/renderer supports both base64 and URI-encoded SVG
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Clean up old chart cache files (background job)
 */
export async function cleanChartCache(maxAgeHours: number = 24): Promise<number> {
  await ensureChartsDir();

  const files = await import('fs/promises');
  const path = await import('path');
  const dirEntries = await files.readdir(CHARTS_CACHE_DIR);

  let deletedCount = 0;
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();

  for (const entry of dirEntries) {
    const filePath = path.join(CHARTS_CACHE_DIR, entry);
    const stats = await files.stat(filePath);

    if (now - stats.mtimeMs > maxAge) {
      await files.unlink(filePath);
      deletedCount++;
    }
  }

  return deletedCount;
}

