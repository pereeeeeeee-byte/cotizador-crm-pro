import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/Spinner';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await authApi.login(values);
      setTokens(accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800">
            <span className="text-2xl font-bold text-brand-400">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Quotia</h1>
          <p className="mt-1 text-sm text-ink-400">Gestiona clientes y cotizaciones en minutos</p>
        </div>

        <div className="card">
          <h2 className="mb-5 text-lg font-semibold text-ink-900">Iniciar sesión</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label-field">Correo electrónico</label>
              <input className="input-field" type="email" placeholder="tu@correo.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label-field">Contraseña</label>
              <input className="input-field" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              <div className="mt-1 text-right">
                <Link to="/recuperar-password" className="text-xs font-medium text-brand-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Spinner size={16} />}
              Iniciar sesión
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-400">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-brand-400 hover:underline">
            Crea una gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
