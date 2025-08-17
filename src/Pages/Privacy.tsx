import React from 'react';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import '../Styles/Privacy.css';

const PrivacyPolicy = () => {
  return (
    <>
      <Navbar />
      <div className="privacy">
        <header className="privacy__header">
          <h1 className="privacy__title">Privacy</h1>
          <p className="privacy__subtitle">DajuVai - Your Trusted E-Commerce Platform in Nepal</p>
        </header>

        <div className="privacy__toc">
          <h2 className="privacy__toc-title">Table of Contents</h2>
          <ul className="privacy__toc-list">
            <li className="privacy__toc-item"><a href="#privacy-confidentiality">Privacy and Confidentiality</a></li>
            <li className="privacy__toc-item"><a href="#data-collected">Data that we collect</a></li>
            <li className="privacy__toc-item"><a href="#data-usage">How we use your data</a></li>
            <li className="privacy__toc-item"><a href="#data-disclosure">Disclosure of personal data</a></li>
            <li className="privacy__toc-item"><a href="#cookies">Cookies</a></li>
            <li className="privacy__toc-item"><a href="#security">Security</a></li>
            <li className="privacy__toc-item"><a href="#your-rights">Your rights</a></li>
            <li className="privacy__toc-item"><a href="#minors">Minors</a></li>
          </ul>
        </div>

        <section className="privacy__section" id="privacy-confidentiality">
          <h2 className="privacy__section-title">Privacy and Confidentiality</h2>
          <p className="privacy__text">
            Welcome to the dajuvai.com website (the "Site"), run by Daju Vai. We care about your privacy and work to protect your personal information. Read this Privacy Policy to learn more.
          </p>
          <ol className="privacy__list">
            <li className="privacy__list-item">
              This policy explains how we collect, use, and share your information, the steps we take to keep it safe, and your choices regarding its use. By using the Site, you agree to these practices.
            </li>
            <li className="privacy__list-item">
              Your privacy matters to us. We only use your name and related information as described here, and only when necessary.
            </li>
            <li className="privacy__list-item">
              We keep your data only as long as required by law or needed for our purposes.
            </li>
            <li className="privacy__list-item">
              We delete your data or remove links to it when it’s no longer needed, following legal and practical guidelines.
            </li>
            <li className="privacy__list-item">
              You can browse the Site anonymously without providing personal details, unless you log in with your account.
            </li>
          </ol>
        </section>

        <section className="privacy__section" id="data-collected">
          <h2 className="privacy__section-title">Data that we collect</h2>
          <ol className="privacy__list">
            <li className="privacy__list-item">
              We may collect information when you order a product on the Site.
            </li>
            <li className="privacy__list-item">
              We gather data to process your purchases and provide services, including your name, email, address, phone number, and payment details.
            </li>
            <li className="privacy__list-item">
              For buyers, we collect:
              <ol className="privacy__sublist">
                <li className="privacy__sublist-item">Identity data (name, gender, profile picture, birth date)</li>
                <li className="privacy__sublist-item">Contact data (address, email, phone)</li>
                <li className="privacy__sublist-item">Biometric data (voice, facial features from voice search or Site use)</li>
                <li className="privacy__sublist-item">Billing data (bank or card details)</li>
                <li className="privacy__sublist-item">Transaction data (order and payment details)</li>
                <li className="privacy__sublist-item">Technical data (IP address, device info)</li>
                <li className="privacy__sublist-item">Profile data (username, preferences)</li>
                <li className="privacy__sublist-item">Usage data (Site activity)</li>
                <li className="privacy__sublist-item">Location data (from shared photos/videos)</li>
                <li className="privacy__sublist-item">Marketing data (preferences, communication history)</li>
                <li className="privacy__sublist-item">Additional data for verification (e.g., ID copies)</li>
              </ol>
            </li>
            <li className="privacy__list-item">
              For sellers, we collect similar data, including business details and transaction records.
            </li>
          </ol>
        </section>

        <section className="privacy__section" id="data-usage">
          <h2 className="privacy__section-title">How we use your data</h2>
          <p className="privacy__text">
            We use your data to run the Site, show ads, and improve our services. Examples include:
          </p>
          <ol className="privacy__list">
            <li className="privacy__list-item">Delivering your requested products or services</li>
            <li className="privacy__list-item">Processing and updating your orders</li>
            <li className="privacy__list-item">Sending offers and updates</li>
            <li className="privacy__list-item">Validating your account and preventing fraud</li>
            <li className="privacy__list-item">Customizing your Site experience</li>
            <li className="privacy__list-item">Providing customer support</li>
            <li className="privacy__list-item">Improving the Site and services</li>
            <li className="privacy__list-item">Managing promotions or surveys</li>
            <li className="privacy__list-item">Conducting research and development</li>
            <li className="privacy__list-item">Storing data securely (within or outside Nepal)</li>
            <li className="privacy__list-item">Investigating fraud or misconduct</li>
            <li className="privacy__list-item">Sending marketing materials</li>
            <li className="privacy__list-item">Meeting legal requirements</li>
            <li className="privacy__list-item">Enhancing Site performance</li>
            <li className="privacy__list-item">Facilitating interactive features</li>
            <li className="privacy__list-item">Fixing Site issues</li>
          </ol>
        </section>

        <section className="privacy__section" id="data-disclosure">
          <h2 className="privacy__section-title">Disclosure of personal data</h2>
          <ol className="privacy__list">
            <li className="privacy__list-item">
              We keep your data confidential but may share it with service providers, agents, or affiliates (in Nepal or abroad) for the purposes above. This includes:
              <ol className="privacy__sublist">
                <li className="privacy__sublist-item">Service providers (e.g., payment, shipping, marketing)</li>
                <li className="privacy__sublist-item">Their related companies</li>
                <li className="privacy__sublist-item">Other Site users</li>
              </ol>
            </li>
            <li className="privacy__list-item">
              We may transfer data if we sell our business, following data protection laws. We won’t sell or share your data otherwise without your consent, unless required by law.
            </li>
            <li className="privacy__list-item">
              We ensure third parties protect your data and use it only as outlined here.
            </li>
            <li className="privacy__list-item">
              Data may be transferred outside Nepal if compliant with laws and this policy.
            </li>
            <li className="privacy__list-item">
              Third-party services (e.g., payment providers) may use your data under their own policies.
            </li>
          </ol>
        </section>

        <section className="privacy__section" id="cookies">
          <h2 className="privacy__section-title">Cookies</h2>
          <ol className="privacy__list">
            <li className="privacy__list-item">
              We or our providers use cookies and web beacons to track Site use.
            </li>
            <li className="privacy__list-item">
              Cookies are optional but needed for features like your shopping cart. They help us recognize your device but don’t store personal details or viruses. You can disable them, though some Site functions may not work.
            </li>
            <li className="privacy__list-item">
              We use Google Analytics, which uses cookies to analyze Site use. Data is stored by Google, and you can opt out via browser settings.
            </li>
          </ol>
        </section>

        <section className="privacy__section" id="security">
          <h2 className="privacy__section-title">Security</h2>
          <ol className="privacy__list">
            <li className="privacy__list-item">
              We use secure servers, firewalls, and encryption (e.g., SSL/TLS) to protect your data. We may verify your identity before sharing information.
            </li>
            <li className="privacy__list-item">
              No online storage is 100% secure, but we continually improve our measures. Report concerns to support@dajuvai.com.
            </li>
          </ol>
        </section>

        <section className="privacy__section" id="your-rights">
          <h2 className="privacy__section-title">Your rights</h2>
          <ol className="privacy__list">
            <li className="privacy__list-item">
              You can request access to or correction of your data, or ask us to stop marketing emails. We may charge a small fee for access requests. To withdraw consent or delete data, contact support@dajuvai.com or use the <a href="https://dajuvai.com/deletion-form" className="privacy__highlight">Account Deactivation/Deletion Request Form</a>. Deletion takes up to 15 working days after verification. Note that withdrawing consent may affect our services.
            </li>
          </ol>
          <button className="privacy__button" onClick={() => window.location.href = 'https://dajuvai.com/settings'}>
            Manage Marketing Preferences
          </button>
        </section>

        <section className="privacy__section" id="minors">
          <h2 className="privacy__section-title">Minors</h2>
          <ol className="privacy__list">
            <li className="privacy__list-item">
              We don’t sell to or collect data from those under 18. You confirm you’re over 18. If a minor uses your account, you’re responsible for their actions and agree to this policy.
            </li>
          </ol>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;