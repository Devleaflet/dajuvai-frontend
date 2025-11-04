import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config';

interface RevenueData {
    subcategory: string;
    revenue: string;
}

const RevenueBySubCategory = () => {
    const [data, setData] = useState<RevenueData[]>([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/admin/dashboard/analytics/revenue-by-sub-category`)
            .then((res) => res.json())
            .then((res) => {
                console.log('API Response:', res);
                setData(res.data);
            })
            .catch((err) => console.error(err));
    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Revenue by Sub Category</h1>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={data.map(d => ({ ...d, revenue: parseFloat(d.revenue) }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subcategory" />
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
};

export default RevenueBySubCategory;
