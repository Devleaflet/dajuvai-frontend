import React, { useMemo, useState } from 'react';
import Modal from './Modal';

interface VariantSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onConfirm: (variantId: number | string) => void;
}

// Safely format variant attributes supporting different API shapes
const formatVariantAttributes = (attributes: any): string => {
  if (!attributes) return '';
  if (Array.isArray(attributes)) {
    return attributes
      .map((attr: any) => {
        const label = String(attr?.type ?? attr?.attributeType ?? '');
        const vals = Array.isArray(attr?.values)
          ? attr.values.map((v: any) => String(v?.value ?? v)).filter(Boolean)
          : Array.isArray(attr?.attributeValues)
            ? attr.attributeValues.map((v: any) => String(v?.value ?? v)).filter(Boolean)
            : [];
        return label && vals.length ? `${label}: ${vals.join(', ')}` : '';
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof attributes === 'object') {
    return Object.entries(attributes)
      .map(([key, value]) => {
        if (value == null) return '';
        if (Array.isArray(value)) {
          const vals = value.map((v: any) => String(v?.value ?? v)).filter(Boolean);
          return `${key}: ${vals.join(', ')}`;
        }
        if (typeof value === 'object') {
          const val = (value as any).value ?? (value as any).name ?? '';
          return val ? `${key}: ${String(val)}` : `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${String(value)}`;
      })
      .filter(Boolean)
      .join(', ');
  }
  return String(attributes);
};

const toNumber = (v: any): number => {
  if (v === undefined || v === null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const calcPrice = (base: any, disc?: any, discType?: string): number => {
  const baseNum = toNumber(base);
  if (!disc || !discType) return baseNum;
  const d = typeof disc === 'string' ? parseFloat(disc) : Number(disc);
  if (!Number.isFinite(d)) return baseNum;
  if (discType === 'PERCENTAGE') return baseNum * (1 - d / 100);
  if (discType === 'FIXED' || discType === 'FLAT') return baseNum - d;
  return baseNum;
};

const VariantSelectModal: React.FC<VariantSelectModalProps> = ({ isOpen, onClose, product, onConfirm }) => {
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  const variants = useMemo(() => Array.isArray(product?.variants) ? product.variants : [], [product]);

  const handleAdd = () => {
    if (selectedId == null) return;
    onConfirm(selectedId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Variant" size="medium"
      footer={(
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', border: '1px solid #ddd', background: '#fff', borderRadius: 4 }}>Cancel</button>
          <button onClick={handleAdd} disabled={selectedId == null} style={{ padding: '8px 14px', background: selectedId == null ? '#ccc' : '#ea5f0a', color: '#fff', border: 'none', borderRadius: 4, cursor: selectedId == null ? 'not-allowed' : 'pointer' }}>
            Add to Cart
          </button>
        </div>
      )}
    >
      {variants.length === 0 ? (
        <div>No variants available.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {variants.map((v: any) => {
            const stock = v?.stock ?? 0;
            const disabled = stock <= 0 || v?.status === 'OUT_OF_STOCK' || v?.status === 'DISCONTINUED';
            const base = v?.price ?? v?.originalPrice ?? v?.basePrice ?? product?.basePrice ?? 0;
            const price = typeof v?.calculatedPrice === 'number' && Number.isFinite(v.calculatedPrice)
              ? v.calculatedPrice
              : calcPrice(base, v?.discount, String(v?.discountType ?? ''));
            const attrs = formatVariantAttributes(v?.attributes);
            const isSelected = selectedId === v?.id;
            return (
              <label key={v?.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: isSelected ? '2px solid #ea5f0a' : '1px solid #e5e5e5', borderRadius: 6, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer', background: '#fff' }}>
                <input
                  type="radio"
                  name="variant"
                  disabled={disabled}
                  checked={isSelected}
                  onChange={() => !disabled && setSelectedId(v?.id)}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>{attrs || `Variant #${v?.id}`}</span>
                  <span style={{ color: '#28a745', fontWeight: 600 }}>Rs {price.toFixed(2)}</span>
                  {disabled && <span style={{ color: '#dc3545', fontSize: 12 }}>Out of stock</span>}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default VariantSelectModal;
