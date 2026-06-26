import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import { Building2, Image as ImageIcon, PenTool, CheckCircle2, Upload, Trash2 } from 'lucide-react';
import { organizationApi } from '@/api/organization.api';
import { Spinner } from '@/components/ui/Spinner';
import clsx from 'clsx';

const STEPS = ['Tu empresa', 'Logo', 'Firma', 'Personalización'];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Paso 1
  const [step1, setStep1] = useState({
    organizationName: '',
    responsibleName: '',
    jobTitle: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  });

  // Paso 2
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Paso 3
  const [signatureMode, setSignatureMode] = useState<'upload' | 'drawn' | 'none'>('none');
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  // Paso 4
  const [usagePrefs, setUsagePrefs] = useState({
    useLogoOnQuotes: true,
    useLogoOnReports: true,
    useSignatureOnQuotes: true,
    useSignatureOnReports: false,
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const goNext = async () => {
    setLoading(true);
    try {
      if (step === 0) {
        if (!step1.organizationName || !step1.responsibleName) {
          toast.error('Completa al menos el nombre de la empresa y tu nombre.');
          setLoading(false);
          return;
        }
        await organizationApi.onboardingStep1(step1);
      }

      if (step === 1 && logoFile) {
        await organizationApi.uploadLogo(logoFile);
      }

      if (step === 2) {
        if (signatureMode === 'upload' && signatureFile) {
          await organizationApi.uploadSignatureImage(signatureFile);
        } else if (signatureMode === 'drawn' && sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
          const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
          await organizationApi.saveDrawnSignature(dataUrl);
        } else if (signatureMode === 'none') {
          await organizationApi.clearSignature();
        }
      }

      if (step === 3) {
        await organizationApi.onboardingStep4(usagePrefs);
        await organizationApi.finishOnboarding();
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        toast.success('¡Todo listo! Bienvenido a Quotia.');
        navigate('/dashboard');
        return;
      }

      setStep((s) => s + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Indicador de pasos */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                    i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-400 text-ink-900' : 'bg-ink-200 text-ink-500'
                  )}
                >
                  {i < step ? <CheckCircle2 size={18} /> : i + 1}
                </div>
                <span className="text-xs font-medium text-ink-500">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx('mx-2 h-0.5 flex-1', i < step ? 'bg-emerald-500' : 'bg-ink-200')} />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          {step === 0 && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2 text-ink-900">
                <Building2 className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold">Cuéntanos sobre tu negocio</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-field">Nombre de la empresa *</label>
                  <input
                    className="input-field"
                    value={step1.organizationName}
                    onChange={(e) => setStep1({ ...step1, organizationName: e.target.value })}
                    placeholder="DC Topografía"
                  />
                </div>
                <div>
                  <label className="label-field">Tu nombre *</label>
                  <input
                    className="input-field"
                    value={step1.responsibleName}
                    onChange={(e) => setStep1({ ...step1, responsibleName: e.target.value })}
                    placeholder="Diego Contreras"
                  />
                </div>
                <div>
                  <label className="label-field">Cargo o profesión</label>
                  <input
                    className="input-field"
                    value={step1.jobTitle}
                    onChange={(e) => setStep1({ ...step1, jobTitle: e.target.value })}
                    placeholder="Topógrafo"
                  />
                </div>
                <div>
                  <label className="label-field">Teléfono</label>
                  <input
                    className="input-field"
                    value={step1.phone}
                    onChange={(e) => setStep1({ ...step1, phone: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div>
                  <label className="label-field">Correo</label>
                  <input
                    className="input-field"
                    type="email"
                    value={step1.email}
                    onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                    placeholder="contacto@empresa.cl"
                  />
                </div>
                <div>
                  <label className="label-field">Sitio web (opcional)</label>
                  <input
                    className="input-field"
                    value={step1.website}
                    onChange={(e) => setStep1({ ...step1, website: e.target.value })}
                    placeholder="https://"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Dirección (opcional)</label>
                  <input
                    className="input-field"
                    value={step1.address}
                    onChange={(e) => setStep1({ ...step1, address: e.target.value })}
                    placeholder="Calle, comuna, ciudad"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2 text-ink-900">
                <ImageIcon className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold">Tu logo corporativo</h2>
              </div>
              <p className="text-sm text-ink-500">Aparecerá en tus cotizaciones e informes. Puedes omitir este paso.</p>
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-200 p-8">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-24 max-w-full object-contain" />
                ) : (
                  <Upload className="text-ink-300" size={32} />
                )}
                <label className="btn-secondary cursor-pointer">
                  {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="text-xs text-ink-400">PNG, JPG o SVG</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2 text-ink-900">
                <PenTool className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold">Tu firma</h2>
              </div>
              <div className="flex gap-2">
                {(['upload', 'drawn', 'none'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSignatureMode(mode)}
                    className={clsx(
                      'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition',
                      signatureMode === mode ? 'border-brand-400 bg-brand-50 text-ink-900' : 'border-ink-200 text-ink-500'
                    )}
                  >
                    {mode === 'upload' ? 'Subir imagen' : mode === 'drawn' ? 'Dibujar firma' : 'No usar firma'}
                  </button>
                ))}
              </div>

              {signatureMode === 'upload' && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-200 p-8">
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="Firma" className="h-20 max-w-full object-contain" />
                  ) : (
                    <Upload className="text-ink-300" size={32} />
                  )}
                  <label className="btn-secondary cursor-pointer">
                    Subir firma
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleSignatureFileChange} />
                  </label>
                </div>
              )}

              {signatureMode === 'drawn' && (
                <div className="space-y-2">
                  <div className="rounded-xl border-2 border-dashed border-ink-200 bg-white">
                    <SignatureCanvas
                      ref={sigCanvasRef}
                      penColor="#111827"
                      canvasProps={{ className: 'w-full h-40 rounded-xl' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => sigCanvasRef.current?.clear()}
                    className="btn-secondary text-xs"
                  >
                    <Trash2 size={14} /> Borrar y reintentar
                  </button>
                </div>
              )}

              {signatureMode === 'none' && (
                <p className="rounded-lg bg-ink-50 p-4 text-sm text-ink-500">
                  No se mostrará firma en tus documentos. Podrás agregarla más adelante desde Configuración.
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2 text-ink-900">
                <CheckCircle2 className="text-brand-500" size={22} />
                <h2 className="text-lg font-semibold">¿Dónde usar tu logo y firma?</h2>
              </div>
              {[
                { key: 'useLogoOnQuotes', label: 'Usar logo en cotizaciones' },
                { key: 'useLogoOnReports', label: 'Usar logo en informes y reportes' },
                { key: 'useSignatureOnQuotes', label: 'Usar firma en cotizaciones' },
                { key: 'useSignatureOnReports', label: 'Usar firma en informes y reportes' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-lg border border-ink-100 p-3.5">
                  <span className="text-sm font-medium text-ink-700">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(usagePrefs as Record<string, boolean>)[item.key]}
                    onChange={(e) => setUsagePrefs({ ...usagePrefs, [item.key]: e.target.checked })}
                    className="h-5 w-5 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button type="button" onClick={goBack} disabled={step === 0} className="btn-secondary">
              Atrás
            </button>
            <button type="button" onClick={goNext} disabled={loading} className="btn-primary">
              {loading && <Spinner size={16} />}
              {step === STEPS.length - 1 ? 'Finalizar' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
