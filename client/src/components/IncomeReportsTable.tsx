import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IncomeReportsTableProps {
  reportType: 'direct' | 'roi' | 'salary' | 'all';
  title: string;
  description?: string;
}

const transactionTypeMap = {
  direct: ['sponsor_income'],
  roi: ['sales_incentive', 'sales_bonus'],
  salary: ['consistency_bonus', 'leadership_fund', 'house_fund', 'car_fund', 'travel_fund'],
  all: [
    'sponsor_income',
    'sales_incentive',
    'sales_bonus',
    'consistency_bonus',
    'franchise_income',
    'car_fund',
    'travel_fund',
    'leadership_fund',
    'house_fund',
    'millionaire_club',
    'royalty_income'
  ]
};

export function IncomeReportsTable({ reportType, title, description }: IncomeReportsTableProps) {
  const { toast } = useToast();
  const [searchUserId, setSearchUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    const types = transactionTypeMap[reportType];
    if (types.length > 0) {
      params.append('transactionTypes', types.join(','));
    }
    
    if (appliedFilters.userId) {
      params.append('userId', appliedFilters.userId);
    }
    if (appliedFilters.startDate) {
      params.append('startDate', appliedFilters.startDate);
    }
    if (appliedFilters.endDate) {
      params.append('endDate', appliedFilters.endDate);
    }
    
    return params.toString();
  };

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/income-reports', reportType, appliedFilters],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await fetch(`/api/admin/income-reports?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch income reports');
      }
      
      return response.json();
    }
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      userId: searchUserId,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setSearchUserId('');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({
      userId: '',
      startDate: '',
      endDate: '',
    });
  };

  const calculateTotal = () => {
    return reports.reduce((sum: number, report: any) => {
      return sum + parseFloat(report.amount || '0');
    }, 0).toFixed(2);
  };

  const formatIncomeType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'sponsor_income': 'Direct Income',
      'sales_bonus': 'Differential Income',
      'sales_incentive': 'Sales Incentive',
      'consistency_bonus': 'Consistency Bonus',
      'franchise_income': 'Franchise Income',
      'car_fund': 'Car Fund',
      'travel_fund': 'Travel Fund',
      'leadership_fund': 'Leadership Fund',
      'house_fund': 'House Fund',
      'millionaire_club': 'Millionaire Club',
      'royalty_income': 'Royalty Income'
    };
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportToCSV = () => {
    const csvData = reports.map((report: any) => ({
      'User ID': report.userDisplayId,
      'User Name': report.userName,
      'Email': report.userEmail,
      'Income Type': formatIncomeType(report.type),
      'Amount': `₹${parseFloat(report.amount).toFixed(2)}`,
      'Description': report.description,
      'Reference ID': report.referenceId || 'N/A',
      'Date': new Date(report.createdAt).toLocaleDateString(),
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map((row: any) => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-income-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Income report has been exported to CSV",
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl">{title}</h3>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => refetch()}
              size="sm"
              variant="outline"
              disabled={isLoading}
              data-testid="button-refresh-reports"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {reports.length > 0 && (
              <Button
                onClick={exportToCSV}
                size="sm"
                variant="outline"
                data-testid="button-export-csv"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-gray-700">Filters</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="searchUserId">User ID / Email</Label>
              <Input
                id="searchUserId"
                placeholder="Search by User ID or Email"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                data-testid="input-search-user"
              />
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="volt-gradient text-white"
              data-testid="button-apply-filters"
            >
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button
              onClick={handleClearFilters}
              size="sm"
              variant="outline"
              data-testid="button-clear-filters"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 p-4 bg-volt-light/10 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-800" data-testid="text-total-count">{reports.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-volt-light" data-testid="text-total-amount">₹{calculateTotal()}</p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-volt-light"></div>
            <span className="ml-2 text-gray-600">Loading income reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Income Data</h3>
            <p className="text-gray-600 mb-4">
              No income transactions found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">User</th>
                  <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-700">Description</th>
                  <th className="text-left p-3 font-medium text-gray-700">Reference</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report: any) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50" data-testid={`row-report-${report.id}`}>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-gray-800" data-testid={`text-user-name-${report.id}`}>{report.userName}</p>
                        <p className="text-xs text-gray-500">{report.userDisplayId}</p>
                        <p className="text-xs text-gray-400">{report.userEmail}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-volt-light/20 text-volt-dark">
                        {formatIncomeType(report.type)}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-volt-light" data-testid={`text-amount-${report.id}`}>
                      ₹{parseFloat(report.amount).toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {report.description}
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {report.referenceId || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
