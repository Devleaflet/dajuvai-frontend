import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';

const DataDeletion: React.FC = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', position: 'relative' }}>
    <Link to="/" style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <img src={logo} alt="Daju Vai Logo" style={{ height: 40, marginRight: 10 }} />
      <span style={{ fontWeight: 'bold', color: '#222', fontSize: 18 }}>Home</span>
    </Link>
    <div style={{ paddingTop: 60 }}>
      <h1>Data Deletion Instructions</h1>
      
      <p>
        At <strong>Daju Vai</strong>, we respect your privacy and your right to control your personal data. This page explains how you can request the deletion of your personal information from our systems.
      </p>

      <h2>What Data We Store</h2>
      <p>
        When you use our services, including Facebook Login, we may collect and store the following types of personal information:
      </p>
      <ul>
        <li>Your name and email address</li>
        <li>Profile information from Facebook (if you use Facebook Login)</li>
        <li>Account preferences and settings</li>
        <li>Order history and transaction data</li>
        <li>Communication records (emails, support tickets)</li>
        <li>Usage data and analytics</li>
      </ul>

      <h2>How to Request Data Deletion</h2>
      <p>
        You can request the deletion of your personal data through any of the following methods:
      </p>

      <h3>Option 1: Email Request</h3>
      <p>
        Send an email to our support team at <strong>[support@dajuvai.com]</strong> with the subject line "Data Deletion Request" and include:
      </p>
      <ul>
        <li>Your full name</li>
        <li>Email address associated with your account</li>
        <li>Reason for deletion (optional)</li>
        <li>Confirmation that you want to permanently delete your data</li>
      </ul>

      <h3>Option 2: Contact Form</h3>
      <p>
        Use our contact form on the website and select "Data Deletion Request" as the subject.
      </p>

      <h3>Option 3: Direct Contact</h3>
      <p>
        Contact us directly at <strong>Daju Vai, Kathmandu</strong> with your deletion request.
      </p>

      <h2>What Happens After Your Request</h2>
      <ol>
        <li><strong>Verification:</strong> We will verify your identity to ensure the request is legitimate.</li>
        <li><strong>Processing:</strong> Your request will be processed within 30 days of receipt.</li>
        <li><strong>Deletion:</strong> We will permanently delete your personal data from our systems.</li>
        <li><strong>Confirmation:</strong> You will receive a confirmation email once the deletion is complete.</li>
      </ol>

      <h2>What Gets Deleted</h2>
      <p>
        When you request data deletion, we will remove:
      </p>
      <ul>
        <li>Your account information</li>
        <li>Personal profile data</li>
        <li>Order history and transaction records</li>
        <li>Communication records</li>
        <li>Usage analytics data</li>
        <li>Any other personal information we have stored</li>
      </ul>

      <h2>What May Be Retained</h2>
      <p>
        Some information may be retained for legal or regulatory purposes:
      </p>
      <ul>
        <li>Financial records required for tax purposes</li>
        <li>Information required by law enforcement</li>
        <li>Data necessary for fraud prevention</li>
      </ul>

      <h2>Facebook Login Data</h2>
      <p>
        If you used Facebook Login to access our services:
      </p>
      <ul>
        <li>We will delete all data we received from Facebook</li>
        <li>Your Facebook account will remain unaffected</li>
        <li>You may need to revoke our app permissions in your Facebook settings</li>
      </ul>

      <h2>Important Notes</h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px', margin: '20px 0' }}>
        <ul>
          <li><strong>Permanent:</strong> Data deletion is permanent and cannot be undone.</li>
          <li><strong>Account Access:</strong> After deletion, you will lose access to your account and any associated services.</li>
          <li><strong>Re-registration:</strong> You can create a new account after deletion if desired.</li>
          <li><strong>Third-party Services:</strong> We cannot delete data stored by third-party services (like Facebook).</li>
        </ul>
      </div>

      <h2>Contact Information</h2>
      <p>
        For questions about data deletion or privacy concerns, please contact us:
      </p>
      <p>
        <strong>Daju Vai</strong><br />
        Kathmandu, Nepal<br />
        Email: [support@dajuvai.com]<br />
        Response Time: Within 30 days
      </p>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
        <h3>Need Help?</h3>
        <p>
          If you have any questions about this process or need assistance with your data deletion request, 
          please don't hesitate to contact our support team. We're here to help!
        </p>
      </div>
    </div>
  </div>
);

export default DataDeletion; 