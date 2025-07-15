import React from 'react';
import { AdminSidebar } from "../Components/AdminSidebar";

const AdminOrdersSkeleton: React.FC = () => {
  return (
    <div className="admin-orders">
      <AdminSidebar />
      <div className="admin-orders__content">
        {/* Header skeleton */}
        <div style={{ 
          padding: '1rem 2rem', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton skeleton-text" style={{ width: '150px', height: '24px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '300px', height: '40px', borderRadius: '8px' }}></div>
          </div>
        </div>
        
        <div className="admin-orders__list-container">
          <div className="admin-orders__header">
            <div className="skeleton skeleton-text" style={{ width: '200px', height: '32px' }}></div>
          </div>
          <div className="admin-orders__table-container">
            <table className="admin-orders__table">
              <thead className="admin-orders__table-head">
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Order Date</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array(7).fill(null).map((_, index) => (
                  <tr key={index} className="admin-orders__table-row">
                    <td>
                      <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }}></div>
                    </td>
                    <td className="admin-orders__name-cell">
                      <div className="admin-orders__profile-container">
                        <div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }}></div>
                        <div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }}></div>
                      </div>
                    </td>
                    <td>
                      <div className="skeleton skeleton-text" style={{ width: '150px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton skeleton-text" style={{ width: '100px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton skeleton-text" style={{ width: '70px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton skeleton-text" style={{ width: '90px', height: '16px' }}></div>
                    </td>
                    <td className="admin-orders__actions">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
                        <div className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
                        <div className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-orders__pagination-container">
            <div className="admin-orders__pagination-info">
              <div className="skeleton skeleton-text" style={{ width: '200px', height: '16px' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {Array(5).fill(null).map((_, index) => (
                <div key={index} className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersSkeleton; 