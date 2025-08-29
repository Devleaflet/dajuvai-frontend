import React from 'react';
import "../Styles/VendorTerms.css"
const VendorTerms = () => {
    const handleGoBack = () => {
        window.close()
    };
    return (
        <div className="agreement">
            <div className="agreement__header">
                <h1 className="agreement__title">Vendor Registration Agreement</h1>
                <h2 className="agreement__subtitle">(Terms and Conditions)</h2>
            </div>

            <div className="agreement__section">
                <p className="agreement__text"><strong>Effective Date:</strong> This Vendor Terms and Conditions Agreement is entered into between:</p>
                <p className="agreement__text"><strong>Online Business Company:</strong> Online Platform Provider</p>
                <p className="agreement__text"><strong>Business Name:</strong> DAJUVAI.COM, a company registered under Nepal Government.</p>
                <p className="agreement__text"><strong>Registration No:</strong> 5389</p>
                <p className="agreement__text"><strong>PAN No:</strong> 622692609</p>
                <p className="agreement__text"><strong>Address:</strong> Maharajgunj, Kathmandu, Nepal</p>
                <p className="agreement__text"><strong>Contact Details:</strong></p>
                <ul className="agreement__list">
                    <li className="agreement__list-item">Phone No: 01-4720234</li>
                    <li className="agreement__list-item">Email: info@dajuvai.com</li>
                    <li className="agreement__list-item">Website: www.dajuvai.com</li>
                    <li className="agreement__list-item">Contact Person: Jones Shrestha, Phone No: 9708555024</li>
                </ul>
                <p className="agreement__text"><strong>And</strong></p>
                <p className="agreement__text"><strong>Vendor – Online goods seller by using this platform</strong></p>
                <p className="agreement__text"><strong>Business Name:</strong> ___________________________</p>
                <p className="agreement__text"><strong>Registration No:</strong> ___________________________</p>
                <p className="agreement__text"><strong>PAN No:</strong> ___________________________</p>
                <p className="agreement__text"><strong>Address:</strong> ___________________________</p>
                <p className="agreement__text"><strong>Contact Details:</strong></p>
                <ul className="agreement__list">
                    <li className="agreement__list-item">Phone No: ___________________________</li>
                    <li className="agreement__list-item">Email: ___________________________</li>
                    <li className="agreement__list-item">Address: ___________________________</li>
                    <li className="agreement__list-item">Contact Person: ___________________________, Phone No: ___________________________</li>
                </ul>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">Registration Procedure</h3>
                <ul className="agreement__list">
                    <li className="agreement__list-item">Agreement Discussion and Signature</li>
                    <li className="agreement__list-item">Company Documents and ownership details with citizenship</li>
                </ul>
                <p className="agreement__text">By registering as a Vendor on the Company’s online platform ("Platform"), that the company provides them username and password in their online dashboard to list out the goods they want to sell, the Vendor agrees to comply with the following terms and conditions:</p>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">1. Vendor Obligations</h3>
                <h4 className="agreement__section-subtitle">1.1 Product Listing & Accuracy</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor shall upload their goods in its dashboard for proper business activities.</li>
                    <li className="agreement__list-item">The Vendor shall provide accurate product descriptions, images, pricing, and inventory details.</li>
                    <li className="agreement__list-item">The Company reserves the right to reject or remove any product listings that violate policies or applicable laws.</li>
                    <li className="agreement__list-item">Photo and Video Criteria: High quality, plain background, size/color if applicable, minimum 4 to 6 photos for each product.</li>
                </ul>

                <h4 className="agreement__section-subtitle">1.2 Product Ownership & Authenticity</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor guarantees that all listed products are legally owned, authentic, and comply with safety and regulatory standards.</li>
                    <li className="agreement__list-item">Counterfeit, illegal, or prohibited items are strictly forbidden.</li>
                </ul>

                <h4 className="agreement__section-subtitle">1.3 Inventory & Fulfillment</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor must maintain sufficient stock and promptly update inventory levels.</li>
                    <li className="agreement__list-item">If a product is out of stock, the Vendor must immediately deactivate or notify out of stock of the listing.</li>
                </ul>

                <h4 className="agreement__section-subtitle">1.4 Shipping to Company Warehouse</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor agrees to prepare the order so that sold products can reach the Company’s designated warehouse within one business day upon order confirmation by vendor or the company’s shipment effort.</li>
                    <li className="agreement__list-item">Shipping costs to the Company's warehouse shall be borne by the Vendor unless otherwise agreed.</li>
                </ul>

                <h4 className="agreement__section-subtitle">1.5 Prohibited Actions</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor shall not interact with customers directly except for product enquiry. All communication (queries, complaints, returns) shall be handled by the Company.</li>
                    <li className="agreement__list-item">The Vendor shall not promote external links, contact details, or alternative sales channels on the Platform.</li>
                </ul>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">2. Company’s Responsibilities</h3>
                <h4 className="agreement__section-subtitle">2.1 Order Processing & Delivery</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Company will manage customer orders, payments, and last-mile delivery.</li>
                    <li className="agreement__list-item">The Company reserves the right to cancel orders in case of Vendor non-compliance.</li>
                </ul>

                <h4 className="agreement__section-subtitle">2.2 Customer Service</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Company will handle all customer inquiries, refunds, and disputes.</li>
                </ul>

                <h4 className="agreement__section-subtitle">2.3 Dashboard Access</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor will have access to a dashboard displaying order details, delivery status, and earnings.</li>
                    <li className="agreement__list-item">The Vendor will not have access to customer personal data beyond order-related information.</li>
                </ul>

                <h4 className="agreement__section-subtitle">2.4 Marketing and Promotional Service</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The company will make regular efforts to plan and discuss with vendors to support business promotion and make different promotional advertisements for offers and policies to attract the customers.</li>
                </ul>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">3. Pricing, Payments & Commission</h3>
                <h4 className="agreement__section-subtitle">3.1 Product Pricing</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor sets the product price which should include: Cost of goods, any applicable taxes, and reasonable profit margin, but the Company may request for adjustment for promotions or compliance.</li>
                    <li className="agreement__list-item">Vendors must ensure their prices are competitive with market rates and e-commerce platforms.</li>
                    <li className="agreement__list-item">The Company may adjust prices without notice for: Pricing errors, suspected fraud, legal/regulatory compliance.</li>
                    <li className="agreement__list-item">Delivery charges (if applicable) will be determined by the Company.</li>
                    <li className="agreement__list-item">The Company reserves the right to adjust prices after discussion with vendor for: Promotional campaigns, price matching with competitors, compliance with platform policies.</li>
                </ul>

                <h4 className="agreement__section-subtitle">3.2 Vendor-Initiated Discounts</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">Vendors may request discounts/sales, subject to Company approval.</li>
                    <li className="agreement__list-item">Discounted prices must still cover costs after commission.</li>
                </ul>

                <h4 className="agreement__section-subtitle">3.3 Platform-Initiated Promotions</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Company may run site-wide promotions (e.g., seasonal sales).</li>
                    <li className="agreement__list-item">Vendors must participate unless opted out in advance (if allowed).</li>
                </ul>

                <h4 className="agreement__section-subtitle">3.4 Revenue Collection, Commission & Payment Settlement</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Company collects the full payment (product price + delivery fee) from the customer.</li>
                    <li className="agreement__list-item">The Company deducts a pre-discussed Listing Charges with reference to the Listing Charge list on per sale.</li>
                    <li className="agreement__list-item">Payouts to the Vendor will be processed every 15 days via Bank/Payment Gateway.</li>
                </ul>

                <h4 className="agreement__section-subtitle">3.5 Refunds & Chargebacks</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">If a customer requests a refund, the Company will deduct the amount from the Vendor’s next settlement.</li>
                    <li className="agreement__list-item">Chargebacks due to Vendor misconduct (e.g., wrong product, bad packaging, and defective pieces) will be the Vendor’s liability.</li>
                </ul>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">4. Intellectual Property & Branding</h3>
                <h4 className="agreement__section-subtitle">4.1 Company’s Platform Ownership</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor acknowledges that the Company owns all rights to the Platform, branding, and customer data.</li>
                </ul>

                <h4 className="agreement__section-subtitle">4.2 Vendor’s Product Rights</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor retains ownership of product trademarks but grants the Company a license to display and sell them on the Platform.</li>
                </ul>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">5. Termination & Suspension</h3>
                <h4 className="agreement__section-subtitle">5.1 Penalties for Non-Compliance</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">First offense: Warning & mandatory price correction.</li>
                    <li className="agreement__list-item">Repeat offenses: Temporary suspension or permanent delisting.</li>
                </ul>

                <h4 className="agreement__section-subtitle">5.2 Termination by Company</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Company may suspend or terminate Vendor access for: Violation of this Agreement, fraudulent activities, consistently poor performance (late shipments, high return rates), price gouging, misleading discounts.</li>
                </ul>

                <h4 className="agreement__section-subtitle">5.3 Termination by Vendor</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Vendor may terminate this Agreement with 30 days’ written notice.</li>
                    <li className="agreement__list-item">Undercutting platform policies.</li>
                </ul>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">6. Liability & Dispute Resolution</h3>
                <h4 className="agreement__section-subtitle">6.1 Limitation of Liability</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">The Company is not liable for Vendor losses due to system errors, delivery delays, or market fluctuations.</li>
                </ul>

                <h4 className="agreement__section-subtitle">6.2 Dispute Resolution</h4>
                <ul className="agreement__list">
                    <li className="agreement__list-item">Disputes shall first be resolved via negotiation. If unresolved, they shall be settled under Nepal Government laws.</li>
                </ul>
            </div>

            <div className="agreement__section">
                <h3 className="agreement__section-title">7. General Terms</h3>
                <ul className="agreement__list">
                    <li className="agreement__list-item">Amendments: The Company may modify these terms with prior notice. Continued use constitutes acceptance.</li>
                    <li className="agreement__list-item">Governing Law: This Agreement shall be governed by the laws of Nepal.</li>
                    <li className="agreement__list-item">Entire Agreement: This Agreement supersedes all prior agreements between the parties.</li>
                </ul>
            </div>

            <div className="agreement__section">
                <p className="agreement__text">By signing below the Vendor confirms acceptance of these terms.</p>
                <div className="agreement__signature">
                    <div className="agreement__signature-block">
                        <p className="agreement__signature-text"><strong>DAJUVAI.COM</strong></p>
                        <div className="agreement__signature-line"></div>
                        <p className="agreement__signature-text">JONES SHRESTHA</p>
                        <p className="agreement__signature-text">DAJUVAI DOT COM</p>
                        <p className="agreement__signature-text">Maharajgunj, Kathmandu, Nepal</p>
                    </div>
                    <div className="agreement__signature-block">
                        <p className="agreement__signature-text"><strong>VENDOR</strong></p>
                        <div className="agreement__signature-line"></div>
                        <p className="agreement__signature-text">___________________________</p>
                        <p className="agreement__signature-text">___________________________, Nepal</p>
                    </div>
                </div>
                <p className="agreement__text"><strong>Witness:</strong> ___________________________</p>
                <p className="agreement__text"><strong>Date:</strong> ___________________________</p>
            </div>

            <div className="agreement__footer">
                <p className="agreement__text">DAJUVAI.COM - All Rights Reserved</p>
            </div>

            <div className="agreement__button-container">
                <button className="agreement__button" onClick={handleGoBack}>
                    Go Back
                </button>
            </div>
        </div>
    );
}

export default VendorTerms;