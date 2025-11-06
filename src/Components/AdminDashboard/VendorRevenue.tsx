import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config';

interface RevenueData {
    vendorId: string;
    vendorName: string;
    revenue: string;
}

const RevenueByVendor = () => {
    const [data, setData] = useState<RevenueData[]>([]);
    const today = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const defaultStartDate = oneMonthAgo.toISOString().split('T')[0];
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        let url = `${API_BASE_URL}/api/admin/dashboard/analytics/vendor/revenue`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        // Fetch API data
        fetch(url)
            .then((res) => res.json())
            .then((res) => {
                console.log('API Response:', res);
                setData(res.data);
            })
            .catch((err) => console.error(err));
    }, [startDate, endDate]);

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Revenue by Vendor</h1>
            <div style={styles.labelContainer}>
                <label style={styles.label}>Start Date:</label>
                <label style={styles.label}>End Date:</label>
            </div>
            <div style={styles.filterContainer}>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={styles.dateInput}
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={styles.dateInput}
                />
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={data.map(d => ({ ...d, revenue: parseFloat(d.revenue) }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vendorName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#4f46e5" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '40px auto',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center',
    },
    filterContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
    },
    labelContainer:{
        display:'flex',
        justifyContent:"space-between"
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
    },
    dateInput: {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '14px',
        backgroundColor: '#fff',
    },
};

export default RevenueByVendor;