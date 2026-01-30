import { CreditCard, Banknote, FileText } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Espèces',
    description: 'Paiement au chauffeur',
    icon: Banknote,
  },
  {
    id: 'card',
    name: 'Carte bancaire',
    description: 'Visa, Mastercard, TWINT',
    icon: CreditCard,
  },
  {
    id: 'invoice',
    name: 'Facture',
    description: 'Entreprises uniquement',
    icon: FileText,
  },
];

export default function PaymentSelector({ selected, onSelect, showInvoice = false }) {
  const methods = showInvoice
    ? PAYMENT_METHODS
    : PAYMENT_METHODS.filter((m) => m.id !== 'invoice');

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Mode de paiement</p>
      <div className="space-y-2">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`payment-card w-full ${selected === method.id ? 'selected' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selected === method.id ? 'bg-navy-900' : 'bg-gray-100'
              }`}
            >
              <method.icon
                className={`w-5 h-5 ${
                  selected === method.id ? 'text-white' : 'text-gray-600'
                }`}
              />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-navy-900">{method.name}</p>
              <p className="text-xs text-gray-500">{method.description}</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === method.id
                  ? 'border-navy-900 bg-navy-900'
                  : 'border-gray-300'
              }`}
            >
              {selected === method.id && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
