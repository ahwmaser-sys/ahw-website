import type { Metadata } from 'next';
import { LoginForm } from '../../../components/portal/LoginForm';
import statusStyles from '../../status.module.css';
import loginPageStyles from '../../admin/login/page.module.css';

export const metadata: Metadata = {
  title: 'Client Login',
  robots: { index: false, follow: false },
};

export default function ClientLoginPage() {
  return (
    <main className={`${statusStyles.main} ${loginPageStyles.main}`}>
      <h1 className={loginPageStyles.title}>Client Sign In</h1>
      <p className={statusStyles.description}>Access your project dashboard.</p>
      <div className={loginPageStyles.formWrap}>
        <LoginForm surface="client" redirectTo="/client" forgotPasswordHref="/client/forgot-password" />
      </div>
    </main>
  );
}
