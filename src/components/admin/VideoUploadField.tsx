import { useRef, useState } from 'react';
import { Upload, X, Video } from 'lucide-react';
import { readVideoFileAsDataUrl } from '../../lib/videoToDataUrl';

type VideoUploadFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hint?: string;
};

export function VideoUploadField({ label, value, onChange, disabled, hint }: VideoUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await readVideoFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not process video.');
    } finally {
      setBusy(false);
    }
  };

  const hasVideo = Boolean(value.trim());

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Video className="w-4 h-4 text-amber-500 shrink-0" />
        {label}
      </label>

      <div className="flex flex-wrap gap-4 items-start">
        {hasVideo ? (
          <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden border border-gray-600 bg-black shrink-0">
            <video
              key={value.slice(0, 48)}
              className="absolute inset-0 w-full h-full object-cover"
              src={value}
              muted
              playsInline
              loop
              autoPlay
            />
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => {
                onChange('');
                setError('');
              }}
              className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
              title="Remove video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        <div className="flex-1 min-w-[220px] space-y-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 hover:bg-gray-600 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {busy ? 'Processing…' : 'Upload video from computer'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            className="hidden"
            disabled={disabled || busy}
            onChange={handleFile}
          />
          {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
