import React from "react";
import { Toaster } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

const commissionData = [
    { level1: "Bags", level2: "Bags", level3: "Women Bags, Man Bags, Kids Bags, Travel, Laptops, Tablet, Camera Bags & Cases", commission: 15.00 },
    { level1: "Bed & Bathroom", level2: "Bathroom", level3: "Toilet Brushes, Bathroom Mirrors, Bathroom Counter Storage, Toilet Roll Holders, Blankets, Bed Sheets, Bed Accessories", commission: 13.00 },
    { level1: "Cameras", level2: "Camera Accessories", level3: "Camera Accessories", commission: 14.00 },
    { level1: "Cameras", level2: "Drones", level3: "Drones, Drone Accessories", commission: 5.00 },
    { level1: "Cameras", level2: "DSLR", level3: "DSLR Sets, Body Only", commission: 5.00 },
    { level1: "Cameras", level2: "Gadgets & Other Cameras", level3: "Gadgets & Other Cameras", commission: 5.00 },
    { level1: "Cameras", level2: "Lenses", level3: "Lenses", commission: 5.00 },
    { level1: "Phones & Tablets", level2: "Mobiles, Phone & Tablets", level3: "Landline Phones, Smart Phone, IPhone and Tablets", commission: 5.00 },
    { level1: "Phones & Tablets", level2: "Mobiles, Phone & Tablets", level3: "Mobile Accessories, Tablets Accessories", commission: 15.00 },
    { level1: "Computers & Laptops", level2: "Computer Accessories", level3: "Computer Accessories", commission: 14.00 },
    { level1: "Computers & Laptops", level2: "Desktops Computers", level3: "Desktops Computers", commission: 5.00 },
    { level1: "Computers & Laptops", level2: "Laptops", level3: "Laptops", commission: 5.00 },
    { level1: "Computers & Laptops", level2: "Laptops", level3: "Laptops Accessories", commission: 14.00 },
    { level1: "Computers & Laptops", level2: "Monitors", level3: "Monitors", commission: 5.00 },
    { level1: "Computers & Laptops", level2: "Printers & Accessories", level3: "Printers & Accessories", commission: 5.00 },
    { level1: "Computers & Laptops", level2: "Scanners", level3: "Scanners", commission: 5.00 },
    { level1: "Fashion", level2: "Boys", level3: "Shoes, Belts, Clothing, Hats & Caps", commission: 15.00 },
    { level1: "Fashion", level2: "Girls", level3: "Shoes, Belts, Clothing, Hats & Caps, Tops, Hair Accessories", commission: 15.00 },
    { level1: "Fashion", level2: "Kids", level3: "Shoes, Belts, Clothing, Hats & Caps", commission: 15.00 },
    { level1: "Furniture", level2: "Furniture", level3: "Living Room Furniture, Kitchen & Dining Furniture, Home Office Furniture, Bedroom Furniture", commission: 12.00 },
    { level1: "Lighting", level2: "Lighting", level3: "Lighting Accessories", commission: 12.00 },
    { level1: "Health & Beauty", level2: "Health & Beauty", level3: "Massage Oils, Soaps, Sun Care, Skin Care Tools, Makeup Accessories, Health Accessories", commission: 10.00 },
    { level1: "Home Accessories", level2: "Home Accessories", level3: "Air Purifier Accessories, Fan Parts & Accessories, Vacuum Cleaners Accessories, Electric Multi Cookers, Irons, Ovens, Fridge, Kitchen Uses, TV and Accessories", commission: 13.00 },
    { level1: "Stationery", level2: "Books & Magazines", level3: "Books & Magazines, Photo Albums, Note Books, Paper Products, School & Office Equipment", commission: 12.00 },
    { level1: "Musical Instruments", level2: "Musical Instruments", level3: "Guitars, Drums, Pianos, DJ, Karaoke & Electronic Music and Other Instruments", commission: 7.00 },
    { level1: "Motors", level2: "Automotive", level3: "Truck Parts & Accessories, Auto Parts, Vehicle Backup Cameras, Auto Tools, Car Parts and Accessories, Bus Parts and Accessories, Bike Parts and Accessories", commission: 10.00 },
    { level1: "Sports", level2: "Sports & Outdoor Play", level3: "Sports Accessories", commission: 12.00 },
    { level1: "Toys & Games", level2: "Video Game Characters", level3: "Video Game Characters", commission: 12.00 },
    { level1: "Sunglasses", level2: "Men, Kids and Women", level3: "Sunglasses, Accessories", commission: 15.00 },
    { level1: "Watch", level2: "Watch and Accessories", level3: "Watch and Accessories", commission: 15.00 },
];

const CommissionList: React.FC = () => {
    const handleGoBack = () => {
        window.close(); // Closes the current tab, returning to the previous tab with the form
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Commission List", 20, 20);
        doc.setFontSize(12);

        const tableData = commissionData.map(item => [
            item.level1,
            item.level2,
            item.level3,
            `${item.commission}%`,
        ]);

        (doc as any).autoTable({
            head: [["Category Level 1", "Category Level 2", "Category Level 3", "Commission %"]],
            body: tableData,
            startY: 30,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
        });

        doc.save("Commission_List.pdf");
    };

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#f4f4f4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            fontFamily: "Arial, sans-serif"
        }}>
            <Toaster position="top-center" />
            <div style={{
                width: "100%",
                maxWidth: "1000px",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                textAlign: "center"
            }}>
                <h1 style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginBottom: "16px"
                }}>
                    Commission List
                </h1>
                <div style={{
                    width: "100%",
                    overflowX: "auto",
                    marginBottom: "24px"
                }}>
                    <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "14px",
                        color: "#1f2937"
                    }}>
                        <thead>
                            <tr style={{
                                backgroundColor: "#2563eb",
                                color: "#ffffff"
                            }}>
                                <th style={{
                                    padding: "12px",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "left"
                                }}>Category Level 1</th>
                                <th style={{
                                    padding: "12px",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "left"
                                }}>Category Level 2</th>
                                <th style={{
                                    padding: "12px",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "left"
                                }}>Category Level 3</th>
                                <th style={{
                                    padding: "12px",
                                    border: "1px solid #e5e7eb",
                                    textAlign: "left"
                                }}>Commission %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionData.map((item, index) => (
                                <tr key={index} style={{
                                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb"
                                }}>
                                    <td style={{
                                        padding: "12px",
                                        border: "1px solid #e5e7eb"
                                    }}>{item.level1}</td>
                                    <td style={{
                                        padding: "12px",
                                        border: "1px solid #e5e7eb"
                                    }}>{item.level2}</td>
                                    <td style={{
                                        padding: "12px",
                                        border: "1px solid #e5e7eb"
                                    }}>{item.level3}</td>
                                    <td style={{
                                        padding: "12px",
                                        border: "1px solid #e5e7eb"
                                    }}>{item.commission}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px"
                }}>
                    <button
                        onClick={handleDownloadPDF}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "#16a34a",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "600",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                    >
                        Download as PDF
                    </button>
                    <button
                        onClick={handleGoBack}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "600",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                    >
                        Go Back to Form
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommissionList;