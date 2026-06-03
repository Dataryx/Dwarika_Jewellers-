import { Clock, CheckCircle, XCircle, Truck, Package, ShoppingCart } from 'lucide-react';

export const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const;

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5" />,
  processing: <ShoppingCart className="w-3.5 h-3.5" />,
  shipped: <Truck className="w-3.5 h-3.5" />,
  delivered: <Package className="w-3.5 h-3.5" />,
  completed: <CheckCircle className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

type Variant = 'admin' | 'storefront';

interface OrderFulfillmentProgressProps {
  status: string;
  variant?: Variant;
}

const themes: Record<
  Variant,
  {
    cancelled: string;
    cancelledText: string;
    wrapper: string;
    label: string;
    stepDone: string;
    stepCurrent: string;
    stepPending: string;
    stepLabelDone: string;
    stepLabelPending: string;
    connectorDone: string;
    connectorPending: string;
  }
> = {
  admin: {
    cancelled: 'rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center gap-2',
    cancelledText: 'text-sm text-red-300',
    wrapper: 'rounded-xl border border-gray-700/80 bg-gray-800/40 p-4',
    label: 'text-[10px] uppercase tracking-wider text-gray-500 mb-3',
    stepDone: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    stepCurrent: 'bg-violet-500/20 border-violet-500/50 text-violet-300',
    stepPending: 'bg-gray-800 border-gray-700 text-gray-600',
    stepLabelDone: 'text-gray-300',
    stepLabelPending: 'text-gray-600',
    connectorDone: 'bg-emerald-500/40',
    connectorPending: 'bg-gray-700',
  },
  storefront: {
    cancelled: 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2',
    cancelledText: 'text-sm text-red-700',
    wrapper: 'rounded-lg border border-gray-100 bg-[#faf9f7] p-4',
    label: 'text-[10px] uppercase tracking-wider text-gray-500 mb-3',
    stepDone: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    stepCurrent: 'bg-[#c9a962]/15 border-[#c9a962]/40 text-[#8a7340]',
    stepPending: 'bg-white border-gray-200 text-gray-300',
    stepLabelDone: 'text-gray-700',
    stepLabelPending: 'text-gray-400',
    connectorDone: 'bg-emerald-300/70',
    connectorPending: 'bg-gray-200',
  },
};

export default function OrderFulfillmentProgress({ status, variant = 'storefront' }: OrderFulfillmentProgressProps) {
  const theme = themes[variant];

  if (status === 'cancelled') {
    return (
      <div className={theme.cancelled}>
        <XCircle className={`w-4 h-4 shrink-0 ${variant === 'admin' ? 'text-red-400' : 'text-red-500'}`} />
        <p className={theme.cancelledText}>This order was cancelled and cannot be fulfilled.</p>
      </div>
    );
  }

  const flowIndex = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
  const activeIdx = flowIndex >= 0 ? flowIndex : status === 'processing' ? 1 : 0;

  return (
    <div className={theme.wrapper}>
      <p className={theme.label}>Fulfillment progress</p>
      <div className="flex items-center gap-1 sm:gap-2">
        {ORDER_STATUS_FLOW.map((step, idx) => {
          const done = idx <= activeIdx;
          const current = idx === activeIdx;
          const icon = statusIcons[step] ?? statusIcons.pending;
          return (
            <div key={step} className="flex flex-1 items-center gap-1 sm:gap-2 min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                    done ? (current ? theme.stepCurrent : theme.stepDone) : theme.stepPending
                  }`}
                >
                  {icon}
                </div>
                <span
                  className={`text-[10px] sm:text-xs capitalize truncate w-full text-center ${
                    done ? theme.stepLabelDone : theme.stepLabelPending
                  }`}
                >
                  {step}
                </span>
              </div>
              {idx < ORDER_STATUS_FLOW.length - 1 && (
                <div
                  className={`h-px flex-1 min-w-[8px] mb-5 ${
                    idx < activeIdx ? theme.connectorDone : theme.connectorPending
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { statusIcons as orderStatusIcons };
