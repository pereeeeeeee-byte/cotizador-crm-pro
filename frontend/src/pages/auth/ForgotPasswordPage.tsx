import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { Spinner } from '@/components/ui/Spinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h2 className="mb-2 text-lg font-semibold text-ink-900">Recuperar contraseña</h2>
          {sent ? (
            <p className="text-sm text-ink-600">
              Si el correo existe en nuestro sistema, te enviamos instrucciones para restablecer tu contraseña.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <p className="text-sm text-ink-500">Te enviaremos un enlace para restablecer tu contraseña.</p>
              <div>
                <label className="label-field">Correo electrónico</label>
                <input
                  className="input-field"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading && <Spinner size={16} />}
                Enviar enlace
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-ink-400">
          <Link to="/login" className="font-semibold text-brand-400 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
