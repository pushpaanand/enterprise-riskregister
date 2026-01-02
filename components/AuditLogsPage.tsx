import React, { useState, useEffect } from 'react';
import { apiUrl } from '../api';

interface AuditLog {
  AuditLogId: string;
  TableName: string;
  RecordId: string;
  Operation: 'INSERT' | 'UPDATE' | 'DELETE';
  FieldName: string | null;
  OldValue: string | null;
  NewValue: string | null;
  ChangedByUserId: string | null;
  ChangedByUserName: string | null;
  ChangedAtUtc: string;
  IPAddress: string | null;
  UserAgent: string | null;
  AdditionalInfo: string | null;
}

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  
  // Filters
  const [tableNameFilter, setTableNameFilter] = useState<string>('');
  const [operationFilter, setOperationFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tableNameFilter) params.append('tableName', tableNameFilter);
      if (operationFilter) params.append('operation', operationFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(apiUrl('/audit-logs') + `?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [offset, tableNameFilter, operationFilter, startDateFilter, endDateFilter]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const truncateValue = (value: string | null, maxLength: number = 100) => {
    if (!value) return '-';
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + '...';
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleResetFilters = () => {
    setTableNameFilter('');
    setOperationFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setOffset(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-base-content dark:text-dark-content">Audit Logs</h2>
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 text-sm font-medium text-base-content dark:text-dark-content bg-base-200 dark:bg-dark-200 hover:bg-base-300 dark:hover:bg-dark-300 rounded-md transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-base-100 dark:bg-dark-100 rounded-lg border border-base-300 dark:border-dark-300">
        <div>
          <label className="block text-sm font-medium text-base-content dark:text-dark-content mb-1">
            Table Name
          </label>
          <select
            value={tableNameFilter}
            onChange={(e) => {
              setTableNameFilter(e.target.value);
              setOffset(0);
            }}
            className="w-full px-3 py-2 border border-base-300 dark:border-dark-300 rounded-md bg-base-50 dark:bg-dark-50 text-base-content dark:text-dark-content"
          >
            <option value="">All Tables</option>
            <option value="Risks">Risks</option>
            <option value="Users">Users</option>
            <option value="Incidents">incidents_t</option>
            <option value="Departments">Departments</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content dark:text-dark-content mb-1">
            Operation
          </label>
          <select
            value={operationFilter}
            onChange={(e) => {
              setOperationFilter(e.target.value);
              setOffset(0);
            }}
            className="w-full px-3 py-2 border border-base-300 dark:border-dark-300 rounded-md bg-base-50 dark:bg-dark-50 text-base-content dark:text-dark-content"
          >
            <option value="">All Operations</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content dark:text-dark-content mb-1">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={startDateFilter}
            onChange={(e) => {
              setStartDateFilter(e.target.value);
              setOffset(0);
            }}
            className="w-full px-3 py-2 border border-base-300 dark:border-dark-300 rounded-md bg-base-50 dark:bg-dark-50 text-base-content dark:text-dark-content"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content dark:text-dark-content mb-1">
            End Date
          </label>
          <input
            type="datetime-local"
            value={endDateFilter}
            onChange={(e) => {
              setEndDateFilter(e.target.value);
              setOffset(0);
            }}
            className="w-full px-3 py-2 border border-base-300 dark:border-dark-300 rounded-md bg-base-50 dark:bg-dark-50 text-base-content dark:text-dark-content"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-base-content-muted dark:text-dark-content-muted">
        Showing {logs.length} of {total} audit logs
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8 text-base-content-muted dark:text-dark-content-muted">
          Loading audit logs...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Logs table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-base-300 dark:divide-dark-300 bg-base-50 dark:bg-dark-50">
              <thead className="sticky top-0 z-10 bg-base-100 dark:bg-dark-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    Table
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    Operation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    Old Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    New Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    Changed By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-base-content-muted dark:text-dark-content-muted uppercase tracking-wider border-b border-base-300 dark:border-dark-300">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 dark:divide-dark-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-base-content-muted dark:text-dark-content-muted">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.AuditLogId} className="hover:bg-base-100 dark:hover:bg-dark-100">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-base-content dark:text-dark-content">
                        {formatDate(log.ChangedAtUtc)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-base-content dark:text-dark-content">
                        {log.TableName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getOperationColor(log.Operation)}`}>
                          {log.Operation}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-base-content dark:text-dark-content">
                        {log.FieldName || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-base-content dark:text-dark-content max-w-xs">
                        <div className="truncate" title={log.OldValue || ''}>
                          {truncateValue(log.OldValue, 80)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-base-content dark:text-dark-content max-w-xs">
                        <div className="truncate" title={log.NewValue || ''}>
                          {truncateValue(log.NewValue, 80)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-base-content dark:text-dark-content">
                        {log.ChangedByUserName || log.ChangedByUserId || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-base-content dark:text-dark-content">
                        {log.IPAddress || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && total > limit && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 text-sm font-medium text-base-content dark:text-dark-content bg-base-200 dark:bg-dark-200 hover:bg-base-300 dark:hover:bg-dark-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-base-content-muted dark:text-dark-content-muted">
            Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 text-sm font-medium text-base-content dark:text-dark-content bg-base-200 dark:bg-dark-200 hover:bg-base-300 dark:hover:bg-dark-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;

