import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';

const PrivacyPolicy: React.FC = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', position: 'relative' }}>
    <Link to="/" style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <img src={logo} alt="Daju Vai Logo" style={{ height: 40, marginRight: 10 }} />
      <span style={{ fontWeight: 'bold', color: '#222', fontSize: 18 }}>Home</span>
    </Link>
    <div style={{ paddingTop: 60 }}>
      <h1>Privacy Policy</h1>
      <p>
        This Privacy Policy is prepared by <strong>Daju Vai</strong> and whose registered address is <strong>Kathmandu</strong> ("We") are committed to protecting and preserving the privacy of our visitors when visiting our site or communicating electronically with us.
      </p>
      <p>
        This policy sets out how we process any personal data we collect from you or that you provide to us through our website and social media sites, including when you use Facebook Login. We confirm that we will keep your information secure and comply fully with all applicable <strong>Nepal</strong> Data Protection legislation and regulations. Please read the following carefully to understand what happens to personal data that you choose to provide to us, or that we collect from you when you visit our sites. By submitting information you are accepting and consenting to the practices described in this policy.
      </p>
      <h2>Types of information we may collect from you</h2>
      <p>
        We may collect, store and use the following kinds of personal information about individuals who visit and use our website and social media sites:
      </p>
      <ul>
        <li>
          <strong>Information you supply to us.</strong> You may supply us with information about you by filling in forms on our website or social media, or by using Facebook Login. This includes information you provide when you submit a contact/inquiry form or log in with Facebook. The information you give us may include but is not limited to, your name, address, e-mail address, and phone number.
        </li>
      </ul>
      <h2>How we may use the information we collect</h2>
      <ul>
        <li>To provide you with information and/or services that you request from us;</li>
        <li>To contact you to provide the information requested;</li>
        <li>To facilitate and personalize your experience when logging in with Facebook or other social media platforms.</li>
      </ul>
      <h2>Disclosure of your information</h2>
      <p>
        Any information you provide to us will either be emailed directly to us or may be stored on a secure server.
        <br />
        We do not rent, sell or share personal information about you with other people or non-affiliated companies.
        <br />
        We will use all reasonable efforts to ensure that your personal data is not disclosed to regional/national institutions and authorities unless required by law or other regulations.
        <br />
        Unfortunately, the transmission of information via the internet is not completely secure. Although we will do our best to protect your personal data, we cannot guarantee the security of your data transmitted to our site; any transmission is at your own risk. Once we have received your information, we will use strict procedures and security features to try to prevent unauthorized access.
      </p>
      <h2>Your rights – access to your personal data</h2>
      <p>
        You have the right to ensure that your personal data is being processed lawfully (“Subject Access Right”). Your subject access right can be exercised in accordance with data protection laws and regulations. Any subject access request must be made in writing to <strong>Daju Vai</strong>. We will provide your personal data to you within the statutory time frames. To enable us to trace any of your personal data that we may be holding, we may need to request further information from you. If you complain about how we have used your information, you have the right to complain to the Information Commissioner’s Office (ICO).
      </p>
      <h2>Changes to our privacy policy</h2>
      <p>
        Any changes we may make to our privacy policy in the future will be posted on this page and, where appropriate, notified to you by e-mail. Please check back frequently to see any updates or changes to our privacy policy.
      </p>
      <h2>Contact</h2>
      <p>
        Questions, comments, and requests regarding this privacy policy are welcomed and should be addressed to <strong>Daju Vai, Kathmandu</strong>.
      </p>
    </div>
  </div>
);

export default PrivacyPolicy; 