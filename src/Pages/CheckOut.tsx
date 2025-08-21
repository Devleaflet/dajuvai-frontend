import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import '../Styles/CheckOut.css';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import logo from '../assets/logo.webp';
import esewa from '../assets/esewa.png';
import npx from '../assets/npx.png';
import { useAuth } from '../context/AuthContext';
import AlertModal from '../Components/Modal/AlertModal';
import { API_BASE_URL } from '../config';

interface District {
  id: number;
  name: string;
}

interface PromoCode {
  id: number;
  promoCode: string;
  discountPercentage: number;
}

interface Vendor {
  id: number;
  businessName: string;
  district: District;
}

interface Variant {
  id?: number;
  sku?: string;
  basePrice?: string;
  discount?: string;
  discountType?: string;
  attributes?: { type: string; values: { value: string; nestedAttributes?: any[] }[] }[];
  variantImages?: string[];
  stock?: number;
  status?: string;
  productId?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  basePrice?: string | null;
  discount?: string;
  discountType?: string;
  status?: string;
  stock?: number | null;
  subcategoryId?: number;
  vendorId?: number;
  dealId?: number | null;
  bannerId?: number | null;
  productImages?: string[];
  brandId?: number | null;
  hasVariants?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CartItem {
  id: number;
  quantity: number;
  price: string;
  name: string;
  description?: string;
  image: string | null;
  variantId?: number;
  variant?: Variant;
  product?: Product;
}

interface ShippingGroup {
  vendorDistrict: string;
  vendorName: string;
  items: CartItem[];
  shippingCost: number;
  subtotal: number;
  lineTotal: number;
}

const Checkout: React.FC = () => {
  const location = useLocation();
  const { cartItems: contextCartItems, handleIncreaseQuantity, handleDecreaseQuantity } = useCart();
  let cartItems = contextCartItems;
  if (location.state && location.state.buyNow && location.state.product) {
    const p = location.state.product;
    cartItems = [{
      id: p.id,
      quantity: p.quantity,
      price: p.price,
      name: p.name,
      image: p.image || null,
      product: {
        id: p.id,
        name: p.name,
        vendorId: p.vendor?.id || 0,
        description: p.description || '',
        price: Number(p.price),
        rating: p.rating || 0,
        ratingCount: p.ratingCount || '0',
        image: p.image || '',
      },
    }];
    console.log('Buy Now cartItems:', cartItems);
  }
  console.log('Initial cartItems:', cartItems); // Debug initial cartItems
  const navigate = useNavigate();

  const [billingDetails, setBillingDetails] = useState({
    province: 'Bagmati',
    district: '',
    city: '',
    streetAddress: '',
    phoneNumber: '',
  });

  const auth = useAuth();
  const token = auth?.token;

  const [districts, setDistricts] = useState<District[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [vendors, setVendors] = useState<{ [key: number]: Vendor }>({});
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showPromoField, setShowPromoField] = useState(false);
  const [enteredPromoCode, setEnteredPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');

  const [formData, setformData] = useState({
    amount: "10",
    tax_amount: "0",
    total_amount: "10",
    transaction_uuid: uuidv4(),
    product_service_charge: "0",
    product_delivery_charge: "0",
    product_code: "EPAYTEST",
    success_url: `https://dajuvai-frontend-ykrq.vercel.app/order/esewa-payment-success`,
    failure_url: `https://dajuvai-frontend-ykrq.vercel.app/esewa-payment-failure`,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: "",
    secret: "8gBm/:&EnhH.1/q",
  });

  const generateSignature = (
    total_amount: string,
    transaction_uuid: string,
    product_code: string,
    secret: string
  ): string => {
    const hashString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const hash = CryptoJS.HmacSHA256(hashString, secret);
    const hashedSignature = CryptoJS.enc.Base64.stringify(hash);
    return hashedSignature;
  };

  useEffect(() => {
    const { total_amount, transaction_uuid, product_code, secret } = formData;
    const hashedSignature = generateSignature(
      total_amount,
      transaction_uuid,
      product_code,
      secret
    );
    setformData(prev => ({ ...prev, signature: hashedSignature }));
  }, [formData.amount]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^9\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setBillingDetails((prev) => ({ ...prev, [name]: numericValue }));
      if (numericValue && !validatePhoneNumber(numericValue)) {
        setPhoneError('Phone number must start with 9 and be exactly 10 digits long');
      } else {
        setPhoneError('');
      }
    } else {
      setBillingDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAgreed(e.target.checked);
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPaymentMethod(e.target.value);
  };

  const handleApplyPromoCode = () => {
    if (!enteredPromoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    const foundPromoCode = promoCodes.find(
      promo => promo.promoCode.toUpperCase() === enteredPromoCode.toUpperCase()
    );
    if (foundPromoCode) {
      setAppliedPromoCode(foundPromoCode);
      setPromoError('');
      setAlertMessage(`Promo code "${foundPromoCode.promoCode}" applied successfully! You saved ${foundPromoCode.discountPercentage}%`);
      setShowAlert(true);
    } else {
      setPromoError('Promo code not available');
      setAppliedPromoCode(null);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setEnteredPromoCode('');
    setPromoError('');
  };

  const handlePlaceOrder = async () => {
    if (!termsAgreed) {
      setAlertMessage('Please agree to the terms and conditions');
      setShowAlert(true);
      return;
    }
    if (!billingDetails.district || !billingDetails.city || !billingDetails.streetAddress || !billingDetails.phoneNumber) {
      setAlertMessage('Please fill in all required fields including phone number');
      setShowAlert(true);
      return;
    }
    if (!validatePhoneNumber(billingDetails.phoneNumber)) {
      setAlertMessage('Please enter a valid phone number (must start with 9 and be exactly 10 digits long)');
      setShowAlert(true);
      return;
    }
    if (cartItems.length === 0) {
      setAlertMessage('Your cart is empty');
      setShowAlert(true);
      return;
    }
    setIsPlacingOrder(true);
    try {
      const orderData = {
        shippingAddress: {
          province: billingDetails.province,
          city: billingDetails.city,
          streetAddress: billingDetails.streetAddress,
          district: billingDetails.district
        },
        paymentMethod: selectedPaymentMethod,
        phoneNumber: billingDetails.phoneNumber,
        ...(appliedPromoCode && { promoCode: appliedPromoCode.promoCode })
      };
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE_URL}/api/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        if (selectedPaymentMethod === 'CASH_ON_DELIVERY') {
          setAlertMessage('Order placed successfully!');
          setShowAlert(true);
        }
        setTimeout(() => {
          if (selectedPaymentMethod !== 'CASH_ON_DELIVERY' && selectedPaymentMethod !== 'ESEWA') {
            navigate('/order-page', {
              state: { orderDetails: { orderId: result.data?.id || null, totalAmount: finalTotal } },
            });
          } else {
            window.location.reload();
            setTimeout(() => { window.location.href = '/user-profile'; }, 100);
          }
        }, 1500);
      } else {
        setAlertMessage('Failed to place order. Please try again.');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setAlertMessage('An error occurred while placing your order. Please try again.');
      setShowAlert(true);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const normalizeDistrict = (district: string): string => {
    const kathmandu_valley = ['kathmandu', 'lalitpur', 'bhaktapur'];
    return kathmandu_valley.includes(district.toLowerCase()) ? 'Kathmandu Valley' : district;
  };

  const getVendorInfo = (item: CartItem) => {
    const vendorId = item.product?.vendorId || 0;
    console.log('Vendor ID:', vendorId, 'Vendors[1]:', vendors[1]); // Detailed debug
    return {
      businessName: vendors[vendorId]?.businessName || 'Unknown Vendor',
      district: vendors[vendorId]?.district?.name || 'Unknown District',
    };
  };

  const groupItemsByVendor = (): ShippingGroup[] => {
    if (cartItems.length === 0) return [];
    const vendorGroups: { [key: string]: CartItem[] } = {};
    cartItems.forEach((item) => {
      const vendorInfo = getVendorInfo(item);
      const key = `${vendorInfo.businessName}-${vendorInfo.district}`;
      if (!vendorGroups[key]) vendorGroups[key] = [];
      vendorGroups[key].push(item);
    });
    return Object.entries(vendorGroups).map(([_, items]) => {
      const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      const vendorInfo = getVendorInfo(items[0]);
      let shippingCost = 0;
      if (billingDetails.district) {
        const customerDistrict = normalizeDistrict(billingDetails.district);
        const normalizedVendorDistrict = normalizeDistrict(vendorInfo.district);
        shippingCost = customerDistrict === normalizedVendorDistrict ? 100 : 200;
      }
      const lineTotal = subtotal + shippingCost;
      return {
        vendorDistrict: vendorInfo.district,
        vendorName: vendorInfo.businessName,
        items,
        shippingCost,
        subtotal,
        lineTotal,
      };
    });
  };

  const vendorGroups = groupItemsByVendor();
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const totalShipping = vendorGroups.reduce((sum, group) => sum + group.shippingCost, 0);
  const total = subtotal + totalShipping;
  const discountPercentage = appliedPromoCode ? appliedPromoCode.discountPercentage : 0;
  const discountAmount = appliedPromoCode ? Math.round((total * discountPercentage) / 100) : 0;
  const finalTotal = total - discountAmount;

  const getVariantLabel = (item: CartItem): string => {
    const v = item.variant || item?.selectedVariant || null;
    if (!v) {
      const rootAttrs = (item && (item.variantAttributes || item.attributes)) || null;
      return rootAttrs ? formatAttributes(rootAttrs) : '';
    }
    if (typeof v.name === 'string' && v.name.trim()) return v.name.trim();
    const byAttrs = formatAttributes(v.attributes || v.attributeValues || v.attributeSpecs || v.attrs || null);
    if (byAttrs) return byAttrs;
    if (v.sku) return `SKU: ${String(v.sku)}`;
    return '';
  };

  const formatAttributes = (attrs: any): string => {
    if (!attrs) return '';
    if (Array.isArray(attrs)) {
      const parts = attrs.map((a: any) => {
        const label = String(a?.type ?? a?.attributeType ?? a?.name ?? '').trim();
        const valuesSrc = a?.values ?? a?.attributeValues ?? a?.value ?? a?.name ?? [];
        const valuesArr = Array.isArray(valuesSrc) ? valuesSrc : [valuesSrc];
        const valueText = valuesArr
          .map((v: any) => String((v && typeof v === 'object') ? (v.value ?? v.name ?? JSON.stringify(v)) : v))
          .filter(Boolean)
          .join('/');
        return label ? `${label}: ${valueText}` : valueText;
      }).filter(Boolean);
      return parts.join(', ');
    }
    if (typeof attrs === 'object') {
      const parts = Object.entries(attrs).map(([k, v]) => {
        const label = String(k).trim();
        const valueText = Array.isArray(v)
          ? v.map((x: any) => String(x?.value ?? x?.name ?? x)).join('/')
          : String((v as any)?.value ?? (v as any)?.name ?? v);
        return `${label}: ${valueText}`;
      });
      return parts.join(', ');
    }
    return String(attrs);
  };

  const handleIncrease = (item: CartItem) => {
    handleIncreaseQuantity(item.id, 1);
  };

  const handleDecrease = (item: CartItem) => {
    handleDecreaseQuantity(item.id, 1);
  };

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/district`);
        const result = await response.json();
        if (result.success) setDistricts(result.data);
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };

    const fetchPromoCodes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/promo`);
        const result = await response.json();
        if (result.success && result.data) setPromoCodes(result.data);
      } catch (error) {
        console.error('Error fetching promo codes:', error);
      }
    };

    const fetchVendors = async () => {
      const uniqueVendorIds = [...new Set(cartItems.map(item => item.product?.vendorId).filter(id => id !== undefined))];
      console.log('Unique Vendor IDs:', uniqueVendorIds); // Debug
      if (uniqueVendorIds.length > 0) {
        try {
          const vendorPromises = uniqueVendorIds.map(async (vendorId) => {
            const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const result = await response.json();
            return result.success ? { [vendorId]: result.data } : null; // Extract data object
          });
          const vendorData = await Promise.all(vendorPromises);
          const updatedVendors = vendorData.reduce((acc, curr) => ({ ...acc, ...curr }), {});
          console.log('Updated Vendors:', updatedVendors); // Debug full object
          setVendors(prevVendors => ({ ...prevVendors, ...updatedVendors }));
        } catch (error) {
          console.error('Error fetching vendors:', error);
        }
      }
    };

    fetchDistricts();
    fetchPromoCodes();
    fetchVendors();
  }, [cartItems, token]);

  return (
    <>
      <Navbar />
      <AlertModal open={showAlert} message={alertMessage} onClose={() => setShowAlert(false)} />
      <form id="esewa-form" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST" style={{ display: 'none' }}>
        <input type="hidden" name="amount" value={formData.amount} />
        <input type="hidden" name="tax_amount" value={formData.tax_amount} />
        <input type="hidden" name="total_amount" value={formData.total_amount} />
        <input type="hidden" name="transaction_uuid" value={formData.transaction_uuid} />
        <input type="hidden" name="product_code" value={formData.product_code} />
        <input type="hidden" name="product_service_charge" value={formData.product_service_charge} />
        <input type="hidden" name="product_delivery_charge" value={formData.product_delivery_charge} />
        <input type="hidden" name="success_url" value={formData.success_url} />
        <input type="hidden" name="failure_url" value={formData.failure_url} />
        <input type="hidden" name="signed_field_names" value={formData.signed_field_names} />
        <input type="hidden" name="signature" value={formData.signature} />
      </form>
      {showAlert && alertMessage && selectedPaymentMethod === 'CASH_ON_DELIVERY' && (
        <div className="checkout-container__alert">
          <span role="img" aria-label="success" style={{ fontSize: '1.5em', marginRight: '0.5em' }}>✅</span>
          {alertMessage}
        </div>
      )}
      <div className="checkout-container">
        <h2>Billing Details</h2>
        <div className="checkout-container__content">
          <div className="checkout-container__billing-details">
            <div className="checkout-container__form-group">
              <label className="checkout-container__form-label">Province</label>
              <select name="province" value={billingDetails.province} onChange={handleInputChange} className="checkout-container__form-group-select" required>
                <option value="Province 1">Province 1</option>
                <option value="Madhesh">Madhesh</option>
                <option value="Bagmati">Bagmati</option>
                <option value="Gandaki">Gandaki</option>
                <option value="Lumbini">Lumbini</option>
                <option value="Karnali">Karnali</option>
                <option value="Sudurpashchim">Sudurpashchim</option>
              </select>
            </div>
            <div className="checkout-container__form-group">
              <label className="checkout-container__form-label">District *</label>
              <select name="district" value={billingDetails.district} onChange={handleInputChange} className="checkout-container__form-group-select" required>
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.name}>{district.name}</option>
                ))}
              </select>
            </div>
            <div className="checkout-container__form-group">
              <label className="checkout-container__form-label">City *</label>
              <input type="text" name="city" value={billingDetails.city} onChange={handleInputChange} placeholder="Enter your city" className="checkout-container__form-group-input" required />
            </div>
            <div className="checkout-container__form-group">
              <label className="checkout-container__form-label">Street Address *</label>
              <input type="text" name="streetAddress" value={billingDetails.streetAddress} onChange={handleInputChange} placeholder="Enter your street address" className="checkout-container__form-group-input" required />
            </div>
            <div className="checkout-container__form-group">
              <label className="checkout-container__form-label">Phone Number *</label>
              <input type="tel" name="phoneNumber" value={billingDetails.phoneNumber} onChange={handleInputChange} placeholder="9xxxxxxxxx" className="checkout-container__form-group-input" maxLength={10} required />
              {phoneError && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{phoneError}</span>}
            </div>
            <div className="checkout-container__promo-section-left">
              <h3 style={{ marginBottom: '1rem', color: '#333' }}>🎉 Have a Promo Code?</h3>
              {!showPromoField ? (
                <button type="button" className="checkout-container__promo-button-left" onClick={() => setShowPromoField(true)} style={{
                  backgroundColor: '#ff6b35', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)', width: '100%', maxWidth: '300px'
                }}>✨ Apply Promo Code</button>
              ) : (
                <div className="checkout-container__promo-input-section-left">
                  <div className="checkout-container__promo-input-container-left" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" placeholder="Enter your promo code" value={enteredPromoCode} onChange={(e) => setEnteredPromoCode(e.target.value)} style={{ flex: 1, padding: '12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '16px', outline: 'none', transition: 'border-color 0.3s ease' }} />
                    <button type="button" onClick={handleApplyPromoCode} style={{ backgroundColor: '#ff6b35', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)' }}>Apply</button>
                  </div>
                  {promoError && <span style={{ color: 'red', fontSize: '0.9rem', display: 'block' }}>❌ {promoError}</span>}
                </div>
              )}
              {appliedPromoCode && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f9ff', border: '2px solid #22c55e', borderRadius: '8px', padding: '12px', marginTop: '15px' }}>
                  <span style={{ color: '#22c55e', fontSize: '16px', fontWeight: '600' }}>✅ "{appliedPromoCode.promoCode}" applied ({appliedPromoCode.discountPercentage}% off)</span>
                  <button type="button" onClick={handleRemovePromoCode} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', transition: 'background-color 0.3s ease' }}>Remove</button>
                </div>
              )}
            </div>
          </div>
          <div className="checkout-container__order-summary">
            <h3 className="checkout-container__order-summary-heading">Your Order</h3>
            <div className="checkout-container__order-details">
              <h4 className="checkout-container__order-details-heading">Product details</h4>
              {cartItems.length > 0 ? (
                <>
                  {vendorGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="checkout-container__vendor-group">
                      <div className="checkout-container__vendor-info">
                        <h5 className="checkout-container__vendor-name">Vendor: {group.vendorName}</h5>
                        <p className="checkout-container__vendor-location">Location: {group.vendorDistrict}</p>
                      </div>
                      {group.items.map((item) => (
                        <div key={item.id} className="checkout-container__product-item">
                          <img src={item.image || logo} alt={item.name} className="checkout-container__product-item-img" />
                          <div className="checkout-container__product-info">
                            <span className="checkout-container__product-info-text">{item.name}</span>
                            {(() => {
                              const label = getVariantLabel(item);
                              return label ? <small style={{ display: 'block', color: '#666', marginTop: 4 }}>Variant: {label}</small> : null;
                            })()}
                            <div className="checkout-container__quantity-controls">
                              <button className="checkout-container__quantity-controls-button" onClick={() => handleDecrease(item)}>-</button>
                              <span>{item.quantity}</span>
                              <button className="checkout-container__quantity-controls-button" onClick={() => handleIncrease(item)}>+</button>
                            </div>
                          </div>
                          <span className="checkout-container__product-price">Rs {(Number(item.price) * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="checkout-container__group-summary">
                        <div className="checkout-container__group-subtotal">
                          <span>Linetotal ({group.vendorName}):</span>
                          <span>Rs {group.subtotal.toLocaleString()}</span>
                        </div>
                        {billingDetails.district && (
                          <div className="checkout-container__group-shipping">
                            <span>Shipping from {group.vendorDistrict}:</span>
                            <span className="checkout-container__shipping-cost">
                              Rs {group.shippingCost.toLocaleString()}
                              {normalizeDistrict(billingDetails.district) === normalizeDistrict(group.vendorDistrict) && <small> (Same district)</small>}
                            </span>
                          </div>
                        )}
                        <div className="checkout-container__group-line-total">
                          <span><strong>Sub Total ({group.vendorName}):</strong></span>
                          <span><strong>Rs {group.lineTotal.toLocaleString()}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p>No items in cart.</p>
              )}
              <div className="checkout-container__order-total">
                <span>Sub Total:</span>
                <span>Rs {subtotal.toLocaleString()}</span>
              </div>
              {billingDetails.district && (
                <div className="checkout-container__order-total">
                  <span>Total Shipping:</span>
                  <span>Rs {totalShipping.toLocaleString()}</span>
                </div>
              )}
              {appliedPromoCode && (
                <div className="checkout-container__order-total">
                  <span>Discount ({discountPercentage}%):</span>
                  <span style={{ color: 'green' }}>- Rs {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="checkout-container__order-total--total">
                <span>Total Price</span>
                <span>Rs {finalTotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="checkout-container__payment-methods">
              <label className="checkout-container__payment-methods-label">
                <input type="radio" name="payment" value="CASH_ON_DELIVERY" className="checkout-container__payment-methods-input" checked={selectedPaymentMethod === 'CASH_ON_DELIVERY'} onChange={handlePaymentMethodChange} />
                Cash on delivery
              </label>
              <label className="checkout-container__payment-methods-label">
                <input type="radio" name="payment" value="ONLINE_PAYMENT" className="checkout-container__payment-methods-input" checked={selectedPaymentMethod === 'ONLINE_PAYMENT'} onChange={handlePaymentMethodChange} />
                <img src={npx} alt="NPX" className="checkout-container__payment-methods-img" />
              </label>
              <label className="checkout-container__payment-methods-label">
                <input type="radio" name="payment" value="ESEWA" className="checkout-container__payment-methods-input" checked={selectedPaymentMethod === 'ESEWA'} onChange={handlePaymentMethodChange} />
                <img src={esewa} alt="eSewa" className="checkout-container__payment-methods-img" />
              </label>
            </div>
            <p className="checkout-container__privacy-note">
              Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
            </p>
            <label className="checkout-container__terms-checkbox">
              <input type="checkbox" checked={termsAgreed} onChange={handleTermsChange} className="checkout-container__terms-checkbox-input" required />
              I have read and agree to the website terms and conditions *
            </label>
            <button className={`checkout-container__place-order-btn${!termsAgreed || isPlacingOrder ? '--disabled' : ''}`} disabled={!termsAgreed || isPlacingOrder} onClick={handlePlaceOrder}>
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
