type MetricUnit = 'ms' | 'count' | 'score';

export type MetricEvent = {
  name: string;
  value: number;
  unit?: MetricUnit;
  tags?: Record<string, string>;
};

const metricsBuffer: Array<MetricEvent & { timestamp: number }> = [];

export function recordMetric(event: MetricEvent) {
  const enriched = { ...event, timestamp: Date.now() };
  metricsBuffer.push(enriched);

  if (process.env.NODE_ENV !== 'production') {
    console.info('[metric]', enriched);
  }
}

export function flushMetrics() {
  return metricsBuffer.splice(0, metricsBuffer.length);
}
