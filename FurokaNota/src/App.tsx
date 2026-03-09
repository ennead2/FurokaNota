import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { TransactionList } from './components/Transactions/TransactionList';
import { BudgetSettings } from './components/Budget/BudgetSettings';
import { ReceiptUploader } from './components/Receipt/ReceiptUploader';
import { Settings } from './components/Settings/Settings';
import { RecurringSettings } from './components/Recurring/RecurringSettings';
import { useTransactionStore } from './stores/transactionStore';
import { useBudgetStore } from './stores/budgetStore';
import { useRecurringStore } from './stores/recurringStore';
import { seedDefaultCategories, generateRecurringForCurrentMonth } from './services/db';

const pageTitles: Record<string, string> = {
  '/': 'ダッシュボード',
  '/transactions': '収支一覧',
  '/budget': '予算設定',
  '/recurring': '定期支出・収入',
  '/receipt': 'レシートOCR',
  '/settings': '設定',
};

function AppInner() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { fetchAll: fetchTransactions } = useTransactionStore();
  const { fetchAll: fetchBudgets } = useBudgetStore();
  const { fetchAll: fetchRecurring } = useRecurringStore();

  useEffect(() => {
    seedDefaultCategories().then(async () => {
      await fetchRecurring();
      await generateRecurringForCurrentMonth();
      await fetchTransactions();
      await fetchBudgets();
    });
  }, [fetchTransactions, fetchBudgets, fetchRecurring]);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const title = pageTitles[location.pathname] ?? 'FurokaNota';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/budget" element={<BudgetSettings />} />
            <Route path="/recurring" element={<RecurringSettings />} />
            <Route path="/receipt" element={<ReceiptUploader />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppInner />
    </BrowserRouter>
  );
}
