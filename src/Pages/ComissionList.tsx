import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../Styles/CommissionList.css";

const commissionData = [
    { level1: "Bags", level2: "Bags", level3: "Women Bags, Man Bags, Kids Bags, Travel, Laptops, Tablet, Camera Bags & Cases", commission: 15.0 },
    { level1: "Bed & Bathroom", level2: "Bathroom", level3: "Toilet Brushes, Bathroom Mirrors, Bathroom Counter Storage, Toilet Roll Holders, Blankets, Bed Sheets, Bed Accessories", commission: 13.0 },
    { level1: "Cameras", level2: "Camera Accessories", level3: "Camera Accessories", commission: 14.0 },
    { level1: "Cameras", level2: "Drones", level3: "Drones, Drone Accessories", commission: 5.0 },
    { level1: "Cameras", level2: "DSLR", level3: "DSLR Sets, Body Only", commission: 5.0 },
    { level1: "Cameras", level2: "Gadgets & Other Cameras", level3: "Gadgets & Other Cameras", commission: 5.0 },
    { level1: "Cameras", level2: "Lenses", level3: "Lenses", commission: 5.0 },
    { level1: "Phones & Tablets", level2: "Mobiles, Phone & Tablets", level3: "Landline Phones, Smart Phone, IPhone and Tablets", commission: 5.0 },
    { level1: "Phones & Tablets", level2: "Mobiles, Phone & Tablets", level3: "Mobile Accessories, Tablets Accessories", commission: 15.0 },
    { level1: "Computers & Laptops", level2: "Computer Accessories", level3: "Computer Accessories", commission: 14.0 },
    { level1: "Computers & Laptops", level2: "Desktops Computers", level3: "Desktops Computers", commission: 5.0 },
    { level1: "Computers & Laptops", level2: "Laptops", level3: "Laptops", commission: 5.0 },
    { level1: "Computers & Laptops", level2: "Laptops", level3: "Laptops Accessories", commission: 14.0 },
    { level1: "Computers & Laptops", level2: "Monitors", level3: "Monitors", commission: 5.0 },
    { level1: "Computers & Laptops", level2: "Printers & Accessories", level3: "Printers & Accessories", commission: 5.0 },
    { level1: "Computers & Laptops", level2: "Scanners", level3: "Scanners", commission: 5.0 },
    { level1: "Fashion", level2: "Boys", level3: "Shoes, Belts, Clothing, Hats & Caps", commission: 15.0 },
    { level1: "Fashion", level2: "Girls", level3: "Shoes, Belts, Clothing, Hats & Caps, Tops, Hair Accessories", commission: 15.0 },
    { level1: "Fashion", level2: "Kids", level3: "Shoes, Belts, Clothing, Hats & Caps", commission: 15.0 },
    { level1: "Furniture", level2: "Furniture", level3: "Living Room Furniture, Kitchen & Dining Furniture, Home Office Furniture, Bedroom Furniture", commission: 12.0 },
    { level1: "Lighting", level2: "Lighting", level3: "Lighting Accessories", commission: 12.0 },
    { level1: "Health & Beauty", level2: "Health & Beauty", level3: "Massage Oils, Soaps, Sun Care, Skin Care Tools, Makeup Accessories, Health Accessories", commission: 10.0 },
    { level1: "Home Accessories", level2: "Home Accessories", level3: "Air Purifier Accessories, Fan Parts & Accessories, Vacuum Cleaners Accessories, Electric Multi Cookers, Irons, Ovens, Fridge, Kitchen Uses, TV and Accessories", commission: 13.0 },
    { level1: "Stationery", level2: "Books & Magazines", level3: "Books & Magazines, Photo Albums, Note Books, Paper Products, School & Office Equipment", commission: 12.0 },
    { level1: "Musical Instruments", level2: "Musical Instruments", level3: "Guitars, Drums, Pianos, DJ, Karaoke & Electronic Music and Other Instruments", commission: 7.0 },
    { level1: "Motors", level2: "Automotive", level3: "Truck Parts & Accessories, Auto Parts, Vehicle Backup Cameras, Auto Tools, Car Parts and Accessories, Bus Parts and Accessories, Bike Parts and Accessories", commission: 10.0 },
    { level1: "Sports", level2: "Sports & Outdoor Play", level3: "Sports Accessories", commission: 12.0 },
    { level1: "Toys & Games", level2: "Video Game Characters", level3: "Video Game Characters", commission: 12.0 },
    { level1: "Sunglasses", level2: "Men, Kids and Women", level3: "Sunglasses, Accessories", commission: 15.0 },
    { level1: "Watch", level2: "Watch and Accessories", level3: "Watch and Accessories", commission: 15.0 },
];

const CommissionList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleGoBack = () => window.close();

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Commission List", 20, 20);

        const filteredData = commissionData.filter((item) =>
            item.level3.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const tableData = filteredData.map((item) => [
            item.level1,
            item.level2,
            item.level3,
            `${item.commission}%`,
        ]);

        autoTable(doc, {
            head: [["Category Level 1", "Category Level 2", "Category Level 3", "Commission %"]],
            body: tableData,
            startY: 30,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save("Commission_List.pdf");
    };

    // Filter data for table
    const filteredData = commissionData.filter((item) =>
        item.level3.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="commission-container">
            <Toaster position="top-center" />
            <div className="commission-card">
                <div className="commission-header">
                    <h1>Commission List</h1>
                    <p>Detailed breakdown of commission rates across categories</p>
                </div>

                {/*  Search Bar */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by Category Level 3..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Category Level 1</th>
                                <th>Category Level 2</th>
                                <th>Category Level 3</th>
                                <th>Commission</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <tr key={index}>
                                    <td data-label="Level 1">{item.level1}</td>
                                    <td data-label="Level 2">{item.level2}</td>
                                    <td data-label="Level 3">{item.level3}</td>
                                    <td data-label="Commission" className="highlight">{item.commission}%</td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: "center", padding: "1rem" }}>
                                        ❌ No results found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="button-group">
                    <button className="btn btn-green" onClick={handleDownloadPDF}>
                        📄 Download as PDF
                    </button>
                    <button className="btn btn-blue" onClick={handleGoBack}>
                        ↩️ Go Back to Form
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommissionList;