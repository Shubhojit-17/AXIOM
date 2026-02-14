import { AlertTriangle } from 'lucide-react';

interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div className="glass-card border-red-500/20 flex items-center gap-4">
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
      <div className="flex-1">
        <p className="text-red-300 text-sm">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm px-4 py-2">
          Retry
        </button>
      )}
    </div>
  );
}
