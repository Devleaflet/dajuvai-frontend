import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      textAlign: 'center',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        maxWidth: '600px',
        padding: '40px',
        borderRadius: '10px',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '120px',
          fontWeight: 'bold',
          margin: '0',
          color: '#343a40',
          lineHeight: '1'
        }}>404</h1>
        
        <h2 style={{
          fontSize: '32px',
          margin: '20px 0 10px',
          color: '#495057'
        }}>Page Not Found</h2>
        
        <p style={{
          fontSize: '18px',
          color: '#6c757d',
          marginBottom: '30px'
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <button
          onClick={handleGoHome}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#4a6bff',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
            outline: 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#3a56d4';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4a6bff';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
          }}
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default PageNotFound;