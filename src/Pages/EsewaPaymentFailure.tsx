import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import AlertModal from '../Components/Modal/AlertModal';

const EsewaPaymentFailure: React.FC = () => {
    const [search] = useSearchParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    const orderId = search.get('oid');

    useEffect(() => {

        console.log('orderId from URL:', orderId);
        console.log('token from AuthContext:', token);
        
        const handleFailure = async () => {
            if (!orderId) {
                setAlertMessage('Missing order ID');
                setShowAlert(true);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/order/esewa/fail`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token} `,
                    },
                    body: JSON.stringify({ orderId: parseInt(orderId) }),
                    credentials: 'include',
                });

                const result = await response.json();
                console.log('Payment failure response:', result);

                if (result.success) {
                    setAlertMessage('Payment failed. Your order has been cancelled.');
                    setShowAlert(true);
                } else {
                    setAlertMessage(`Payment cancellation failed: ${result.msg || 'Unknown error'} `);
                    setShowAlert(true);
                }
            } catch (error) {
                console.error('Error handling payment failure:', error);
                setAlertMessage('An error occurred while processing the payment failure. Please contact support.');
                setShowAlert(true);
            }
        };

        handleFailure();
    }, [orderId, token]);

    const handleBackHome = () => {
        navigate('/');
    };

    const handleTryAgain = () => {
        navigate('/checkout');
    };

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <AlertModal
                open={showAlert}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
                buttons={[
                    {
                        label: 'Try Again',
                        action: handleTryAgain,
                        style: { backgroundColor: '#ff6b35', color: 'white' },
                    },
                    {
                        label: 'Back to Home',
                        action: handleBackHome,
                        style: { backgroundColor: '#22c55e', color: 'white' },
                    },
                ]}
            />
            <h1>Processing Payment Failure...</h1>
        </div>
    );
};

export default EsewaPaymentFailure;
