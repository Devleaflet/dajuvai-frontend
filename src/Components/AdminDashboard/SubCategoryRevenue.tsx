import React, { useEffect, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { API_BASE_URL } from '../../config';

interface RevenueData {
	subcategory: string;
	revenue: string;
}

const RevenueBySubCategory = () => {
	const [data, setData] = useState<RevenueData[]>([]);

	// Default: last 30 days
	const today = new Date().toISOString().split('T')[0];
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	const defaultStartDate = oneMonthAgo.toISOString().split('T')[0];

	const [startDate, setStartDate] = useState(defaultStartDate);
	const [endDate, setEndDate] = useState(today);

	useEffect(() => {
		if (!startDate || !endDate) return;

		const url = `${API_BASE_URL}/api/admin/dashboard/analytics/revenue-by-sub-category?startDate=${startDate}&endDate=${endDate}`;

		fetch(url)
			.then((res) => res.json())
			.then((res) => {
				console.log('API Response:', res);
				setData(res.data || []);
			})
			.catch((err) => {
				console.error('Fetch error:', err);
				setData([]);
			});
	}, [startDate, endDate]);

	const chartData = data.map((d) => ({
		...d,
		revenue: parseFloat(d.revenue) || 0,
	}));

	return (
		<div style={styles.container}>
			<h1 style={styles.title}>Revenue by Subcategory</h1>

			<div style={styles.filterRow}>
				<div style={styles.labelGroup}>
					<label style={styles.label}>Start Date</label>
					<input
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						max={endDate}
						style={styles.dateInput}
					/>
				</div>
				<div style={styles.labelGroup}>
					<label style={styles.label}>End Date</label>
					<input
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						min={startDate}
						max={today}
						style={styles.dateInput}
					/>
				</div>
			</div>

			{chartData.length === 0 ? (
				<div style={styles.noData}>
					<p>No Data Available</p>
				</div>
			) : (
				<ResponsiveContainer
					width="100%"
					height={400}
				>
					<BarChart
						data={chartData}
						margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="subcategory"
							angle={-45}
							textAnchor="end"
							height={100}
							interval={0}
							tick={{ fontSize: 12 }}
						/>
						<YAxis />
						<Tooltip
							formatter={(value: number) => `$${value.toLocaleString()}`}
							contentStyle={{
								borderRadius: '8px',
								border: '1px solid #e5e7eb',
							}}
						/>
						<Bar
							dataKey="revenue"
							fill="#10b981"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
			)}
		</div>
	);
};

const styles: { [key: string]: React.CSSProperties } = {
	container: {
		padding: '24px',
		backgroundColor: '#fff',
		borderRadius: '12px',
		boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
		maxWidth: '900px',
		margin: '40px auto',
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	},
	title: {
		fontSize: '26px',
		fontWeight: 'bold',
		marginBottom: '24px',
		textAlign: 'center',
		color: '#1f2937',
	},
	filterRow: {
		display: 'flex',
		justifyContent: 'center',
		gap: '32px',
		marginBottom: '24px',
		flexWrap: 'wrap',
	},
	labelGroup: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: '6px',
	},
	label: {
		fontSize: '14px',
		fontWeight: '600',
		color: '#374151',
	},
	dateInput: {
		padding: '10px 12px',
		border: '1px solid #d1d5db',
		borderRadius: '6px',
		fontSize: '14px',
		backgroundColor: '#fff',
		minWidth: '160px',
		transition: 'border-color 0.2s',
		':focus': {
			outline: 'none',
			borderColor: '#4f46e5',
			boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
		},
	},
	noData: {
		height: '400px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '18px',
		color: '#6b7280',
		backgroundColor: '#f9fafb',
		borderRadius: '8px',
		marginTop: '8px',
		fontWeight: '500',
	},
};

export default RevenueBySubCategory;
