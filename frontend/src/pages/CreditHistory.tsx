import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Zap, 
  ShoppingCart, 
  Minus,
  Plus,
  Gift,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { creditsApi } from '@/service/api/creditsApi';
import { CreditTransaction, CreditResponse, CreditBalance, CreditHistoryResponse } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { format } from 'date-fns';

const CreditHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [credits, setCredits] = useState<CreditResponse[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    fetchData();
  }, [isAuthenticated, navigate, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (token) {
        creditsApi.setToken(token);
      }
      
      const [historyResponse, creditsResponse, balanceResponse] = await Promise.all([
        creditsApi.getCreditHistory(currentPage, perPage),
        creditsApi.getUserCredits(),
        creditsApi.getCreditBalance()
      ]);
      
      setTransactions(historyResponse.transactions);
      setTotalPages(historyResponse.total_pages);
      setTotal(historyResponse.total);
      setCredits(creditsResponse);
      setCreditBalance(balanceResponse);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load credit history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return ShoppingCart;
      case 'usage':
        return Minus;
      case 'bonus':
        return Gift;
      case 'refund':
        return RotateCcw;
      default:
        return Zap;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600';
      case 'usage':
        return 'text-red-600';
      case 'bonus':
        return 'text-blue-600';
      case 'refund':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionSign = (type: string) => {
    return type === 'usage' ? '-' : '+';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">Loading credit history...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => navigate('/credits')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Credits
              </Button>
              <h1 className="text-3xl font-bold">Credit History</h1>
              <p className="text-muted-foreground">
                Track your credit purchases and usage
              </p>
            </div>
            <Button onClick={() => navigate('/credits')}>
              <Plus className="h-4 w-4 mr-2" />
              Buy Credits
            </Button>
          </div>

          {/* Current Balance Summary */}
          {creditBalance && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Credit Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {creditBalance.remaining_credits}
                    </div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{creditBalance.used_credits}</div>
                    <div className="text-sm text-muted-foreground">Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{creditBalance.total_credits}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {creditBalance.expiring_soon}
                    </div>
                    <div className="text-sm text-muted-foreground">Expiring Soon</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="credits">Credit Packages</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>
                        Showing {transactions.length} of {total} transactions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No transactions yet</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => navigate('/credits')}
                      >
                        Purchase Your First Credits
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((transaction) => {
                        const Icon = getTransactionIcon(transaction.type);
                        const colorClass = getTransactionColor(transaction.type);
                        const sign = getTransactionSign(transaction.type);
                        
                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full bg-muted ${colorClass}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${colorClass}`}>
                                {sign}{Math.abs(transaction.amount)} credits
                              </div>
                              <Badge 
                                variant="outline" 
                                className="capitalize text-xs"
                              >
                                {transaction.type}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Credit Packages</CardTitle>
                  <CardDescription>
                    Active credit packages in your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {credits.length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No credit packages found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {credits.map((credit) => (
                        <div
                          key={credit.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {credit.amount} Credits Package
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Purchased {format(new Date(credit.created_at), 'MMM d, yyyy')}
                                {credit.expires_at && (
                                  <span>
                                    {' • '}Expires {format(new Date(credit.expires_at), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {credit.remaining} / {credit.amount} remaining
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {credit.used} used
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreditHistory;