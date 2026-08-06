import type { Metadata } from 'next';
import { ForgotPasswordForm } from '../../../components/portal/ForgotPasswordForm';
import statusStyles from '../../status.module.css';
import loginPageStyles from '../login/page.module.css';

export const metadata: Metadata = { title: 'Reset Password', robots: { index: false, follow: false } };

export default function AdminForgotPasswordPage() {
  return (
    <main className={`${statusStyles.main} ${loginPageStyles.main}`}>
      <h1 className={loginPageStyles.title}>Reset Password</h1>
      <p className={statusStyles.description}>Enter your email and we&apos;ll send you a reset link.</p>
      <div className={loginPageStyles.formWrap}>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
