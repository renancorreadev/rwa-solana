import { FC, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  variant: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: ReactNode;
}

const variants = {
  info: {
    icon: Info,
    containerClass: 'bg-blue-500/10 border-blue-500/30',
    iconClass: 'text-blue-400',
    titleClass: 'text-blue-300',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-yellow-500/10 border-yellow-500/30',
    iconClass: 'text-yellow-400',
    titleClass: 'text-yellow-300',
  },
  success: {
    icon: CheckCircle,
    containerClass: 'bg-green-500/10 border-green-500/30',
    iconClass: 'text-green-400',
    titleClass: 'text-green-300',
  },
  error: {
    icon: XCircle,
    containerClass: 'bg-red-500/10 border-red-500/30',
    iconClass: 'text-red-400',
    titleClass: 'text-red-300',
  },
};

export const Callout: FC<Props> = ({ variant, title, children }) => {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'my-6 rounded-xl border-l-4 p-4',
        config.containerClass
      )}
    >
      <div className="flex gap-3">
        <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)} />
        <div className="flex-1 min-w-0">
          {title && (
            <h5 className={clsx('font-semibold mb-1', config.titleClass)}>
              {title}
            </h5>
          )}
          <div className="text-gray-300 text-sm leading-relaxed prose-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
