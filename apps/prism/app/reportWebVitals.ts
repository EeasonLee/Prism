import type { NextWebVitalsMetric } from 'next/web-vitals';
import { recordMetric } from '../lib/observability/metrics';

export function reportWebVitals(metric: NextWebVitalsMetric) {
  recordMetric({
    name: metric.name,
    value: metric.value,
    unit: metric.name === 'CLS' ? 'score' : 'ms',
    tags: {
      id: metric.id,
      label: metric.label,
    },
  });
}
