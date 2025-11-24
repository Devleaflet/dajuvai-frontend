// import React, { useEffect, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router";

// interface PaymentData {
//   total_amount?: number;
// }

// const PaymentSuccess: React.FC = () => {
//   const [search] = useSearchParams();
//   const navigate = useNavigate();
//   const dataQuery = search.get("data");
//   const [data, setData] = useState<PaymentData>({});

//   useEffect(() => {
//     const resData = atob(dataQuery);
//     const resObject = JSON.parse(resData);
//     //(resObject);

//     setData(resObject);
//   }, [search]);

//   const handleBackHome = () => {
//     navigate("/");
//   };

//   return (
//     <div>
//       <h1>Rs. {data.total_amount}</h1>
//       <p>Payment Successful</p>
//       <button onClick={handleBackHome}>Back to Home</button>
//     </div>
//   );
// };

// export default PaymentSuccess;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import AlertModal from '../Components/Modal/AlertModal';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    const queryString = url.substring(url.indexOf("?") + 1);
    const normalized = queryString.replace("?", "&");
    const searchParams = new URLSearchParams(normalized);

    const orderId = searchParams.get("oid");
    const tokenParam = searchParams.get("data");

    //("OrderId:", orderId);
    //("TokenParam:", tokenParam);

    const verifyPayment = async () => {
      if (!tokenParam || !orderId) {
        setAlertMessage('Missing payment token or order ID');
        setShowAlert(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/order/esewa/success`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token} `,
          },
          body: JSON.stringify({ token: tokenParam, orderId: parseInt(orderId) }),
          credentials: 'include',
        });

        const result = await response.json();
        //('Payment verification response:', result);

        if (result.success) {
          setAlertMessage('Payment successful! Your order has been confirmed.');
        } else {
          setAlertMessage(`Payment verification failed: ${result.msg || 'Unknown error'}`);
        }
        setShowAlert(true);
      } catch (error) {
        console.error('Error verifying payment:', error);
        setAlertMessage('An error occurred while verifying your payment. Please contact support.');
        setShowAlert(true);
      }
    };

    verifyPayment();
  }, [token]);

  const handleBackHome = () => navigate('/');
  const handleViewOrders = () => navigate('/user-profile', { state: { activeTab: 'orders' } });

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <AlertModal
        open={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
        buttons={[
          {
            label: 'View Orders',
            action: handleViewOrders,
            style: { backgroundColor: '#ff6b35', color: 'white' },
          },
          {
            label: 'Back to Home',
            action: handleBackHome,
            style: { backgroundColor: '#22c55e', color: 'white' },
          },
        ]}
      />
      <h1>Processing Payment...</h1>
    </div>
  );
};

export default PaymentSuccess;
