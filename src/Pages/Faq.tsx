import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HelpCircle,
    ChevronDown,
    Copy,
    Check,
    Store,
    ShoppingCart,
    Truck,
    CreditCard,
    RefreshCw,
    Globe,
    Package,
    Wallet,
    AlertCircle,
} from "lucide-react";

import "../Styles/Faq.css"
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";

// Types
interface FAQItem {
    id: string;
    q: string;
    a: string;
    tags: string[];
    icon?: React.ReactNode;
}

function slugify(input: string) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

const RAW_FAQS: Omit<FAQItem, "id">[] = [
    {
        q: "How do I place an order?",
        a: "Browse products, add them to your cart, and proceed to checkout. You can pay using Cash on Delivery, eSewa, Khalti, or NPX.",
        tags: ["buyers", "orders", "payments"],
        icon: <ShoppingCart className="faq__icon" />,
    },
    {
        q: "How long does delivery take?",
        a: "Delivery within Kathmandu Valley usually takes 1 business day, while outside the valley may take 2–3 business days depending on location.",
        tags: ["buyers", "delivery"],
        icon: <Truck className="faq__icon" />,
    },
    {
        q: "What payment methods do you accept?",
        a: "We currently accept Cash on Delivery (COD), eSewa, Khalti, and NPX.",
        tags: ["buyers", "payments"],
        icon: <CreditCard className="faq__icon" />,
    },
    {
        q: "Can I return or exchange a product?",
        a: "Yes. Returns or exchanges are possible within 3–7 days of delivery (depending on vendor policy). Products must be unused and in original packaging.",
        tags: ["buyers", "returns"],
        icon: <RefreshCw className="faq__icon" />,
    },
    {
        q: "How do I track my order?",
        a: "After your order is confirmed, you’ll receive a tracking code and updates via email. You can also track your order using the order ID and billing email.",
        tags: ["buyers", "orders", "tracking"],
        icon: <Package className="faq__icon" />,
    },
    {
        q: "How can I register as a seller?",
        a: "Click “Become a Seller”, fill out the registration form, and submit your business details. Our team will verify your documents before approval.",
        tags: ["sellers", "onboarding"],
        icon: <Store className="faq__icon" />,
    },
    {
        q: "How do I get paid for my sales?",
        a: "Payouts are transferred to your bank or digital wallet (eSewa/Khalti) on a weekly or monthly cycle based on your preference.",
        tags: ["sellers", "payments"],
        icon: <Wallet className="faq__icon" />,
    },
    {
        q: "Can I manage my own delivery?",
        a: "No. Currently, all deliveries are handled by DajuVai logistics to ensure reliability and tracking.",
        tags: ["sellers", "delivery"],
        icon: <Truck className="faq__icon" />,
    },
    {
        q: "What kind of products can I sell?",
        a: "Most legal products are allowed. Prohibited items—such as weapons, illegal goods, and counterfeit products—are strictly not permitted.",
        tags: ["sellers", "policy"],
        icon: <AlertCircle className="faq__icon" />,
    },
    {
        q: "Do you deliver outside Kathmandu Valley?",
        a: "Yes, we deliver all over Nepal through our courier partners.",
        tags: ["buyers", "delivery"],
        icon: <Globe className="faq__icon" />,
    },
    {
        q: "What happens if a product is out of stock?",
        a: "If an item becomes unavailable after your order, we’ll notify you and offer alternatives or a full refund.",
        tags: ["buyers", "orders"],
        icon: <HelpCircle className="faq__icon" />,
    },
];

const allFaqs: FAQItem[] = RAW_FAQS.map((f) => ({
    ...f,
    id: slugify(f.q),
}));

function CopyAnchor({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);
    const url =
        typeof window !== "undefined"
            ? `${window.location.origin}${window.location.pathname}#${id}`
            : `#${id}`;
    return (
        <button
            onClick={() =>
                navigator.clipboard.writeText(url).then(() => setCopied(true))
            }
            className="faq__copy-btn"
        >
            {copied ? <Check className="faq__copy-icon" /> : <Copy className="faq__copy-icon" />}
        </button>
    );
}

function FAQAccordionItem({
    item,
    isOpen,
    onToggle,
}: {
    item: FAQItem;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div id={item.id} className="faq__item">
            <button
                onClick={onToggle}
                className="faq__item-header"
                aria-expanded={isOpen}
            >
                <div className="faq__item-icon">{item.icon}</div>
                <h3 className="faq__item-question">{item.q}</h3>
                <div className="faq__item-actions">
                    <CopyAnchor id={item.id} />
                    <ChevronDown
                        className={`faq__chevron ${isOpen ? "faq__chevron--open" : ""}`}
                    />
                </div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="faq__item-answer">{item.a}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function EcommerceFAQ() {
    const [openId, setOpenId] = useState<string | null>(null);

    useEffect(() => {
        const hash = window.location.hash.replace("#", "");
        if (hash) setOpenId(hash);
    }, []);

    return (<>
        <Navbar />
        <div className="faq">
            <section className="faq__container">
                {/* Header */}
                <div className="faq__header">
                    <div className="faq__badge">
                        <HelpCircle className="faq__badge-icon" />
                        <span className="faq__badge-text">Help Center</span>
                    </div>
                    <h1 className="faq__title">Frequently Asked Questions</h1>
                    <p className="faq__subtitle">
                        Quick answers about orders, delivery, payments, returns, and selling
                        on our marketplace.
                    </p>
                </div>

                {/* FAQ List */}
                <div className="faq__list">
                    {allFaqs.map((item) => (
                        <FAQAccordionItem
                            key={item.id}
                            item={item}
                            isOpen={openId === item.id}
                            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                        />
                    ))}
                </div>

                {/* CTA */}
                <div className="faq__cta">
                    <div className="faq__cta-text">
                        <p className="faq__cta-sub">Can’t find what you’re looking for?</p>
                        <h3 className="faq__cta-title">We’re here to help—contact support.</h3>
                    </div>
                    <div className="faq__cta-actions  faq_chat_support_btn">
                        <a
                            href="https://wa.me/9779700620004"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="faq__cta-btn faq__cta-btn--primary"
                        >
                            Chat with Support
                        </a>
                        <a
                            href="mailto:Dajuvai106@gmail.com"
                            className="faq__cta-btn faq__cta-btn--secondary"
                        >
                            Email Us
                        </a>
                    </div>
                </div>
            </section>
        </div>
        <Footer />
    </>
    );
}
