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
  organizationName: z.string().min(2, 'Ingresa el nombre de tu empresa'),
  fullName: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const { accessToken, refreshToken } = await authApi.register(values);
      setTokens(accessToken, refreshToken);
      toast.success('Cuenta creada. ¡Configuremos tu negocio!');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400">
            <span className="text-2xl font-bold text-ink-900">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-ink-400">14 días de prueba gratis, sin tarjeta</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label-field">Nombre de tu empresa</label>
              <input className="input-field" placeholder="Ej: DC Topografía" {...register('organizationName')} />
              {errors.organizationName && (
                <p className="mt-1 text-xs text-red-600">{errors.organizationName.message}</p>
              )}
            </div>
            <div>
              <label className="label-field">Tu nombre completo</label>
              <input className="input-field" placeholder="Ej: Diego Contreras" {...register('fullName')} />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="label-field">Correo electrónico</label>
              <input className="input-field" type="email" placeholder="tu@correo.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label-field">Contraseña</label>
              <input className="input-field" type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Spinner size={16} />}
              Crear cuenta gratis
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
