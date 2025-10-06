import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ChevronDown, ChevronRight, Users, TrendingUp, DollarSign } from 'lucide-react';

interface MultiChildTreeUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  sponsorId: string | null;
  parentId: string | null;
  position: string | null;
  order: number | null;
  packageAmount: string | null;
  activationDate: Date | null;
  idStatus: string | null;
  status: string | null;
  totalBV: string | null;
  leftBV: string | null;
  rightBV: string | null;
  totalDirects: number | null;
  leftDirects: number | null;
  rightDirects: number | null;
}

interface TreeStructure {
  user: MultiChildTreeUser;
  children: MultiChildTreeUser[];
  grandchildren: MultiChildTreeUser[];
}

interface TreeNodeProps {
  user: MultiChildTreeUser;
  position: 'root' | 'left' | 'right';
  onUserClick?: (userId: string) => void;
  onUserClickForModal?: (user: MultiChildTreeUser) => void;
}

const TreeNode = ({ user, position, onUserClick, onUserClickForModal }: TreeNodeProps) => {
  const displayName = `${user.firstName || 'Unknown'} ${user.lastName || ''}`.trim();
  const isActive = user.status === 'active';

  const handleClick = () => {
    // Call the original onUserClick if provided
    if (onUserClick) {
      onUserClick(user.id);
    }
    // Call the modal click handler if provided
    if (onUserClickForModal) {
      onUserClickForModal(user);
    }
  };

  return (
    <div className="flex flex-col items-center p-2">
      <Card 
        className={`w-40 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
          isActive ? 'border-green-500 dark:border-green-400 shadow-green-100 dark:shadow-green-900/20' : 'border-gray-300 dark:border-gray-600'
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="text-center">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mx-auto mb-2">
              {(user.firstName?.[0] || '?')}{(user.lastName?.[0] || '')}
            </div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
            <div className="mt-2 space-y-1">
              <Badge 
                variant={isActive ? 'default' : 'secondary'}
                className={`text-xs ${isActive ? 'bg-green-600' : ''}`}
              >
                {user.status || 'Inactive'}
              </Badge>
              {user.packageAmount && (
                <div className="flex items-center justify-center text-xs text-green-600 dark:text-green-400">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {user.packageAmount}
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {position === 'root' ? 'You' : position === 'left' ? 'Left' : 'Right'}
              </Badge>
              {user.order !== null && (
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                  #{user.order}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MultiChildTreeLevel = ({ 
  leftChildren, 
  rightChildren, 
  onUserClick,
  onUserClickForModal
}: { 
  leftChildren: MultiChildTreeUser[]; 
  rightChildren: MultiChildTreeUser[];
  onUserClick?: (userId: string) => void;
  onUserClickForModal?: (user: MultiChildTreeUser) => void;
}) => {
  return (
    <div className="flex justify-center items-start space-x-4 md:space-x-8 lg:space-x-16 px-4">
      {/* Left Side */}
      <div className="flex flex-col items-center">
        <div className="text-center mb-4">
          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
            Left Leg ({leftChildren.length})
          </Badge>
        </div>
        {leftChildren.length === 0 ? (
          <div className="w-32 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center">
              <Users className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Open Position</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto max-w-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {leftChildren.map((child) => (
              <TreeNode key={child.id} user={child} position="left" onUserClick={onUserClick} onUserClickForModal={onUserClickForModal} />
            ))}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex flex-col items-center">
        <div className="text-center mb-4">
          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
            Right Leg ({rightChildren.length})
          </Badge>
        </div>
        {rightChildren.length === 0 ? (
          <div className="w-32 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center">
              <Users className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Open Position</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto max-w-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {rightChildren.map((child) => (
              <TreeNode key={child.id} user={child} position="right" onUserClick={onUserClick} onUserClickForModal={onUserClickForModal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Click Tree Modal Component
const ClickTreeModal = ({ user, isOpen, onClose }: { user: MultiChildTreeUser | null; isOpen: boolean; onClose: () => void }) => {
  const [treeStructure, setTreeStructure] = useState<TreeStructure | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRootUser, setCurrentRootUser] = useState<MultiChildTreeUser | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setCurrentRootUser(user);
      fetchUserTreeStructure(user.id);
    }
  }, [isOpen, user]);

  const fetchUserTreeStructure = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Include impersonation token if available
      const headers: Record<string, string> = {};
      const impersonationToken = sessionStorage.getItem('impersonationToken');
      if (impersonationToken) {
        headers['Authorization'] = `Bearer ${impersonationToken}`;
      }
      
      const response = await fetch(`/api/multi-tree?userId=${userId}`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user tree structure');
      }
      
      const data = await response.json();
      setTreeStructure(data);
    } catch (error) {
      console.error('Error fetching user tree structure:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user tree structure');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClickInModal = (clickedUser: MultiChildTreeUser) => {
    setCurrentRootUser(clickedUser);
    fetchUserTreeStructure(clickedUser.id);
  };

  const handleBackToOriginal = () => {
    if (user) {
      setCurrentRootUser(user);
      fetchUserTreeStructure(user.id);
    }
  };

  if (!user) return null;

  const leftChildren = treeStructure?.children.filter(child => child.position === 'left') || [];
  const rightChildren = treeStructure?.children.filter(child => child.position === 'right') || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {currentRootUser?.firstName || 'Unknown'} {currentRootUser?.lastName || ''}'s Team Tree
            </DialogTitle>
            {currentRootUser?.id !== user.id && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToOriginal}
                className="text-xs"
              >
                ← Back to {user.firstName}
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2">Loading tree...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => fetchUserTreeStructure(currentRootUser?.id || '')} variant="outline">
              Try Again
            </Button>
          </div>
        ) : !treeStructure ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tree data available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Root User */}
            <div className="flex justify-center">
              <TreeNode user={treeStructure.user} position="root" onUserClickForModal={handleUserClickInModal} />
            </div>

            {/* Connection Lines */}
            {(leftChildren.length > 0 || rightChildren.length > 0) && (
              <div className="flex justify-center">
                <div className="relative w-64 h-8">
                  <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-300 dark:bg-gray-600 transform -translate-x-1/2"></div>
                  <div className="absolute top-4 left-8 right-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="absolute top-4 left-8 w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="absolute top-4 right-8 w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                </div>
              </div>
            )}

            {/* Children Level */}
            <MultiChildTreeLevel 
              leftChildren={leftChildren}
              rightChildren={rightChildren}
              onUserClickForModal={handleUserClickInModal}
            />

            {/* Statistics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{treeStructure.children.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Direct Recruits</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-2xl font-bold">{leftChildren.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Left Position</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-6 h-6 bg-teal-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-2xl font-bold">{rightChildren.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Right Position</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface MultiChildTreeViewProps {
  userId: string;
  onUserClick?: (userId: string) => void;
}

export default function MultiChildTreeView({ userId, onUserClick }: MultiChildTreeViewProps) {
  const [treeStructure, setTreeStructure] = useState<TreeStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedUser, setClickedUser] = useState<MultiChildTreeUser | null>(null);
  const [isClickModalOpen, setIsClickModalOpen] = useState(false);

  useEffect(() => {
    fetchTreeStructure();
  }, [userId]);

  const fetchTreeStructure = async () => {
    try {
      setLoading(true);
      
      // Include impersonation token if available
      const headers: Record<string, string> = {};
      const impersonationToken = sessionStorage.getItem('impersonationToken');
      if (impersonationToken) {
        headers['Authorization'] = `Bearer ${impersonationToken}`;
      }
      
      const response = await fetch(`/api/multi-tree`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tree structure');
      }
      
      const data = await response.json();
      setTreeStructure(data);
    } catch (error) {
      console.error('Error fetching tree structure:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch tree structure');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: MultiChildTreeUser) => {
    setClickedUser(user);
    setIsClickModalOpen(true);
  };

  const closeClickModal = () => {
    setIsClickModalOpen(false);
    setClickedUser(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Multi-Child Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2">Loading tree...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Multi-Child Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchTreeStructure} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!treeStructure) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Multi-Child Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No tree data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate children by position
  const leftChildren = treeStructure.children.filter(child => child.position === 'left');
  const rightChildren = treeStructure.children.filter(child => child.position === 'right');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Multi-Child Tree
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="space-y-8">
            {/* Root User */}
            <div className="flex justify-center">
              <TreeNode user={treeStructure.user} position="root" onUserClick={onUserClick} onUserClickForModal={handleUserClick} />
            </div>

            {/* Connection Lines */}
            {(leftChildren.length > 0 || rightChildren.length > 0) && (
              <div className="flex justify-center">
                <div className="relative w-64 h-8">
                  <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-300 dark:bg-gray-600 transform -translate-x-1/2"></div>
                  <div className="absolute top-4 left-8 right-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="absolute top-4 left-8 w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="absolute top-4 right-8 w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                </div>
              </div>
            )}

            {/* Children Level */}
            <MultiChildTreeLevel 
              leftChildren={leftChildren}
              rightChildren={rightChildren}
              onUserClick={onUserClick}
              onUserClickForModal={handleUserClick}
            />

            {/* Enhanced Tree Statistics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{treeStructure.children.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Direct Recruits</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-2xl font-bold">{leftChildren.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Left Position</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-6 h-6 bg-teal-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-2xl font-bold">{rightChildren.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Right Position</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {treeStructure.user.totalBV ? parseFloat(treeStructure.user.totalBV).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total BV</p>
                </CardContent>
              </Card>
            </div>

            {/* Tree Performance Metrics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Left Leg Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Members:</span>
                      <span className="font-medium">{leftChildren.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>BV:</span>
                      <span className="font-medium text-green-600">
                        ₹{treeStructure.user.leftBV || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={leftChildren.length > 0 ? 'default' : 'secondary'} className="text-xs">
                        {leftChildren.length > 0 ? 'Active' : 'Empty'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Right Leg Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Members:</span>
                      <span className="font-medium">{rightChildren.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>BV:</span>
                      <span className="font-medium text-green-600">
                        ₹{treeStructure.user.rightBV || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={rightChildren.length > 0 ? 'default' : 'secondary'} className="text-xs">
                        {rightChildren.length > 0 ? 'Active' : 'Empty'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Tree Balance</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Left/Right Ratio:</span>
                      <span className="font-medium">
                        {leftChildren.length}:{rightChildren.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Members:</span>
                      <span className="font-medium">{treeStructure.children.length + 1}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Growth:</span>
                      <Badge variant="outline" className="text-xs">
                        {leftChildren.length === rightChildren.length ? 'Balanced' : 
                         leftChildren.length > 0 || rightChildren.length > 0 ? 'Growing' : 'Empty'
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Multi-Child MLM Rules */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Multi-Child MLM Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Structure</h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Two legs: Left and Right positions</li>
                      <li>• Multiple children per leg (0 to N)</li>
                      <li>• Order-based placement within each leg</li>
                      <li>• Unlimited growth potential per leg</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Benefits</h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• More flexible recruitment</li>
                      <li>• Better leg balancing</li>
                      <li>• Higher earning potential</li>
                      <li>• Team cooperation encouraged</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Click Tree Modal */}
      <ClickTreeModal 
        user={clickedUser} 
        isOpen={isClickModalOpen} 
        onClose={closeClickModal} 
      />
    </>
  );
}