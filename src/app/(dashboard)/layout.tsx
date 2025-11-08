import { Header, Footer } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header/>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}