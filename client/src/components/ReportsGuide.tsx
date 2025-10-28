import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Calendar, Wallet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ReportsGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportsGuide({ open, onOpenChange }: ReportsGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">📊 Reports Guide</DialogTitle>
          <DialogDescription>
            A complete guide to understanding and using all reports in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Quick Decision Tree */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Quick Guide: Which Report Should I Use?
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">📊 Overall performance?</span>
                <span className="text-gray-600">→ User Performance Report</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">🔍 Why this payment?</span>
                <span className="text-gray-600">→ BV Transactions Report</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">📅 Monthly progress?</span>
                <span className="text-gray-600">→ Monthly BV Report</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">💰 Wallet activity?</span>
                <span className="text-gray-600">→ Fund History</span>
              </div>
            </div>
          </Card>

          {/* Report 1: User Performance Report */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">1. User Performance Report</h3>
                <Badge variant="outline" className="mt-1">User-Grouped Summary</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">What it shows:</p>
                <p className="text-sm text-gray-600">A report card for each team member - overall performance summary grouped by person</p>
              </div>
              
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">Key Metrics:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Total earnings (Direct Income + Differential Income)</li>
                  <li>Team size and direct recruits count</li>
                  <li>Current rank and next rank requirements</li>
                  <li>Monthly & Lifetime BV breakdowns</li>
                  <li>Wallet balance and withdrawals</li>
                  <li><strong>Eligibility Status</strong> - Ready for promotion or not?</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">When to use:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Deciding who deserves a promotion or reward</li>
                  <li>Checking if someone meets requirements for next rank</li>
                  <li>Identifying top performers in your team</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-semibold text-sm text-amber-900 mb-2">Understanding Eligibility:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span><strong>Eligible (Green):</strong> Meets both Team BVM and Direct recruits requirements - Ready for promotion!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span><strong>Partial (Yellow):</strong> Meets one requirement but not the other - Almost there!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span><strong>Not Eligible (Red):</strong> Needs to meet both requirements - Keep building!</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Report 2: BV Transactions Report */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">2. BV Transactions Report</h3>
                <Badge variant="outline" className="mt-1">Transaction-Level Detail</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">What it shows:</p>
                <p className="text-sm text-gray-600">A detailed receipt log of every commission payment - like a bank statement showing every deposit</p>
              </div>
              
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">Key Metrics:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li><strong>Direct Income:</strong> 10% sponsor commission from direct recruits</li>
                  <li><strong>Differential Income:</strong> Matching income from balanced team BV</li>
                  <li>Who triggered each BV calculation (initiating user)</li>
                  <li>Transaction date, type, and rank at time of earning</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">When to use:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Someone asks "Why did I get this payment?"</li>
                  <li>Verifying calculations are correct</li>
                  <li>Investigating specific transactions or income sources</li>
                  <li>Exporting detailed records for accounting</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm"><strong>Pro Tip:</strong> Filter by transaction type to see only Direct Income or Differential Income. This replaces the old separate "Direct Income Report".</p>
              </div>
            </div>
          </Card>

          {/* Report 3: Monthly BV Report */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">3. Monthly BV Report</h3>
                <Badge variant="outline" className="mt-1">Monthly Snapshots</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">What it shows:</p>
                <p className="text-sm text-gray-600">Monthly progress tracker for team building - shows how much business volume each leg generated this month</p>
              </div>
              
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">Key Metrics:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li><strong>Direct BV:</strong> BV from direct recruits you sponsored</li>
                  <li><strong>Left BV & Right BV:</strong> BV generated by each leg of your binary tree</li>
                  <li><strong>Team BVM:</strong> Matched BV (Minimum of Left & Right)</li>
                  <li>Month ID and period for tracking</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">When to use:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Tracking monthly team building progress</li>
                  <li>Checking if teams are balanced between left and right</li>
                  <li>Monitoring monthly goals and achievements</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm"><strong>Important:</strong> BV values reset monthly! Use this to track current month's progress, and use User Performance Report for lifetime totals.</p>
              </div>
            </div>
          </Card>

          {/* Report 4: Fund History */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">4. Fund History</h3>
                <Badge variant="outline" className="mt-1">Wallet Transaction Ledger</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">What it shows:</p>
                <p className="text-sm text-gray-600">A complete wallet transaction log - like a bank ledger showing all money movements</p>
              </div>
              
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">Key Metrics:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li><strong>Credits:</strong> Money added to wallet (earnings, admin credits)</li>
                  <li><strong>Debits:</strong> Money used for purchases or deductions</li>
                  <li><strong>Withdrawals:</strong> Money withdrawn to bank account</li>
                  <li>Balance before and after each transaction</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-sm text-gray-700 mb-1">When to use:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Tracking manual fund adjustments you made</li>
                  <li>Verifying withdrawal requests</li>
                  <li>Auditing wallet activity</li>
                  <li>Finding when money was added or removed</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm"><strong>Security Note:</strong> All admin fund adjustments are logged here with timestamps and descriptions for full audit trail.</p>
              </div>
            </div>
          </Card>

          {/* Comparison Table */}
          <Card className="p-6 bg-gray-50">
            <h3 className="text-lg font-bold mb-4">📋 Quick Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Report</th>
                    <th className="text-left py-2 px-3">View Type</th>
                    <th className="text-left py-2 px-3">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium">User Performance</td>
                    <td className="py-2 px-3">User-grouped summary</td>
                    <td className="py-2 px-3">Rank promotions, rewards decisions</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium">BV Transactions</td>
                    <td className="py-2 px-3">Transaction-level detail</td>
                    <td className="py-2 px-3">Income verification, debugging</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 font-medium">Monthly BV</td>
                    <td className="py-2 px-3">Monthly snapshots</td>
                    <td className="py-2 px-3">Leg balance, monthly goals</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Fund History</td>
                    <td className="py-2 px-3">All wallet movements</td>
                    <td className="py-2 px-3">Admin adjustments, wallet audit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pro Tips */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-lg font-bold mb-3">💡 Pro Tips for Admins</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span><strong>Use filters:</strong> All reports have powerful filters - narrow down by user, date, rank, or transaction type</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span><strong>Export to CSV:</strong> Download any report for offline analysis or record-keeping</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span><strong>Cross-reference:</strong> Use multiple reports together - check eligibility in User Performance, then verify BV in Transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span><strong>Regular reviews:</strong> Check User Performance weekly, Monthly BV at month-end, and Fund History for any wallet issues</span>
              </li>
            </ul>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
