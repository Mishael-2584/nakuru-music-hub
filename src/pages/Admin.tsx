import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AdminPanel from "@/components/AdminPanel";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Invoice } from '../integrations/supabase/types';

function AdminInvoicesPanel() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  async function fetchInvoices() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, []);

  // Admin actions: edit, void, mark as paid
  async function handleAction(id: string, action: 'void' | 'paid') {
    setLoading(true);
    setError(null);
    try {
      if (action === 'void') {
        await fetch('/api/invoices', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      } else if (action === 'paid') {
        await fetch('/api/invoices/mark-paid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      }
      await fetchInvoices();
    } catch (err) {
      setError('Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Invoices</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input placeholder="Filter by student ID" value={filter} onChange={e => setFilter(e.target.value)} />
      <button onClick={fetchInvoices}>Refresh</button>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Student</th><th>Amount</th><th>Status</th><th>Due</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.filter(inv => !filter || inv.student_id.includes(filter)).map(inv => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.student_id}</td>
              <td>{inv.amount}</td>
              <td>{inv.status}</td>
              <td>{inv.due_date}</td>
              <td>
                {inv.status !== 'void' && <button onClick={() => handleAction(inv.id, 'void')}>Void</button>}
                {inv.status !== 'paid' && <button onClick={() => handleAction(inv.id, 'paid')}>Mark Paid</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, isInitialized, signOut } = useAuth();

  useEffect(() => {
    if (isInitialized && !loading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, isAuthenticated, isInitialized, navigate]);

  if (!isInitialized || loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg font-semibold">Loading Admin Panel...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    <Link to="/" className="group">
                      <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-10 transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
                    </Link>
                    <span className="text-sm font-semibold text-gray-500 hidden sm:block">Admin Panel</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.user_metadata.avatar_url} alt={user.email} />
                                <AvatarFallback>
                                    <UserCircle className="w-8 h-8 text-gray-500" />
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Admin</p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </header>
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorBoundary fallbackTitle="Admin panel failed to load">
            <AdminPanel />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Admin;
