import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Fetch user error", err);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 1. Create order on backend
      const { data: order } = await axios.post(
        `${API_BASE_URL}/api/payment/create-order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_Sbkprmbmyp3fDi", 
        amount: order.amount,
        currency: order.currency,
        name: "ToDoApp Pro",
        description: "Unlimited Todos & Priority Tasks",
        order_id: order.id,
        handler: async (response) => {
          try {
            // 3. Verify payment on backend
            await axios.post(
              `${API_BASE_URL}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Upgrade Successful! You are now a Pro member.");
            navigate("/dashboard");
          } catch (err) {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Upgrade error:", error.response?.data || error.message);
      alert(`Error starting payment process: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-container">
      <h1 className="pricing-title">Choose Your Plan</h1>
      <p className="pricing-subtitle">Unlock your full productivity potential</p>

      <div className="pricing-grid">
        {/* FREE PLAN */}
        <div className="pricing-card">
          <div className="plan-header">
            <h2>Free</h2>
            <div className="price">₹0<span>/month</span></div>
          </div>
          <ul className="plan-features">
            <li>Up to 10 Tasks</li>
            <li>Basic Priority Tags</li>
            <li>Standard Dashboard</li>
            <li className="disabled">Premium Skins</li>
            <li className="disabled">Priority Support</li>
          </ul>
          <button className="plan-btn secondary" disabled>
            {user?.subscriptionPlan === "free" ? "Current Plan" : "Basic"}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="pricing-card pro featured">
          <div className="featured-badge">MOST POPULAR</div>
          <div className="plan-header">
            <h2>Pro</h2>
            <div className="price">₹99<span>/month</span></div>
          </div>
          <ul className="plan-features">
            <li>Unlimited Tasks</li>
            <li>Advanced Priority Tags</li>
            <li>Custom Categories</li>
            <li>Premium Themes</li>
            <li>24/7 Support</li>
          </ul>
          <button 
            className="plan-btn primary" 
            onClick={handleUpgrade}
            disabled={loading || user?.subscriptionPlan === "pro"}
          >
            {loading ? "Processing..." : user?.subscriptionPlan === "pro" ? "Active" : "Upgrade to Pro"}
          </button>
        </div>
      </div>

      <style>{`
        .pricing-container {
          padding: 80px 20px;
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
          font-family: 'Inter', sans-serif;
        }
        .pricing-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pricing-subtitle {
          color: #64748b;
          font-size: 1.25rem;
          margin-bottom: 50px;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-top: 20px;
        }
        .pricing-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .pricing-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.15);
        }
        .pricing-card.featured {
          border: 2px solid #3b82f6;
          transform: scale(1.05);
        }
        .pricing-card.featured:hover {
          transform: scale(1.05) translateY(-5px);
        }
        .featured-badge {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          background: #3b82f6;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .plan-header h2 {
          font-size: 1.5rem;
          color: #1e293b;
          margin-bottom: 15px;
        }
        .price {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 30px;
        }
        .price span {
          font-size: 1rem;
          color: #64748b;
          font-weight: 400;
        }
        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 40px 0;
          text-align: left;
        }
        .plan-features li {
          padding: 12px 0;
          color: #475569;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
        }
        .plan-features li::before {
          content: '✓';
          margin-right: 12px;
          color: #10b981;
          font-weight: 800;
        }
        .plan-features li.disabled {
          color: #cbd5e1;
          text-decoration: line-through;
        }
        .plan-features li.disabled::before {
          color: #cbd5e1;
        }
        .plan-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .plan-btn.primary {
          background: #3b82f6;
          color: white;
        }
        .plan-btn.primary:hover:not(:disabled) {
          background: #2563eb;
        }
        .plan-btn.secondary {
          background: #f1f5f9;
          color: #64748b;
        }
        .plan-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Pricing;
