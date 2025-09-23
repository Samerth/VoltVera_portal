import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  LogIn, 
  Edit, 
  UserX, 
  Eye, 
  EyeOff, 
  Copy,
  Download
} from "lucide-react";

interface User {
  id: string;
  userId?: string; // Login ID (e.g., VV0007)
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  sponsorId?: string;
  sponsorUserId?: string; // Sponsor's user ID (e.g., VV0001)
  packageAmount: string;
  cryptoWalletAddress?: string;
  txnPin?: string;
  password?: string; // Hashed password from backend
  originalPassword?: string; // Original password for admin viewing
  status: 'active' | 'inactive' | 'pending';
  registrationDate: string;
  activationDate?: string;
  // Derived fields from other tables
  walletBalance?: number;
  totalEarnings?: number;
  totalWithdrawals?: number;
}

interface FreeUsersTableProps {
  users: User[];
  walletData?: Record<string, { balance: number; totalEarnings: number; totalWithdrawals: number }>;
  withdrawalData?: Record<string, { status: string }>;
}

export default function FreeUsersTable({ users, walletData = {}, withdrawalData = {} }: FreeUsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.userId?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.mobile?.includes(searchTerm) ||
      user.sponsorUserId?.toLowerCase().includes(searchLower)
    );
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      return apiRequest('PUT', `/api/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/free-users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Impersonate user mutation
  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/admin/impersonate/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Redirecting to user dashboard...",
      });
      // Redirect to user dashboard
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to impersonate user",
        variant: "destructive",
      });
    },
  });

  // Export data
  const exportData = () => {
    const data = filteredUsers.map(user => {
      const wallet = walletData[user.id];
      return [
        user.userId || '',
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        user.mobile || '',
        user.email || '',
        user.originalPassword || '',
        user.txnPin || '',
        user.sponsorUserId || '',
        user.packageAmount || '0.00',
        user.cryptoWalletAddress || '',
        wallet?.balance || 0,
        wallet?.totalEarnings || 0,
        wallet?.totalWithdrawals || 0,
        new Date(user.registrationDate).toLocaleDateString(),
        user.activationDate ? new Date(user.activationDate).toLocaleDateString() : ''
      ].join(',');
    });
    
    const headers = [
      'User ID', 'Name', 'Phone', 'Email', 'Password', 'TXN Pin', 
      'Sponsor User ID', 'Total Package', 'Wallet Address', 'E-wallet', 
      'Income', 'Total Withdraw', 'Registration Date', 'Activation Date'
    ].join(',');
    
    const csvContent = [headers, ...data].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `free-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setIsExportDialogOpen(false);
    toast({
      title: "Success",
      description: "Data exported successfully",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Export Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} free users
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>TXN Pin</TableHead>
                  <TableHead>Sponsor User ID</TableHead>
                  <TableHead>Total Package</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>E-wallet</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Total Withdraw</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Activation Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const wallet = walletData[user.id];
                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {user.userId || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          {getStatusBadge(user.status)}
                        </div>
                      </TableCell>
                      <TableCell>{user.mobile || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {showPassword ? (user.originalPassword || user.password) : '••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(user.originalPassword || user.password || '');
                              toast({
                                title: "Copied",
                                description: "Password copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{user.txnPin || '-'}</TableCell>
                      <TableCell>{user.sponsorUserId || '-'}</TableCell>
                      <TableCell>₹{user.packageAmount || '0.00'}</TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate">
                          {user.cryptoWalletAddress || '-'}
                        </div>
                      </TableCell>
                      <TableCell>₹{wallet?.balance || 0}</TableCell>
                      <TableCell>₹{wallet?.totalEarnings || 0}</TableCell>
                      <TableCell>₹{wallet?.totalWithdrawals || 0}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(user.registrationDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.activationDate ? new Date(user.activationDate).toLocaleDateString() : '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Free Users Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={exportData}>
                Export {filteredUsers.length} Users
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
