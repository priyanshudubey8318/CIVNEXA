import http from 'http';
import fs from 'fs';
import path from 'path';

const BACKEND_BASE = 'http://localhost:8080/api/v1';
const FRONTEND_BASE = 'http://localhost:5174';

const makeRequest = (url, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        resolve({
          statusCode: res.statusCode,
          durationMs,
          bodyLength: data.length,
        });
      });
    });
    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      resolve({
        statusCode: 0,
        error: err.message,
        durationMs,
      });
    });
    req.end();
  });
};

const runConcurrencyBenchmark = async (url, concurrency, totalRequests) => {
  const durations = [];
  let successful = 0;
  let failed = 0;

  const startTotal = process.hrtime.bigint();
  let completed = 0;

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (completed < totalRequests) {
      completed++;
      const res = await makeRequest(url);
      durations.push(res.durationMs);
      if (res.statusCode >= 200 && res.statusCode < 400) {
        successful++;
      } else {
        failed++;
      }
    }
  });

  await Promise.all(workers);
  const endTotal = process.hrtime.bigint();
  const totalSeconds = Number(endTotal - startTotal) / 1_000_000_000;

  durations.sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  const mean = sum / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const rps = totalRequests / totalSeconds;

  return {
    concurrency,
    totalRequests,
    successful,
    failed,
    totalSeconds: Number(totalSeconds.toFixed(3)),
    rps: Number(rps.toFixed(1)),
    meanMs: Number(mean.toFixed(2)),
    p50Ms: Number(p50.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
  };
};

const runSuite = async () => {
  console.log('CIVNEXA Performance & Concurrency Benchmark Suite');
  console.log('==================================================');

  // 1. Single-request Baseline Latencies
  const endpoints = [
    { name: 'Public Categories API', url: `${BACKEND_BASE}/categories` },
    { name: 'Public Departments API', url: `${BACKEND_BASE}/departments` },
    { name: 'Frontend Root Bundle (Vite HTML)', url: `${FRONTEND_BASE}/` },
    { name: 'Frontend Main Script', url: `${FRONTEND_BASE}/src/main.jsx` },
  ];

  const singleResults = [];
  for (const ep of endpoints) {
    const res = await makeRequest(ep.url);
    singleResults.push({
      endpoint: ep.name,
      url: ep.url,
      status: res.statusCode,
      latencyMs: Number(res.durationMs.toFixed(2)),
      bytes: res.bodyLength,
    });
    console.log(`[Baseline] ${ep.name}: ${res.durationMs.toFixed(2)} ms (Status: ${res.statusCode})`);
  }

  // 2. Concurrency Load Benchmarks on Public API
  console.log('\nRunning Concurrency Load Tests on GET /api/v1/departments...');
  const concurrencyLevels = [10, 25, 50];
  const concurrencyResults = [];

  for (const c of concurrencyLevels) {
    const total = c * 10; // e.g. 100, 250, 500 requests
    const res = await runConcurrencyBenchmark(`${BACKEND_BASE}/departments`, c, total);
    concurrencyResults.push(res);
    console.log(
      `[Concurrency ${c}] ${res.totalRequests} reqs in ${res.totalSeconds}s | RPS: ${res.rps} | Mean: ${res.meanMs}ms | p50: ${res.p50Ms}ms | p95: ${res.p95Ms}ms | p99: ${res.p99Ms}ms | Success: ${res.successful}/${res.totalRequests}`
    );
  }

  const output = {
    timestamp: new Date().toISOString(),
    baseline: singleResults,
    concurrency: concurrencyResults,
  };

  const outPath = path.join(process.cwd(), 'performance-metrics.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nMetrics exported to ${outPath}`);
};

runSuite().catch(console.error);
