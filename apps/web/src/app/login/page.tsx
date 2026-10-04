import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="wrap" style={{ maxWidth: 360, paddingTop: '20vh' }}>
      <h1 style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 24 }}>Tjalve</h1>
      <LoginForm />
    </div>
  );
}
