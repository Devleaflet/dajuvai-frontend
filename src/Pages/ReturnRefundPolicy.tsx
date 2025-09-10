import { useState, useEffect } from "react";
import { 
  ArrowRight, CheckCircle, XCircle, Clock, Shield, 
  AlertTriangle, FileText, Truck, CreditCard, Scale, Phone 
} from "lucide-react";
import "../Styles/ReturnRefundPolicy.css";

const ReturnRefundPolicy = () => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        const htmlSection = section as HTMLElement;
        const sectionTop = htmlSection.offsetTop;
        const sectionHeight = htmlSection.offsetHeight;
        const sectionId = htmlSection.getAttribute('data-section');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId || "");
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="rrp-container">
      {/* Hero Section */}
      <div className="rrp-hero">
        <div className="rrp-hero-content">
          <div className="rrp-hero-inner">
            <div className="rrp-hero-icon">
              <Shield className="rrp-shield-icon" />
            </div>
            <h1 className="rrp-hero-title">Return & Refund Policy</h1>
            <p className="rrp-hero-subtitle">
              Your satisfaction is our priority. Learn about our hassle-free return and refund process designed to protect both customers and vendors.
            </p>
          </div>
        </div>
      </div>

      <div className="rrp-main-content">
        <div className="rrp-layout">
          {/* Sidebar Navigation */}
          <div className="rrp-sidebar">
            <div className="rrp-sidebar-card">
              <h3 className="rrp-sidebar-title">Quick Navigation</h3>
              <nav className="rrp-sidebar-nav">
                {[
                  { id: 'eligibility', title: 'Return Eligibility', icon: CheckCircle },
                  { id: 'timeframe', title: 'Return Timeframe', icon: Clock },
                  { id: 'process', title: 'Return Process', icon: FileText },
                  { id: 'refunds', title: 'Refund Process', icon: CreditCard },
                  { id: 'shipping', title: 'Shipping Costs', icon: Truck },
                  { id: 'vendor-liability', title: 'Vendor Liabilities', icon: AlertTriangle },
                  { id: 'disputes', title: 'Dispute Resolution', icon: Scale }
                ].map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`rrp-nav-button ${activeSection === id ? 'rrp-nav-button-active' : ''}`}
                  >
                    <Icon className="rrp-nav-icon" />
                    <span className="rrp-nav-text">{title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="rrp-content">
            {/* Eligibility Section */}
            <section data-section="eligibility" className="rrp-section">
              <div className="rrp-section-header">
                <div className="rrp-section-icon">
                  <CheckCircle className="rrp-section-main-icon" />
                </div>
                <div>
                  <h2 className="rrp-section-title">Return Eligibility</h2>
                  <p className="rrp-section-description">Understand when returns and refunds are accepted</p>
                </div>
              </div>

              <div className="rrp-grid-2">
                <div className="rrp-card rrp-card-green">
                  <h3 className="rrp-card-title-green">
                    <CheckCircle className="rrp-card-icon" />
                    Valid Reasons for Returns
                  </h3>
                  <ul className="rrp-list">
                    {[
                      'Defective, Damaged and Rejected Product',
                      'Wrong Item Shipped',
                      'Quality Issues',
                      'Late Delivery'
                    ].map((reason, index) => (
                      <li key={index} className="rrp-list-item-green">
                        <CheckCircle className="rrp-list-icon" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rrp-card rrp-card-red">
                  <h3 className="rrp-card-title-red">
                    <XCircle className="rrp-card-icon" />
                    Non-Returnable Items
                  </h3>
                  <ul className="rrp-list">
                    {[
                      'Perishable goods',
                      'Custom-made/personalized products',
                      'Intimate/healthcare items (unless defective)'
                    ].map((item, index) => (
                      <li key={index} className="rrp-list-item-red">
                        <XCircle className="rrp-list-icon" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Timeframe Section */}
            <section data-section="timeframe" className="rrp-section">
              <div className="rrp-section-header">
                <div className="rrp-section-icon">
                  <Clock className="rrp-section-main-icon" />
                </div>
                <div>
                  <h2 className="rrp-section-title">Return Timeframe</h2>
                  <p className="rrp-section-description">Important deadlines to keep in mind</p>
                </div>
              </div>

              <div className="rrp-grid-2">
                <div className="rrp-card rrp-card-blue">
                  <h3 className="rrp-card-title-blue">Customer Request</h3>
                  <p className="rrp-timeframe-number">3 Days</p>
                  <p className="rrp-timeframe-text">From delivery date to request return</p>
                </div>
                <div className="rrp-card rrp-card-orange">
                  <h3 className="rrp-card-title-orange">Vendor Processing</h3>
                  <p className="rrp-timeframe-number">1 Business Day</p>
                  <p className="rrp-timeframe-text">To process refund after receiving item</p>
                </div>
              </div>
            </section>

            {/* Process Section */}
            <section data-section="process" className="rrp-section">
              <div className="rrp-section-header">
                <div className="rrp-section-icon">
                  <FileText className="rrp-section-main-icon" />
                </div>
                <div>
                  <h2 className="rrp-section-title">Return Process</h2>
                  <p className="rrp-section-description">Step-by-step guide to returns</p>
                </div>
              </div>

              <div className="rrp-steps">
                <div className="rrp-step">
                  <div className="rrp-step-number">1</div>
                  <div className="rrp-step-content">
                    <h3 className="rrp-step-title">Customer Initiation</h3>
                    <ul className="rrp-step-list">
                      <li>Submit return request via dajuvai.com platform</li>
                      <li>Company reviews and approves/denies based on policy compliance</li>
                      <li>If approved, return shipping label provided (if applicable)</li>
                    </ul>
                  </div>
                </div>

                <div className="rrp-step">
                  <div className="rrp-step-number">2</div>
                  <div className="rrp-step-content">
                    <h3 className="rrp-step-title">Vendor Responsibilities</h3>
                    <ul className="rrp-step-list">
                      <li>Inspect returned items within 48 hours of receipt</li>
                      <li><span className="rrp-text-green">Refund Approved</span> if product is unused, in original packaging</li>
                      <li><span className="rrp-text-red">Refund Rejected</span> if item shows misuse, damage, or missing parts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Section */}
            <section data-section="shipping" className="rrp-section">
              <div className="rrp-section-header">
                <div className="rrp-section-icon">
                  <Truck className="rrp-section-main-icon" />
                </div>
                <div>
                  <h2 className="rrp-section-title">Return Shipping Costs</h2>
                  <p className="rrp-section-description">Who pays for return shipping</p>
                </div>
              </div>

              <div className="rrp-grid-2">
                <div className="rrp-card rrp-card-green">
                  <h3 className="rrp-card-title-green">🆓 Free Return Shipping</h3>
                  <p className="rrp-card-subtitle-green">Company/Vendor covers costs when:</p>
                  <ul className="rrp-shipping-list">
                    <li>Wrong item shipped</li>
                    <li>Defective/damaged product received</li>
                  </ul>
                </div>

                <div className="rrp-card rrp-card-orange">
                  <h3 className="rrp-card-title-orange">💳 Customer Pays Shipping</h3>
                  <p className="rrp-card-subtitle-orange">Customer covers costs when:</p>
                  <ul className="rrp-shipping-list">
                    <li>Changed their mind about purchase</li>
                    <li>Unless free returns are offered by vendor</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Refund Process */}
            <section data-section="refunds" className="rrp-section">
              <div className="rrp-section-header">
                <div className="rrp-section-icon">
                  <CreditCard className="rrp-section-main-icon" />
                </div>
                <div>
                  <h2 className="rrp-section-title">Refund Process</h2>
                  <p className="rrp-section-description">How and when you'll receive your refund</p>
                </div>
              </div>

              <div className="rrp-refund-content">
                <div className="rrp-grid-2">
                  <div className="rrp-card rrp-card-blue">
                    <h3 className="rrp-card-title-blue">Refund Methods</h3>
                    <ul className="rrp-refund-list">
                      <li className="rrp-refund-list-item">
                        <CheckCircle className="rrp-check-icon" />
                        <span>Original Payment Method (Preferred)</span>
                      </li>
                      <li className="rrp-refund-list-item">
                        <CheckCircle className="rrp-check-icon" />
                        <span>Store Credit (If customer agrees)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rrp-card rrp-card-purple">
                    <h3 className="rrp-card-title-purple">Timeline</h3>
                    <ul className="rrp-timeline-list">
                      <li>Processing: 3-5 business days</li>
                      <li>Bank processing: 3-10 business days</li>
                      <li>Total: Up to 15 business days</li>
                    </ul>
                  </div>
                </div>

                <div className="rrp-card rrp-card-yellow">
                  <h3 className="rrp-card-title-yellow">
                    <AlertTriangle className="rrp-alert-icon" />
                    Partial Refunds
                  </h3>
                  <p className="rrp-card-subtitle-yellow">May be issued when:</p>
                  <ul className="rrp-partial-list">
                    <li>Only part of the order is returned</li>
                    <li>Product is used/damaged but acceptable for partial credit</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Vendor Liabilities */}
            <section data-section="vendor-liability" className="rrp-section">
              <div className="rrp-section-header">
                <div className="rrp-section-icon">
                  <AlertTriangle className="rrp-section-main-icon" />
                </div>
                <div>
                  <h2 className="rrp-section-title">Vendor Liabilities & Penalties</h2>
                  <p className="rrp-section-description">Accountability measures for vendors</p>
                </div>
              </div>

              <div className="rrp-liability-content">
                <div className="rrp-card rrp-card-blue">
                  <h3 className="rrp-card-title-blue">Vendor Responsibilities</h3>
                  <ul className="rrp-liability-list">
                    <li>Selling authentic, undamaged products</li>
                    <li>Accurate product descriptions & images</li>
                    <li>Timely shipment to avoid late deliveries</li>
                  </ul>
                </div>

                <div className="rrp-card rrp-card-red">
                  <h3 className="rrp-card-title-red">Penalties for Non-Compliance</h3>
                  <div className="rrp-penalty-content">
                    <div>
                      <p className="rrp-penalty-title">Excessive Returns Due to Vendor Fault:</p>
                      <p className="rrp-penalty-text">First Offense: Warning + refund cost deduction</p>
                      <p className="rrp-penalty-text">Repeat Offenses: Higher commission fees or suspension</p>
                    </div>
                    <div>
                      <p className="rrp-penalty-title">Fraudulent Listings:</p>
                      <p className="rrp-penalty-text">Immediate delisting + legal action</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dispute Resolution */}
            <section data-section="disputes" className="rrp-section">
              <div className="rrp-section-header">
                <div className="rrp-section-icon">
                  <Scale className="rrp-section-main-icon" />
                </div>
                <div>
                  <h2 className="rrp-section-title">Dispute Resolution</h2>
                  <p className="rrp-section-description">Fair mediation process for all parties</p>
                </div>
              </div>

              <div className="rrp-dispute-card">
                <ul className="rrp-dispute-list">
                  <li>Company mediates all return disputes and makes final decisions</li>
                  <li>Vendors must provide evidence (photos, tracking details) to support their case</li>
                  <li>All decisions are based on policy compliance and evidence provided</li>
                </ul>
              </div>
            </section>

            {/* Contact Section */}
            <section className="rrp-contact-section">
              <div className="rrp-contact-content">
                <Phone className="rrp-phone-icon" />
                <h2 className="rrp-contact-title">Need Help?</h2>
                <p className="rrp-contact-text">
                  Our customer support team is here to help you with any questions about returns and refunds.
                </p>
                <button className="rrp-contact-button">
                  Contact Support
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Policy Updates Notice */}
      {/* <div className="rrp-policy-update">
        <div className="rrp-policy-content">
          <AlertTriangle className="rrp-policy-icon" />
          <div>
            <h3 className="rrp-policy-title">Policy Updates</h3>
            <p className="rrp-policy-text">
              The Company may modify this Policy with 30 days' notice. Vendors will be notified via email/dashboard alerts.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default ReturnRefundPolicy;