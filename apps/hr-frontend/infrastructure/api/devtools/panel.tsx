/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  traceId: string;
  method: string;
  url: string;
  startTime: number;
  duration: number;
  status: number;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  error?: { type: string; message: string };
  side: 'server' | 'client';
}

export function DevtoolsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const poll = () => {
      fetch('/api/dev/request-log')
        .then(r => r.json())
        .then(data => {
          if (!cancelled && Array.isArray(data)) setLogs(data);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open]);

  const selectedLog = logs.find(l => l.traceId === selected);

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 99999,
          borderRadius: 9999,
          background: '#111827',
          padding: '8px 16px',
          fontSize: 12,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {open ? 'Close Devtools' : 'API Devtools'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 60,
            right: 16,
            zIndex: 99999,
            height: 500,
            width: 800,
            overflow: 'auto',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              background: '#fff',
              padding: '8px 16px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              API Requests ({logs.length})
            </h3>
            <button
              onClick={() => {
                fetch('/api/dev/request-log', { method: 'DELETE' })
                  .then(() => setLogs([]))
                  .catch(() => {});
              }}
              style={{
                fontSize: 12,
                color: '#6b7280',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>

          {selectedLog ? (
            <div style={{ padding: 16 }}>
              <button
                onClick={() => setSelected(null)}
                style={{
                  fontSize: 12,
                  color: '#2563eb',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  marginBottom: 12,
                }}
              >
                &larr; Back
              </button>
              <pre
                style={{
                  fontSize: 11,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              {logs.map(log => (
                <button
                  key={log.traceId}
                  onClick={() => setSelected(log.traceId)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 48,
                      borderRadius: 4,
                      padding: '2px 6px',
                      textAlign: 'center',
                      fontSize: 10,
                      fontWeight: 500,
                      ...(log.status >= 400
                        ? { background: '#fee2e2', color: '#b91c1c' }
                        : log.status >= 200 && log.status < 300
                        ? { background: '#dcfce7', color: '#15803d' }
                        : { background: '#f3f4f6', color: '#4b5563' }),
                    }}
                  >
                    {log.status || 'ERR'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: '#6b7280',
                    }}
                  >
                    {log.method}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                    }}
                  >
                    {log.url}
                  </span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>
                    {log.duration?.toFixed(1)}ms
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: '#d1d5db',
                      textTransform: 'uppercase',
                    }}
                  >
                    {log.side}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
