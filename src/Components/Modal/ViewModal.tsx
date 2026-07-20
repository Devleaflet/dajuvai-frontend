import "./ViewModal.css";
import React from "react";
import { Order } from "../Types/Order";

interface OrderDetail {
    id: number;
    orderedBy: {
        id: number;
        username: string;
        email: string;
        phoneNumber: string;
    };
    shippingAddress: {
        province: string;
        district: string;
        city: string;
        localAddress?: string;
    };
    orderItems: Array<{
        id: number;
        productId: number;
        quantity: number;
        price: string;
        product: { name: string; productImages: string[] };
        variant: {
            attributes: Array<{
                name: string;
                value: string;
            }>;
            basePrice: string;
            finalPrice: string;
            id: number;
            productId: number;
            sku: string;
            variantImages: string[];
        };
        variantId: number;
        vendor: { id: number; businessName: string };
    }>;
    totalPrice: string;
    shippingFee: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
}

interface ViewModalProps {
    show: boolean;
    onClose: () => void;
    order: Order | null;
    orderDetail: OrderDetail | null;
}

const ViewModal: React.FC<ViewModalProps> = ({
    show,
    onClose,
    order,
    orderDetail,
}) => {
    if (!show || !order || !orderDetail) return null;

    const subtotal = orderDetail.orderItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
    );

    const formatAttributes = (attributes: unknown) => {
        if (Array.isArray(attributes)) {
            return attributes.map((attr, index) => {
                if (
                    typeof attr === "object" &&
                    attr !== null &&
                    "name" in attr &&
                    "value" in attr
                ) {
                    const typedAttr = attr as {
                        name?: unknown;
                        value?: unknown;
                    };
                    return (
                        <span
                            key={`${typedAttr.name ?? "attr"}-${index}`}
                            style={{ display: "inline-block", marginRight: 8 }}
                        >
                            {String(typedAttr.name)}: {String(typedAttr.value)}
                        </span>
                    );
                }

                return null;
            });
        }

        if (attributes && typeof attributes === "object") {
            return Object.entries(attributes as Record<string, unknown>).map(
                ([name, value]) => (
                    <span
                        key={name}
                        style={{ display: "inline-block", marginRight: 8 }}
                    >
                        {name}: {String(value)}
                    </span>
                ),
            );
        }

        return null;
    };

    const orderDate = new Date(orderDetail.createdAt);

    console.log("Order:");
    console.log(order);
    console.log("Order Detail:");
    console.log(orderDetail);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.55)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "40px 16px",
                overflowY: "auto",
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 680,
                    maxHeight: "90vh",
                    overflowY: "auto",
                    background: "#fdfdf8",
                    color: "#1a1a1a",
                    fontFamily: '"Courier New", Courier, monospace',
                    border: "1px solid #ccc",
                    borderRadius: 12,
                    padding: "32px 32px 28px",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: "0 0 6px",
                                fontSize: 25,
                                letterSpacing: 2,
                                fontWeight: 700,
                            }}
                        >
                            ORDER DETAILS
                        </h2>
                        <p
                            style={{
                                margin: "2px 0",
                                fontSize: 16,
                                color: "#444",
                            }}
                        >
                            Order #{order.orderId}
                        </p>
                        <p
                            style={{
                                margin: "2px 0",
                                fontSize: 16,
                                color: "#444",
                            }}
                        >
                            {orderDate.toLocaleDateString()}{" "}
                            {orderDate.toLocaleTimeString()}
                        </p>
                    </div>
                    <button
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            background: "#fff",
                            color: "#1a1a1a",
                            padding: "6px 14px",
                            fontSize: 16,
                            cursor: "pointer",
                        }}
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <div
                    style={{ borderTop: "1px solid #ddd", margin: "12px 0" }}
                />

                {/* Customer info */}
                <div
                    style={{
                        fontSize: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    <div style={{ display: "flex" }}>
                        <span style={{ width: 100, fontWeight: 600 }}>
                            Customer:
                        </span>
                        <span>{orderDetail.orderedBy.username}</span>
                    </div>

                    <div style={{ display: "flex" }}>
                        <span style={{ width: 100, fontWeight: 600 }}>
                            Phone:
                        </span>
                        <span>{orderDetail.orderedBy.phoneNumber}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                        <span style={{ width: 100, fontWeight: 600 }}>
                            Email:
                        </span>
                        <span
                            style={{
                                flex: 1,
                                wordBreak: "break-word",
                            }}
                        >
                            {orderDetail.orderedBy.email}
                        </span>
                    </div>
                </div>

                <div
                    style={{ borderTop: "1px solid #ddd", margin: "12px 0" }}
                />

                {/* Items */}
                <div style={{ fontSize: 16 }}>
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 8,
                            padding: "2px 0",
                            fontWeight: 700,
                            fontSize: 14,
                            letterSpacing: 1,
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                            marginBottom: 4,
                        }}
                    >
                        <span style={{ flex: 1, textAlign: "left" }}>ITEM</span>
                        <span style={{ flex: "0 0 50px", textAlign: "right" }}>
                            QTY
                        </span>
                        <span style={{ flex: "0 0 80px", textAlign: "right" }}>
                            RATE
                        </span>
                        <span style={{ flex: "0 0 90px", textAlign: "right" }}>
                            AMOUNT
                        </span>
                    </div>

                    {/* Items */}
                    {orderDetail.orderItems.map((item) => (
                        <div key={item.id} style={{ padding: "6px 0" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                {/* Product Image */}
                                <img
                                    src={
                                        item.variant
                                            ? item.variant.variantImages[0]
                                            : item.product.productImages[0]
                                    }
                                    alt={item.product.name}
                                    style={{
                                        width: 64,
                                        height: 64,
                                        objectFit: "cover",
                                        borderRadius: 6,
                                        border: "1px solid #ddd",
                                        flex: "0 0 64px",
                                    }}
                                />

                                {/* Product Info */}
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 500,
                                            lineHeight: 1.3,
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {item.product.name}
                                    </div>
                                    {item.variant && (
                                        <div
                                            style={{
                                                fontSize: 13,
                                                lineHeight: 1.3,
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {formatAttributes(
                                                item.variant.attributes,
                                            )}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: "#777",
                                            marginTop: 2,
                                        }}
                                    >
                                        Seller : {item.vendor.businessName}
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div
                                    style={{
                                        flex: "0 0 50px",
                                        textAlign: "right",
                                        color: "#444",
                                    }}
                                >
                                    x{item.quantity}
                                </div>

                                {/* Rate */}
                                <div
                                    style={{
                                        flex: "0 0 80px",
                                        textAlign: "right",
                                    }}
                                >
                                    Rs. {parseFloat(item.price).toFixed(2)}
                                </div>

                                {/* Amount */}
                                <div
                                    style={{
                                        flex: "0 0 90px",
                                        textAlign: "right",
                                        fontWeight: 600,
                                    }}
                                >
                                    Rs.{" "}
                                    {(
                                        parseFloat(item.price) * item.quantity
                                    ).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{ borderTop: "1px solid #ddd", margin: "12px 0" }}
                />

                {/* Total */}
                <div style={{ fontSize: 16 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 8,
                            padding: "2px 0",
                            fontSize: 21,
                            fontWeight: 700,
                        }}
                    >
                        <span>TOTAL</span>
                        <span>Rs. {subtotal.toFixed(2)}</span>
                    </div>
                </div>

                <div
                    style={{ borderTop: "1px solid #ddd", margin: "12px 0" }}
                />

                {/* Payment / status */}
                <div style={{ fontSize: 16 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 8,
                            padding: "2px 0",
                        }}
                    >
                        <span>Payment Method</span>
                        <span>{orderDetail.paymentMethod}</span>
                    </div>
                    {/* <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 8,
                            padding: "2px 0",
                        }}
                    >
                        <span>Status</span>
                        <span
                            style={{
                                textTransform: "uppercase",
                                fontWeight: 700,
                                fontSize: 14,
                                letterSpacing: 1,
                            }}
                        >
                            {orderDetail.status}
                        </span>
                    </div> */}
                </div>

                <div
                    style={{ borderTop: "1px solid #ddd", margin: "12px 0" }}
                />

                {/* Shipping address */}
                <div style={{ fontSize: 16 }}>
                    <p
                        style={{
                            fontWeight: 700,
                            fontSize: 14,
                            letterSpacing: 1,
                            margin: "0 0 4px",
                        }}
                    >
                        SHIP TO
                    </p>
                    <p style={{ fontSize: 15, margin: 0, lineHeight: 1.4 }}>
                        {orderDetail.shippingAddress.localAddress
                            ? `${orderDetail.shippingAddress.localAddress}, `
                            : ""}
                        {orderDetail.shippingAddress.city},{" "}
                        {orderDetail.shippingAddress.district},{" "}
                        {orderDetail.shippingAddress.province}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ViewModal;

// return (
//         <div className="modal-overlay" onClick={onClose}>
//             <div
//                 className="modal-container"
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 <div className="modal-header">
//                     <h2>Order #{order.orderId}</h2>
//                     <button className="close-button" onClick={onClose}>
//                         ×
//                     </button>
//                 </div>

//                 <div className="modal-body">
//                     <div className="modal-section">
//                         <h3>Order Items</h3>
//                         <div className="order-items">
//                             {orderDetail.orderItems.map((item) => (
//                                 <div key={item.id} className="order-item">
//                                     <div className="item-details">
//                                         <h4>{item.product.name}</h4>
//                                         <p className="vendor">
//                                             Vendor: {item.vendor.businessName}
//                                         </p>
//                                     </div>
//                                     <div className="item-price">
//                                         <span className="quantity">
//                                             Qty: {item.quantity}
//                                         </span>
//                                         <span className="price">
//                                             Rs.{" "}
//                                             {(
//                                                 parseFloat(item.price) *
//                                                 item.quantity
//                                             ).toFixed(2)}
//                                         </span>
//                                     </div>

//                                     <div className="item-image">
//                                         <img
//                                             src={item.product.productImages[0]}
//                                             alt={item.product.name}
//                                             className="product-image"
//                                         />
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="modal-section">
//                         <h3>Order Summary</h3>
//                         <div className="order-summary">
//                             {/* <div className="summary-row">
//                 <span>Subtotal</span>
//                 <span>Rs. {subtotal.toFixed(2)}</span>
//               </div>
//               <div className="summary-row">
//                 <span>Shipping Fee</span>
//                 <span>Rs. {parseFloat(orderDetail.shippingFee).toFixed(2)}</span>
//               </div> */}
//                             <div className=" total">
//                                 <span>Total</span>
//                                 <span>Rs. {subtotal.toFixed(2)}</span>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="modal-section">
//                         <h3>Order Details</h3>
//                         <div className="details-grid">
//                             <div className="detail-item">
//                                 <span className="label">Order Date</span>
//                                 <span className="value">
//                                     {new Date(
//                                         orderDetail.createdAt,
//                                     ).toLocaleString()}
//                                 </span>
//                             </div>
//                             <div className="detail-item">
//                                 <span className="label">Payment Method</span>
//                                 <span className="value">
//                                     {orderDetail.paymentMethod}
//                                 </span>
//                             </div>
//                             <div className="detail-item">
//                                 <span className="label">Order Status</span>
//                                 <span className="value">
//                                     {orderDetail.status}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="modal-section">
//                         <h3>Customer Information</h3>
//                         <div className="details-grid">
//                             <div className="detail-item">
//                                 <span className="label">Name</span>
//                                 <span className="value">
//                                     {orderDetail.orderedBy.username}
//                                 </span>
//                             </div>
//                             <div className="detail-item">
//                                 <span className="label">Email</span>
//                                 <span
//                                     className="value"
//                                     style={{
//                                         wordBreak: "break-all",
//                                         fontSize: "14px",
//                                     }}
//                                 >
//                                     {orderDetail.orderedBy.email}
//                                 </span>
//                             </div>
//                             <div className="detail-item">
//                                 <span className="label">Phone</span>
//                                 <span className="value">
//                                     {orderDetail.orderedBy.phoneNumber}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="modal-section">
//                         <h3>Shipping Address</h3>
//                         <div className="address-box">
//                             <p>{`${orderDetail.shippingAddress.province}, ${orderDetail.shippingAddress.city}, ${orderDetail.shippingAddress.district}`}</p>
//                             {orderDetail.shippingAddress.localAddress && (
//                                 <p className="local-address">
//                                     {orderDetail.shippingAddress.localAddress}
//                                 </p>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
