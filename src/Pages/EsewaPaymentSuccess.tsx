import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";

interface PaymentData {
  total_amount?: number;
}

const PaymentSuccess: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const dataQuery = search.get("data");
  const [data, setData] = useState<PaymentData>({});

  useEffect(() => {
    const resData = atob(dataQuery);
    const resObject = JSON.parse(resData);
    console.log(resObject);

    setData(resObject);
  }, [search]);

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div>
      <h1>Rs. {data.total_amount}</h1>
      <p>Payment Successful</p>
      <button onClick={handleBackHome}>Back to Home</button>
    </div>
  );
};

export default PaymentSuccess;