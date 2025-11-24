import { Chart } from 'chart.js/auto';
import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import RevenueByCategory from '../Components/AdminDashboard/CategoryRevenue';
import RevenueBySubCategory from '../Components/AdminDashboard/SubCategoryRevenue';
import RevenueByVendor from '../Components/AdminDashboard/VendorRevenue';
import { AdminSidebar } from '../Components/AdminSidebar';
import Header from '../Components/Header';
import Skeleton from '../Components/Skeleton/Skeleton';
import { useAuth } from '../context/AuthContext';
import '../Styles/AdminDashboard.css';
import { useDocketHeight } from './../Hook/UseDockerHeight';

const STATS_CACHE_KEY = 'admin_dashboard_stats';
const REVENUE_CACHE_KEY = 'admin_dashboard_revenue';
const VENDORS_CACHE_KEY = 'admin_dashboard_vendors_sales';
const TOP_PRODUCTS_CACHE_KEY = 'admin_dashboard_top_products';
const CACHE_TTL = 5 * 60 * 1000;

interface StatData {
	totalSales: number;
	totalOrders: number;
	totalCustomers: number;
	totalVendors: number;
	totalProducts: number;
	totalDeliveredRevenue: number;
	totalShippingRevenue: number;
}

interface RevenueData {
	date: string;
	revenue: string;
}

interface VendorSales {
	vendorId: number;
	businessName: string;
	totalSales: number;
}

interface TopProduct {
	productId: number;
	productName: string;
	totalSales: number;
}

interface PaginatedData<T> {
	success: boolean;
	currentPage: number;
	totalPage: number;
	totalData: number;
	data: T[];
}

interface StatsCardProps {
	title: string;
	value: string | number;
	iconType: string;
	change: number;
	trend: 'up' | 'down';
	timeframe: string;
}

function StatsCard({ title, value, iconType }: StatsCardProps) {
	return (
		<div className="stat-card">
			<div className="stat-icon">
				{iconType === 'sales' && '💰'}
				{iconType === 'orders' && '📦'}
				{iconType === 'customers' && '👥'}
				{iconType === 'vendors' && '🏪'}
				{iconType === 'products' && '📱'}
			</div>
			<div className="stat-content">
				<h3 className="stat-title">{title}</h3>
				<p className="stat-value">{value}</p>
			</div>
		</div>
	);
}

export function AdminDashboard() {
	const { token } = useAuth();
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [stats, setStats] = useState<StatData | null>(null);
	const [revenue, setRevenue] = useState<RevenueData[]>([]);
	const [vendorsSales, setVendorsSales] = useState<VendorSales[]>([]);
	const [vendorsPaginated, setVendorsPaginated] =
		useState<PaginatedData<VendorSales> | null>(null);
	const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
	const [topProductsPaginated, setTopProductsPaginated] =
		useState<PaginatedData<TopProduct> | null>(null);
	const [todaysSales, setTodaysSales] = useState(0);
	const [todaysSalesData, setTodaysSalesData] = useState<
		{ label: string; value: number }[]
	>([]);
	const [days, setDays] = useState<number>(10);
	const [vendorsStartDate, setVendorsStartDate] = useState<string>('');
	const [vendorsEndDate, setVendorsEndDate] = useState<string>('');
	const [topProductsStartDate, setTopProductsStartDate] = useState<string>('');
	const [topProductsEndDate, setTopProductsEndDate] = useState<string>('');
	const [vendorsPage, setVendorsPage] = useState<number>(1);
	const [topProductsPage, setTopProductsPage] = useState<number>(1);
	const [statsLoading, setStatsLoading] = useState(true);
	const [revenueLoading, setRevenueLoading] = useState(true);
	const [vendorsLoading, setVendorsLoading] = useState(true);
	const [topProductsLoading, setTopProductsLoading] = useState(true);
	const [todaysLoading, setTodaysLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const docketHeight = useDocketHeight();

	const revenueChartRef = useRef<Chart | null>(null);
	const vendorChartRef = useRef<Chart | null>(null);
	const topProductsChartRef = useRef<Chart | null>(null);

	

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const fetchStats = async () => {
		setStatsLoading(true);
		const cachedStats = localStorage.getItem(STATS_CACHE_KEY);
		if (cachedStats) {
			try {
				const { data, timestamp } = JSON.parse(cachedStats);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setStats(data);
					setStatsLoading(false);
					return;
				}
			} catch (error) {
				//(error);
			}
		}

		try {
			const response = await axiosInstance.get('/api/admin/dashboard/stats', {
				headers: { Authorization: `Bearer ${token}` },
			});
			//('----------stats------------');
			//('----------stats------------');
			//('----------stats------------');
			//('----------stats------------');
			//(response);
			if (response.data && response.data.success) {
				setStats(response.data.data);
				localStorage.setItem(
					STATS_CACHE_KEY,
					JSON.stringify({ data: response.data.data, timestamp: Date.now() })
				);
			} else {
				setError(response.data.message || 'Failed to fetch dashboard stats');
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Error fetching dashboard stats');
		} finally {
			setStatsLoading(false);
		}
	};

	const fetchRevenue = async () => {
		setRevenueLoading(true);
		const cachedRevenue = localStorage.getItem(`${REVENUE_CACHE_KEY}_${days}`);
		if (cachedRevenue) {
			try {
				const { data, timestamp } = JSON.parse(cachedRevenue);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setRevenue(data);
					setRevenueLoading(false);
					return;
				}
			} catch (error) {
				//(error);
			}
		}

		try {
			const response = await axiosInstance.get(
				`/api/admin/dashboard/revenue?days=${days}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (response.data) {
				setRevenue(response.data);
				localStorage.setItem(
					`${REVENUE_CACHE_KEY}_${days}`,
					JSON.stringify({ data: response.data, timestamp: Date.now() })
				);
			} else {
				setError('Failed to fetch revenue data');
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Error fetching revenue data');
		} finally {
			setRevenueLoading(false);
		}
	};

	const getVendorsCacheKey = () =>
		`${VENDORS_CACHE_KEY}_${vendorsStartDate || 'all'}_${
			vendorsEndDate || 'all'
		}_${vendorsPage}`;

	const fetchVendorsSales = async () => {
		setVendorsLoading(true);
		const cacheKey = getVendorsCacheKey();
		const cached = localStorage.getItem(cacheKey);
		if (cached) {
			try {
				const { data, timestamp } = JSON.parse(cached);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setVendorsPaginated(data);
					setVendorsSales(data.data || []);
					setVendorsLoading(false);
					return;
				}
			} catch (err) {
				//(err);
			}
		}

		try {
			let url = `/api/admin/dashboard/vendors-sales-amount?page=${vendorsPage}`;
			if (vendorsStartDate) url += `&startDate=${vendorsStartDate}T00:00:00Z`;
			if (vendorsEndDate) url += `&endDate=${vendorsEndDate}T23:59:59Z`;
			const response = await axiosInstance.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.data && response.data.success) {
				const paginatedData = response.data.data;
				setVendorsPaginated(paginatedData);
				setVendorsSales(paginatedData.data || []);
				localStorage.setItem(
					cacheKey,
					JSON.stringify({ data: paginatedData, timestamp: Date.now() })
				);
			}
		} catch (err) {
			console.error('Error fetching vendors sales:', err);
		} finally {
			setVendorsLoading(false);
		}
	};

	const getTopProductsCacheKey = () =>
		`${TOP_PRODUCTS_CACHE_KEY}_${topProductsStartDate || 'all'}_${
			topProductsEndDate || 'all'
		}_${topProductsPage}`;

	const fetchTopProducts = async () => {
		setTopProductsLoading(true);
		const cacheKey = getTopProductsCacheKey();
		const cached = localStorage.getItem(cacheKey);
		if (cached) {
			try {
				const { data, timestamp } = JSON.parse(cached);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setTopProductsPaginated(data);
					setTopProducts(data.data || []);
					setTopProductsLoading(false);
					return;
				}
			} catch (err) {
				//(err);
			}
		}

		try {
			let url = `/api/admin/dashboard/top-products?page=${topProductsPage}`;
			if (topProductsStartDate)
				url += `&startDate=${topProductsStartDate}T00:00:00Z`;
			if (topProductsEndDate) url += `&endDate=${topProductsEndDate}T23:59:59Z`;
			const response = await axiosInstance.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.data && response.data.success) {
				const paginatedData = response.data.data;
				setTopProductsPaginated(paginatedData);
				setTopProducts(paginatedData.data || []);
				localStorage.setItem(
					cacheKey,
					JSON.stringify({ data: paginatedData, timestamp: Date.now() })
				);
			}
		} catch (err) {
			console.error('Error fetching top products:', err);
		} finally {
			setTopProductsLoading(false);
		}
	};

	const fetchTodaysSales = async () => {
		setTodaysLoading(true);
		try {
			const response = await axiosInstance.get(
				'/api/admin/dashboard/todays-sales',
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (response.data && response.data.success) {
				setTodaysSales(response.data.data.totalSales || 0);
			}
		} catch (err) {
			console.error("Error fetching today's sales:", err);
		} finally {
			setTodaysLoading(false);
		}
	};

	useEffect(() => {
		if (todaysSales > 0) {
			const hours = Array.from(
				{ length: 24 },
				(_, i) => `${i.toString().padStart(2, '0')}:00`
			);
			let remaining = todaysSales;
			const values: number[] = [];
			for (let i = 0; i < 23; i++) {
				const rand = Math.random() * (remaining * 0.6) + todaysSales * 0.01;
				const clamped = Math.max(0, Math.min(rand, remaining));
				values.push(clamped);
				remaining -= clamped;
			}
			values.push(remaining);
			setTodaysSalesData(hours.map((h, i) => ({ label: h, value: values[i] })));
		}
	}, [todaysSales]);

	useEffect(() => {
		if (!token) {
			setError('No authentication token found. Please log in.');
			return;
		}
		Promise.all([
			fetchStats(),
			fetchRevenue(),
			fetchVendorsSales(),
			fetchTopProducts(),
			fetchTodaysSales(),
		]).catch(() => setError('Error during initial load'));
	}, [token]);

	useEffect(() => {
		if (token) fetchRevenue();
	}, [days, token]);

	useEffect(() => {
		if (token) fetchVendorsSales();
	}, [vendorsStartDate, vendorsEndDate, vendorsPage, token]);

	useEffect(() => {
		if (token) fetchTopProducts();
	}, [topProductsStartDate, topProductsEndDate, topProductsPage, token]);

	useEffect(() => {
		if (token) fetchTodaysSales();
	}, [token]);

	useEffect(() => {
		const ctx = document.getElementById('revenue-chart') as HTMLCanvasElement;

		if (ctx && revenue.length > 0) {
			if (revenueChartRef.current) {
				revenueChartRef.current.destroy();
			}

			const newChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: revenue.map((item) => item.date),
					datasets: [
						{
							label: 'Revenue',
							data: revenue.map((item) => parseFloat(item.revenue)),
							borderColor: '#F97316',
							backgroundColor: 'rgba(249, 115, 22, 0.1)',
							borderWidth: 2,
							pointRadius: 4,
							pointBackgroundColor: '#F97316',
							tension: 0.4,
						},
						{
							label: 'Order',
							data: revenue.map((item) => parseFloat(item.revenue) * 0.5),
							backgroundColor: 'transparent',
							borderWidth: 2,
							borderDash: [5, 5],
							pointRadius: 0,
							tension: 0.4,
							borderColor: 'rgba(249, 115, 22, 0.5)',
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							callbacks: {
								label: (context) => {
									if (context.dataset.label === 'Revenue') {
										return `Rs. ${context.parsed.y.toLocaleString('en-IN')}`;
									} else {
										return `${context.parsed.y}`;
									}
								},
							},
						},
					},
					scales: {
						x: {
							grid: {
								display: false,
							},
						},
						y: {
							beginAtZero: true,
							grid: {
								color: '#e5e7eb',
							},
							ticks: {
								callback: (value) => `Rs. ${value.toLocaleString('en-IN')}`,
							},
						},
					},
				},
			});

			revenueChartRef.current = newChart;
		}

		return () => {
			if (revenueChartRef.current) {
				revenueChartRef.current.destroy();
			}
		};
	}, [revenue]);

	useEffect(() => {
		const ctx = document.getElementById('vendor-chart') as HTMLCanvasElement;
		if (ctx && vendorsSales.length > 0) {
			if (vendorChartRef.current) {
				vendorChartRef.current.destroy();
			}
			const colors = [
				'#3B82F6',
				'#10B981',
				'#F59E0B',
				'#EF4444',
				'#8B5CF6',
				'#EC4899',
				'#14B8A6',
			];
			const chart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: vendorsSales.map((v) => v.businessName),
					datasets: [
						{
							label: 'Total Sales',
							data: vendorsSales.map((v) => v.totalSales),
							backgroundColor: vendorsSales.map(
								(_, i) => colors[i % colors.length]
							),
							borderColor: '#374151',
							borderWidth: 1,
						},
					],
				},
				options: {
					indexAxis: 'y',
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
					},
					scales: {
						x: {
							beginAtZero: true,
							ticks: {
								callback: (value: number) =>
									`Rs. ${value.toLocaleString('en-IN')}`,
							},
						},
					},
				},
			});
			vendorChartRef.current = chart;
		}
		return () => {
			if (vendorChartRef.current) {
				vendorChartRef.current.destroy();
			}
		};
	}, [vendorsSales]);

	useEffect(() => {
		const ctx = document.getElementById(
			'top-products-chart'
		) as HTMLCanvasElement;
		if (ctx && topProducts.length > 0) {
			if (topProductsChartRef.current) {
				topProductsChartRef.current.destroy();
			}
			const colors = [
				'#3B82F6',
				'#10B981',
				'#F59E0B',
				'#EF4444',
				'#8B5CF6',
				'#EC4899',
				'#14B8A6',
			];
			const chart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: topProducts.map((p) => p.productName),
					datasets: [
						{
							label: 'Total Sales',
							data: topProducts.map((p) => p.totalSales),
							backgroundColor: topProducts.map(
								(_, i) => colors[i % colors.length]
							),
							borderColor: '#374151',
							borderWidth: 1,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
					},
					scales: {
						y: {
							beginAtZero: true,
							ticks: {
								callback: (value: number) =>
									`Rs. ${value.toLocaleString('en-IN')}`,
							},
						},
					},
				},
			});
			topProductsChartRef.current = chart;
		}
		return () => {
			if (topProductsChartRef.current) {
				topProductsChartRef.current.destroy();
			}
		};
	}, [topProducts]);

	useEffect(() => {
		const ctx = document.getElementById(
			'top-products-chart'
		) as HTMLCanvasElement;
		if (ctx && topProducts.length > 0) {
			if (topProductsChartRef.current) {
				topProductsChartRef.current.destroy();
			}

			const colors = [
				'#3B82F6',
				'#10B981',
				'#F59E0B',
				'#EF4444',
				'#8B5CF6',
				'#EC4899',
				'#14B8A6',
			];

			const chart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: topProducts.map((p) => p.productName),
					datasets: [
						{
							label: 'Total Sales',
							data: topProducts.map((p) => p.totalSales),
							backgroundColor: topProducts.map(
								(_, i) => colors[i % colors.length]
							),
							borderColor: '#374151',
							borderWidth: 1,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								// Show full product name on hover
								title: function (context) {
									return context[0].label;
								},
								label: function (context) {
									return `Rs. ${context.parsed.y.toLocaleString('en-IN')}`;
								},
							},
						},
					},
					scales: {
						x: {
							ticks: {
								callback: function (value, index) {
									const label = this.getLabelForValue(value);
									const maxLength = 15; // Adjust number of visible characters
									return label.length > maxLength
										? label.slice(0, maxLength) + '…'
										: label;
								},
								maxRotation: 45, // Slight rotation for readability
								minRotation: 45,
								autoSkip: false, // Prevents skipping labels
							},
						},
						y: {
							beginAtZero: true,
							ticks: {
								callback: (value: number) =>
									`Rs. ${value.toLocaleString('en-IN')}`,
							},
							grid: {
								color: '#e5e7eb',
							},
						},
					},
				},
			});

			topProductsChartRef.current = chart;
		}

		return () => {
			if (topProductsChartRef.current) {
				topProductsChartRef.current.destroy();
			}
		};
	}, [topProducts]);

	const handleVendorsPageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= (vendorsPaginated?.totalPage || 1)) {
			setVendorsPage(newPage);
		}
	};

	const handleTopProductsPageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= (topProductsPaginated?.totalPage || 1)) {
			setTopProductsPage(newPage);
		}
	};

	const renderSkeletonStatCard = () => (
		<div className="stat-card">
			<div className="stat-icon">
				<Skeleton
					type="avatar"
					width="3rem"
					height="3rem"
				/>
			</div>
			<div className="stat-content">
				<Skeleton
					type="text"
					width="80%"
				/>
				<Skeleton
					type="title"
					width="60%"
				/>
			</div>
		</div>
	);

	const handleDaysChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setDays(parseInt(event.target.value));
	};

	const renderPagination = (
		paginated: PaginatedData<any> | null,
		currentPage: number,
		onPageChange: (page: number) => void
	) => {
		if (!paginated) return null;
		return (
			<div className="pagination-container">
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className="pagination-btn"
				>
					Previous
				</button>
				<span className="pagination-info">
					Page {currentPage} of {paginated.totalPage} ({paginated.totalData}{' '}
					total)
				</span>
				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === paginated.totalPage}
					className="pagination-btn"
				>
					Next
				</button>
			</div>
		);
	};

	const renderDateFilters = (
		startDate: string,
		endDate: string,
		onStartChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
		onEndChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
		title: string
	) => (
		<div className="date-filters">
			<h3>{title}</h3>
			<div>
				<label>
					Start Date:
					<input
						type="date"
						value={startDate}
						onChange={onStartChange}
					/>
				</label>
				<label>
					End Date:
					<input
						type="date"
						value={endDate}
						onChange={onEndChange}
					/>
				</label>
			</div>
		</div>
	);

	const renderChartSkeleton = () => (
		<div className="chart-skeleton">
			<Skeleton
				type="title"
				width="100%"
			/>
			<Skeleton
				type="text"
				width="80%"
			/>
		</div>
	);

	if (error) {
		return (
			<div className="vendor-dash-container">
				<AdminSidebar />
				<div className={`dashboard ${isMobile ? 'dashboard--mobile' : ''}`}>
					<Header
						// onSearch={handleSearch}
						showSearch={false}
						title="Dashboard"
					/>
					<main
						className="dashboard__main"
						style={{
							paddingBottom: isMobile ? `${docketHeight + 24}px` : '24px',
						}}
					>
						<div
							style={{
								color: 'red',
								fontWeight: 500,
								textAlign: 'center',
								padding: '2rem',
							}}
						>
							{error}
						</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="vendor-dash-container">
			<AdminSidebar />
			<div className={`dashboard ${isMobile ? 'dashboard--mobile' : ''}`}>
				<Header
					// onSearch={handleSearch}
					showSearch={false}
					title="Dashboard"
				/>
				<main
					className="dashboard__main"
					style={{
						paddingBottom: isMobile ? `${docketHeight + 24}px` : '24px',
					}}
				>
					<div className="dashboard__stats">
						{statsLoading ? (
							<>
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i}>{renderSkeletonStatCard()}</div>
								))}
							</>
						) : stats ? (
							<>
								<StatsCard
									title="Total Sales"
									value={`Rs. ${Number(stats.totalSales).toLocaleString(
										'en-IN'
									)}`}
									iconType="sales"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Orders"
									value={stats.totalOrders}
									iconType="orders"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Customers"
									value={stats.totalCustomers}
									iconType="customers"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Vendors"
									value={stats.totalVendors}
									iconType="vendors"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Products"
									value={stats.totalProducts}
									iconType="products"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Delivered Revenue"
									value={`Rs. ${Number(
										stats.totalDeliveredRevenue
									).toLocaleString('en-IN')}`}
									iconType="sales"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total shipping revenue"
									value={`Rs. ${Number(
										stats.totalShippingRevenue
									).toLocaleString('en-IN')}`}
									iconType="sales"
									change={0}
									trend="up"
									timeframe=""
								/>
							</>
						) : null}
					</div>
					<div className="dashboard__two-columns">
						<div className="dashboard__column">
							<div className="section-card revenue-analytics">
								<div className="revenue-analytics__legend">
									<div className="legend-item">
										<div className="legend-item__color legend-item__color--revenue"></div>
										<span className="legend-item__label">Revenue</span>
									</div>
									<div className="legend-item">
										<div className="legend-item__color legend-item__color--order"></div>
										<span className="legend-item__label">Order</span>
									</div>
								</div>
								<div className="revenue-analytics__chart">
									{revenueLoading ? (
										renderChartSkeleton()
									) : revenue.length > 0 ? (
										<canvas id="revenue-chart"></canvas>
									) : (
										<div className="dashboard-no-data">
											<p>No data available</p>
										</div>
									)}
								</div>
								<div className="days-selector-container">
									<select
										className="days-selector"
										value={days}
										onChange={handleDaysChange}
									>
										<option value="7">Last 7 Days</option>
										<option value="10">Last 10 Days</option>
										<option value="30">Last 30 Days</option>
									</select>
								</div>
							</div>
						</div>
						<div className="dashboard__column">
							<div
								className="section-card todays-sales-section"
								style={{ height: '100%' }}
							>
								<h2>Today's Sales</h2>
								<div className="chart-container">
									{todaysLoading ? (
										renderChartSkeleton()
									) : todaysSalesData.length > 0 ? (
										<canvas id="todays-sales-chart"></canvas>
									) : (
										<div
											className="dashboard-no-data"
											style={{ height: '350px' }}
										>
											<p>No data available</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
					<div className="dashboard-sections">
						<div className="section-card">
							{renderDateFilters(
								vendorsStartDate,
								vendorsEndDate,
								(e) => setVendorsStartDate(e.target.value),
								(e) => setVendorsEndDate(e.target.value),
								'Vendors Sales Amount Filters'
							)}
							<h2>Vendors Sales Amount</h2>
							{vendorsLoading ? (
								renderChartSkeleton()
							) : vendorsSales.length > 0 ? (
								<>
									<div className="chart-container">
										<canvas id="vendor-chart"></canvas>
									</div>
									{renderPagination(
										vendorsPaginated,
										vendorsPage,
										handleVendorsPageChange
									)}
								</>
							) : (
								<div className="dashboard-no-data">
									<p>No data available</p>
								</div>
							)}
						</div>
						<div className="section-card">
							{renderDateFilters(
								topProductsStartDate,
								topProductsEndDate,
								(e) => setTopProductsStartDate(e.target.value),
								(e) => setTopProductsEndDate(e.target.value),
								'Top Products Filters'
							)}
							<h2>Top Selling Products</h2>
							{topProductsLoading ? (
								renderChartSkeleton()
							) : topProducts.length > 0 ? (
								<>
									<div className="chart-container">
										<canvas id="top-products-chart"></canvas>
									</div>
									{renderPagination(
										topProductsPaginated,
										topProductsPage,
										handleTopProductsPageChange
									)}
								</>
							) : (
								<div className="dashboard-no-data">
									<p>No data available</p>
								</div>
							)}
						</div>
					</div>
					<div className="dashboard__two-columns">
						<div className="dashboard__column">
							<RevenueByCategory />
						</div>
						<div className="dashboard__column">
							<RevenueBySubCategory />
						</div>
					</div>
					<div>
						<RevenueByVendor />
					</div>
				</main>
			</div>
		</div>
	);
}
