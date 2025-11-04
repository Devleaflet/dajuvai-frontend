import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config';

interface TopProductData {
    productId: number;
    productName: string;
    totalquantity: number;
    totalSales: number;
}

const TopProducts = () => {
    const [data, setData] = useState<TopProductData[]>([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/vendor/dashboard/analytics/top-selling-products`)
            .then(res => res.json())
            .then(res => {
                if (Array.isArray(res)) {
                    const formattedData = res.map((d: TopProductData) => ({
                        productId: d.productId,
                        productName: d.productName,
                        totalSales: Number(d.totalSales),
                        totalquantity: Number(d.totalquantity),
                    }));
                    setData(formattedData);
                } else {
                    setData([]);
                }
            })
            .catch(err => {
                console.error(err);
                setData([]);
            });
    }, []);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Top Selling Products</h2>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#555', fontSize: 12 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="productName"
                            tickLine={false}
                            axisLine={false}
                            width={200}
                            tick={{ fill: '#333', fontSize: 13 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(200,200,200,0.1)' }}
                            formatter={(value: number) => `Rs. ${value.toLocaleString()}`}
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                        />
                        {/* Bars */}
                        <Bar
                            dataKey="totalSales"
                            fill="#5C6BC0"
                            radius={[4, 4, 4, 4]}
                            barSize={18}
                            name="Sales"
                        />

                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p style={styles.noData}>No data available</p>
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

export default TopProducts;
