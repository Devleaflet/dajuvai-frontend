import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config';

interface RevenueData {
    subcategory: string;
    revenue: string;
}

const VendorRevenueBySubCategory = () => {
    const [data, setData] = useState<RevenueData[]>([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/vendor/dashboard/analytics/revenue-by-sub-category`)
            .then((res) => res.json())
            .then((res) => {
                console.log('API Response:', res);
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setData(res.data);
                } else {
                    setData([]);
                }
            })
            .catch((err) => {
                console.error(err);
                setData([]);
            });
    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Revenue by Sub Category</h1>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={data.map(d => ({ ...d, revenue: parseFloat(d.revenue) }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subcategory" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `Rs. ${value.toLocaleString()}`} />
                        <Bar dataKey="revenue" fill="#F97316" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div style={styles.noData}>No data available</div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '16px 20px',
        backgroundColor: '#FAFAFA',
        borderRadius: '12px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        maxWidth: '780px',
        margin: '40px auto',
    },
    title: {
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '16px',
        color: '#1F2937',
        textAlign: 'center',
    },
    noData: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '14px',
        padding: '40px 0',
    },
};

export default VendorRevenueBySubCategory;
