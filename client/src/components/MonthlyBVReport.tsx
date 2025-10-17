import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, X } from 'lucide-react';

export function MonthlyBVReport() {
  const [userIdFilter, setUserIdFilter] = useState('');
  const [monthIdFilter, setMonthIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Build query params
  const queryParams = new URLSearchParams();
  if (userIdFilter) queryParams.append('userId', userIdFilter);
  if (monthIdFilter) queryParams.append('monthId', monthIdFilter);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const { data: monthlyBvData = [], isLoading } = useQuery({
    queryKey: ['/api/admin/monthly-bv-report', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/admin/monthly-bv-report?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch monthly BV data');
      return response.json();
    },
  });

  const clearFilters = () => {
    setUserIdFilter('');
    setMonthIdFilter('');
    setStartDate('');
    setEndDate('');
  };

  const formatBV = (bv: string) => {
    return `${parseFloat(bv).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BV`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const exportToCSV = () => {
    const csvData = monthlyBvData.map((record: any) => ({
      'User ID': record.userId,
      'User Name': record.userName || 'N/A',
      'Month ID': record.monthId,
      'Month Period': `${formatDate(record.monthStartdate)} - ${formatDate(record.monthEnddate)}`,
      'Direct BV': record.monthBvDirects || '0.00',
      'Left BV': record.monthBvLeft || '0.00',
      'Right BV': record.monthBvRight || '0.00',
      'Total Team BV': record.totalMonthBv || '0.00',
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map((row: any) => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-bv-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const totalDirectBV = monthlyBvData.reduce((sum: number, record: any) => 
    sum + parseFloat(record.monthBvDirects || '0'), 0
  );
  const totalLeftBV = monthlyBvData.reduce((sum: number, record: any) => 
    sum + parseFloat(record.monthBvLeft || '0'), 0
  );
  const totalRightBV = monthlyBvData.reduce((sum: number, record: any) => 
    sum + parseFloat(record.monthBvRight || '0'), 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly BV Report</CardTitle>
        <p className="text-sm text-gray-500">
          View monthly BV data that resets each month for accurate period-specific reporting
        </p>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">User (ID/Name/Email)</label>
              <Input
                placeholder="Search user..."
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                data-testid="input-user-filter"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Month ID</label>
              <Input
                placeholder="e.g., 202410"
                value={monthIdFilter}
                onChange={(e) => setMonthIdFilter(e.target.value)}
                data-testid="input-month-filter"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              disabled={monthlyBvData.length === 0}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        {monthlyBvData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="text-total-records">
                {monthlyBvData.length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Direct BV</p>
              <p className="text-2xl font-bold text-purple-600" data-testid="text-total-direct-bv">
                {formatBV(totalDirectBV.toString())}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Left BV</p>
              <p className="text-2xl font-bold text-green-600" data-testid="text-total-left-bv">
                {formatBV(totalLeftBV.toString())}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Right BV</p>
              <p className="text-2xl font-bold text-orange-600" data-testid="text-total-right-bv">
                {formatBV(totalRightBV.toString())}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading monthly BV data...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && monthlyBvData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No monthly BV records found</p>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && monthlyBvData.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Month ID</TableHead>
                  <TableHead>Month Period</TableHead>
                  <TableHead>Direct BV</TableHead>
                  <TableHead>Left BV</TableHead>
                  <TableHead>Right BV</TableHead>
                  <TableHead>Total Team BV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyBvData.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`user-${record.id}`}>
                        {record.userId}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.userName || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`month-${record.id}`}>
                        {record.monthId}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(record.monthStartdate)} - {formatDate(record.monthEnddate)}
                    </TableCell>
                    <TableCell className="text-purple-600 font-medium" data-testid={`direct-bv-${record.id}`}>
                      {formatBV(record.monthBvDirects)}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium" data-testid={`left-bv-${record.id}`}>
                      {formatBV(record.monthBvLeft)}
                    </TableCell>
                    <TableCell className="text-orange-600 font-medium" data-testid={`right-bv-${record.id}`}>
                      {formatBV(record.monthBvRight)}
                    </TableCell>
                    <TableCell className="text-blue-600 font-bold" data-testid={`total-bv-${record.id}`}>
                      {formatBV(record.totalMonthBv)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
