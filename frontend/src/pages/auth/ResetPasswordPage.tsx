import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { Spinner } from '@/components/ui/Spinner';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Enlace inválido.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'El enlace es inválido o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h2 className="mb-5 text-lg font-semibold text-ink-900">Restablecer contraseña</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label-field">Nueva contraseña</label>
              <input
                className="input-field"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Spinner size={16} />}
              Restablecer contraseña
            </button>
          </form>
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
