import { useCurrency } from '../CurrencyContext';

function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  const currencies = [
    { code: 'TRY', symbol: '₺', name: 'TL' },
    { code: 'USD', symbol: '$', name: 'USD' },
    { code: 'EUR', symbol: '€', name: 'EUR' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        style={{
          background: '#1e293b',
          color: 'white',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '0.9rem',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {currencies.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} {curr.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CurrencySelector;
