import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

/** Direct link entry for takeaway ordering (e.g. from a poster QR). */
export function TakeawayStart() {
  const { startOrder } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    startOrder('takeaway');
    navigate('/menu', { replace: true });
  }, [startOrder, navigate]);

  return <div className="customer-bg min-h-screen w-full" />;
}