import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <main id="main-content" className="min-h-screen bg-bg-primary">
      <div className="container-wide flex min-h-screen max-w-md flex-col justify-center py-24">
        <ResetPasswordForm token={token ?? null} />
      </div>
    </main>
  );
}
