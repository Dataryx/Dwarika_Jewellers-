import { useRef, useState } from 'react';
import { Upload, X, Link2 } from 'lucide-react';
import { compressImageFileToDataUrl } from '../../lib/imageToDataUrl';

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** Softer limit for homepage banner (localStorage) */
  variant?: 'default' | 'banner';
  hint?: string;
  /** When false, hide the URL field — upload from computer only */
  allowUrl?: boolean;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  disabled,
  variant = 'default',
  hint,
  allowUrl = true,
}: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const maxBlobBytes = variant === 'banner' ? 480_000 : 900_000;

  const isDataUrl = value.startsWith('data:');
  const urlFieldValue = isDataUrl ? '' : value;
  const LabelIcon = allowUrl ? Link2 : Upload;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, { maxBlobBytes });
      onChange(dataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <LabelIcon className="w-4 h-4 text-violet-500 shrink-0" />
          {label}
        </label>
      ) : null}

      <div className="flex flex-wrap gap-4 items-start">
        {value ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-600 bg-gray-900 shrink-0">
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => {
                onChange('');
                setError('');
              }}
              className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        <div className="flex-1 min-w-[220px] space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 hover:bg-gray-600 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {busy ? 'Processing…' : 'Upload from computer'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || busy}
              onChange={handleFile}
            />
          </div>
          {allowUrl ? (
            <input
              type="text"
              disabled={disabled || busy}
              value={urlFieldValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={isDataUrl ? 'Paste a URL to replace the uploaded image' : 'https://… or upload above'}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500 disabled:opacity-50"
            />
          ) : null}
          {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
