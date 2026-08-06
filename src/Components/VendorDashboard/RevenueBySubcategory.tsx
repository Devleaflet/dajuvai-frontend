import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config';
import { useVendorAuth } from '../../context/VendorAuthContext';

interface RevenueData {
    subcategory: string;
    revenue: string;
}

const VendorRevenueBySubCategory = () => {
    const [data, setData] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { authState } = useVendorAuth();
    const { token, isAuthenticated } = authState;

    useEffect(() => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            setData([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(false);
        fetch(`${API_BASE_URL}/api/vendor/dashboard/analytics/revenue-by-sub-category`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then((res) => {
                if (cancelled) return;
                setData(Array.isArray(res.data) ? res.data.map((item: RevenueData) => ({
                    subcategory: item.subcategory || 'Uncategorized',
                    revenue: String(Number(item.revenue) || 0),
                })) : []);
            })
            .catch(() => {
                if (!cancelled) { setError(true); setData([]); }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [isAuthenticated, token]);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Revenue by Subcategory</h2>
            {loading ? <div style={styles.noData}>Loading revenue…</div> : error ? <div style={styles.noData}>Revenue unavailable</div> : data.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(280, data.length * 38)}>
                    <BarChart
                        data={data.map(d => ({ ...d, revenue: parseFloat(d.revenue) }))}
                        layout="vertical"
                        margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5eaf1" />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `Rs ${Number(value).toLocaleString('en-IN')}`} />
                        <YAxis type="category" dataKey="subcategory" width={128} tick={{ fill: '#334155', fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => `Rs. ${Number(value).toLocaleString('en-IN')}`} />
                        <Bar dataKey="revenue" fill="#F97316" radius={[0, 6, 6, 0]} barSize={18} />
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
        padding: 0,
        backgroundColor: 'transparent',
        borderRadius: 0,
        boxShadow: 'none',
        width: '100%',
        margin: 0,
    },
    title: {
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '16px',
        color: '#1F2937',
        textAlign: 'left',
    },
    noData: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '13px',
        padding: '40px 0',
    },
};

export default VendorRevenueBySubCategory;
