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
  const [fundFilter, setFundFilter] = useState<string>('all');

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
      const result = await response.json();
      // Backend can return either raw array or wrapped in {success, data}
      if (Array.isArray(result)) {
        return result;
      } else if (result?.data && Array.isArray(result.data)) {
        return result.data;
      }
      return [];
    },
  });

  const clearFilters = () => {
    setUserIdFilter('');
    setMonthIdFilter('');
    setStartDate('');
    setEndDate('');
    setFundFilter('all');
  };

  // Filter data based on fund eligibility
  const filteredData = monthlyBvData.filter((record: any) => {
    if (fundFilter === 'all') return true;
    if (fundFilter === 'car' && record.fundEligibility?.carFund) return true;
    if (fundFilter === 'travel' && record.fundEligibility?.travelFund) return true;
    if (fundFilter === 'leadership' && record.fundEligibility?.leadershipFund) return true;
    if (fundFilter === 'house' && record.fundEligibility?.houseFund) return true;
    if (fundFilter === 'millionaire' && record.fundEligibility?.millionaireClub) return true;
    return false;
  });

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
    const csvData = filteredData.map((record: any) => ({
      'User ID': record.userId,
      'User Name': record.userName || 'N/A',
      'Month ID': record.monthId,
      'Month Period': `${formatDate(record.monthStartdate)} - ${formatDate(record.monthEnddate)}`,
      'Rank': record.currentRank || 'Executive',
      'Direct BV': record.monthBvDirects || '0.00',
      'Left BV': record.monthBvLeft || '0.00',
      'Right BV': record.monthBvRight || '0.00',
      'Total Team BV': record.totalMonthBv || '0.00',
      'Car Fund': record.fundEligibility?.carFund ? 'Eligible' : 'Not Eligible',
      'Travel Fund': record.fundEligibility?.travelFund ? 'Eligible' : 'Not Eligible',
      'Leadership Fund': record.fundEligibility?.leadershipFund ? 'Eligible' : 'Not Eligible',
      'House Fund': record.fundEligibility?.houseFund ? 'Eligible' : 'Not Eligible',
      'Millionaire Club': record.fundEligibility?.millionaireClub ? 'Eligible' : 'Not Eligible',
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

  // Calculate summary statistics from filtered data
  const totalDirectBV = filteredData.reduce((sum: number, record: any) => 
    sum + parseFloat(record.monthBvDirects || '0'), 0
  );
  const totalLeftBV = filteredData.reduce((sum: number, record: any) => 
    sum + parseFloat(record.monthBvLeft || '0'), 0
  );
  const totalRightBV = filteredData.reduce((sum: number, record: any) => 
    sum + parseFloat(record.monthBvRight || '0'), 0
  );
  
  // Count fund eligible users
  const carFundEligible = filteredData.filter((r: any) => r.fundEligibility?.carFund).length;
  const travelFundEligible = filteredData.filter((r: any) => r.fundEligibility?.travelFund).length;
  const leadershipFundEligible = filteredData.filter((r: any) => r.fundEligibility?.leadershipFund).length;
  const houseFundEligible = filteredData.filter((r: any) => r.fundEligibility?.houseFund).length;
  const millionaireClubEligible = filteredData.filter((r: any) => r.fundEligibility?.millionaireClub).length;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div>
              <label className="text-sm font-medium mb-1 block">Fund Eligibility</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                value={fundFilter}
                onChange={(e) => setFundFilter(e.target.value)}
                data-testid="select-fund-filter"
              >
                <option value="all">All Users</option>
                <option value="car">Car Fund Eligible</option>
                <option value="travel">Travel Fund Eligible</option>
                <option value="leadership">Leadership Fund Eligible</option>
                <option value="house">House Fund Eligible</option>
                <option value="millionaire">Millionaire Club Eligible</option>
              </select>
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-total-records">
                  {filteredData.length}
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

            {/* Fund Eligibility Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-gray-600 mb-1">Car Fund</p>
                <p className="text-xl font-bold text-yellow-700" data-testid="text-car-fund-count">
                  {carFundEligible}
                </p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600 mb-1">Travel Fund</p>
                <p className="text-xl font-bold text-indigo-700" data-testid="text-travel-fund-count">
                  {travelFundEligible}
                </p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                <p className="text-xs text-gray-600 mb-1">Leadership Fund</p>
                <p className="text-xl font-bold text-pink-700" data-testid="text-leadership-fund-count">
                  {leadershipFundEligible}
                </p>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                <p className="text-xs text-gray-600 mb-1">House Fund</p>
                <p className="text-xl font-bold text-teal-700" data-testid="text-house-fund-count">
                  {houseFundEligible}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-xs text-gray-600 mb-1">Millionaire Club</p>
                <p className="text-xl font-bold text-red-700" data-testid="text-millionaire-fund-count">
                  {millionaireClubEligible}
                </p>
              </div>
            </div>
          </>
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
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Month ID</TableHead>
                  <TableHead>Direct BV</TableHead>
                  <TableHead>Team BV</TableHead>
                  <TableHead className="text-center">Car Fund</TableHead>
                  <TableHead className="text-center">Travel</TableHead>
                  <TableHead className="text-center">Leadership</TableHead>
                  <TableHead className="text-center">House</TableHead>
                  <TableHead className="text-center">Millionaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`user-${record.id}`}>
                        {record.userId}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{record.userName || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {record.currentRank || 'Executive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`month-${record.id}`}>
                        {record.monthId}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-purple-600 font-medium" data-testid={`direct-bv-${record.id}`}>
                      {formatBV(record.monthBvDirects)}
                    </TableCell>
                    <TableCell className="text-blue-600 font-bold" data-testid={`total-bv-${record.id}`}>
                      {formatBV(record.totalMonthBv)}
                    </TableCell>
                    <TableCell className="text-center" data-testid={`car-fund-${record.id}`}>
                      {record.fundEligibility?.carFund ? (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">✓</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" data-testid={`travel-fund-${record.id}`}>
                      {record.fundEligibility?.travelFund ? (
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">✓</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" data-testid={`leadership-fund-${record.id}`}>
                      {record.fundEligibility?.leadershipFund ? (
                        <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">✓</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" data-testid={`house-fund-${record.id}`}>
                      {record.fundEligibility?.houseFund ? (
                        <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">✓</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center" data-testid={`millionaire-fund-${record.id}`}>
                      {record.fundEligibility?.millionaireClub ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">✓</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
