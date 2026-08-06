import type { Metadata } from 'next';
import { ResetPasswordForm } from '../../../../components/portal/ResetPasswordForm';
import statusStyles from '../../../status.module.css';
import loginPageStyles from '../../../admin/login/page.module.css';

export const metadata: Metadata = { title: 'Set New Password', robots: { index: false, follow: false } };

export default async function ClientResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className={`${statusStyles.main} ${loginPageStyles.main}`}>
      <h1 className={loginPageStyles.title}>Set New Password</h1>
      <div className={loginPageStyles.formWrap}>
        <ResetPasswordForm token={token} loginHref="/client/login" />
      </div>
    </main>
  );
}
