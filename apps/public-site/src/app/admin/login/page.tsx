import type { Metadata } from 'next';
import { LoginForm } from '../../../components/portal/LoginForm';
import styles from '../../status.module.css';
import loginPageStyles from './page.module.css';

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className={`${styles.main} ${loginPageStyles.main}`}>
      <h1 className={loginPageStyles.title}>Admin Sign In</h1>
      <p className={styles.description}>AHW Architects staff access.</p>
      <div className={loginPageStyles.formWrap}>
        <LoginForm surface="admin" redirectTo="/admin" forgotPasswordHref="/admin/forgot-password" />
      </div>
    </main>
  );
}
