import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
	FaBars,
	FaChevronDown,
	FaChevronLeft,
	FaChevronRight,
	FaCog,
	FaHeart,
	FaHome,
	FaInfoCircle,
	FaShoppingBag,
	FaShoppingCart,
	FaSignOutAlt,
	FaTimes,
	FaUser,
} from 'react-icons/fa';
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from 'react-icons/fa6';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchPlacementCategories, PLACEMENTS } from '../api/placements';
import logo from '../assets/logo.webp';
import nepal from '../assets/nepal.gif';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { mapToNavCategories, type CategoryItem } from '../context/Category';
import { useUI } from '../context/UIContext';
import { useVendorAuth } from '../context/VendorAuthContext';
import VendorLogin from '../Pages/VendorLogin';
import '../Styles/Navbar.css';
import AuthModal from './AuthModal';
import Cart from './Cart';
import InlineNavbarSearch from './InlineNavbarSearch';

interface Category {
	id: number;
	name: string;
	items: Array<{
		id: number;
		name: string;
		image?: string;
	}>;
}

const Navbar: React.FC = () => {
	const {
		user,
		isAuthenticated,
		isLoading,
		logout: userLogout,
		fetchUserData,
	} = useAuth();
	const mobileProfileRef = useRef<HTMLDivElement>(null);
	const { authState: vendorAuthState, logout: vendorLogout } = useVendorAuth();
	const { cartOpen, setCartOpen, sideMenuOpen, setSideMenuOpen } = useUI();
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
	const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
	const [vendorAuthModalOpen, setVendorAuthModalOpen] =
		useState<boolean>(false);
	const [profileDropdownOpen, setProfileDropdownOpen] =
		useState<boolean>(false);
	const [moreDropdownOpen, setMoreDropdownOpen] = useState<boolean>(false);
	const [sideMoreOpen, setSideMoreOpen] = useState<boolean>(false);
	const [isCategoriesReady, setIsCategoriesReady] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
	const [dropdownPosition, setDropdownPosition] = useState<{
		top: number;
		left: number;
	} | null>(null);
	const categoryRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
	const [scrollPosition, setScrollPosition] = useState(0);
	const categoriesRef = useRef<HTMLDivElement>(null);
	const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const sideMenuRef = useRef<HTMLDivElement>(null);
	const hamburgerRef = useRef<HTMLButtonElement>(null);
	const cartButtonRef = useRef<HTMLButtonElement>(null);
	const profileRef = useRef<HTMLDivElement>(null);
	const dropdownTriggerRef = useRef<HTMLDivElement>(null);
	const searchTriggerRef = useRef<HTMLInputElement>(null);
	const moreDropdownRef = useRef<HTMLDivElement>(null);
	const focusSearch = useCallback((query = '') => {
		setSearchQuery(query);
		requestAnimationFrame(() => searchTriggerRef.current?.focus());
	}, []);

	const { cartItems, cartCount } = useCart();

	const cartOrderRef = useRef<Map<number, number>>(new Map());
	const nextOrderIndexRef = useRef(0);

	const unlockBodyScroll = () => {
		document.body.style.overflow = '';
		document.body.style.position = '';
		document.body.style.top = '';

		document.body.classList.remove('navbar--menu-open');
		document.body.classList.remove('no-scroll');
		document.body.classList.remove('cart-open');
	};

	// Treat vendor auth as a first-class auth state for the navbar profile UI.
	const isVendorAuthenticated =
		!!vendorAuthState.token &&
		!!vendorAuthState.vendor &&
		vendorAuthState.isAuthenticated;

	const isProfileAuthenticated = isAuthenticated || isVendorAuthenticated;


	useEffect(() => {
		cartItems.forEach((item) => {
			if (!cartOrderRef.current.has(item.id)) {
				cartOrderRef.current.set(item.id, nextOrderIndexRef.current++);
			}
		});
		for (const id of Array.from(cartOrderRef.current.keys())) {
			if (!cartItems.some((ci) => ci.id === id)) {
				cartOrderRef.current.delete(id);
			}
		}
	}, [cartItems]);

	const stableCartItems = useMemo(() => {
		return [...cartItems].sort((a, b) => {
			const ai = cartOrderRef.current.get(a.id) ?? 0;
			const bi = cartOrderRef.current.get(b.id) ?? 0;
			return ai - bi;
		});
	}, [cartItems]);

	// Mega-menu categories are local to the navbar: rendered straight from the
	// MEGA_MENU placement, not the shared category context (which other surfaces
	// write with their own placements and would clobber).
	const [categories, setCategories] = useState<Category[]>([]);

	const resolveProfilePicture = (value?: string | null) => {
		if (!value) return '';
		const trimmed = value.trim();
		if (!trimmed) return '';
		if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
			return trimmed;
		}
		if (trimmed.startsWith('//')) return `https:${trimmed}`;
		const base = API_BASE_URL.replace(/\/api\/?$/, '');
		return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
	};

	useEffect(() => {
		if (
			isAuthenticated &&
			user?.id &&
			(user.role === 'admin' || !user.username || !user.profilePicture)
		) {
			fetchUserData(user.id);
		}
	}, [
		isAuthenticated,
		user?.id,
		user?.role,
		user?.username,
		user?.profilePicture,
		fetchUserData,
	]);

	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'authUser') {
				//('authUser changed in localStorage:', e.newValue);
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const targetNode = event.target as Node;

			// Determine if the click occurred inside either profile dropdown (desktop or mobile)
			const isInsideProfileDropdown =
				(!!profileRef.current && profileRef.current.contains(targetNode)) ||
				(!!mobileProfileRef.current && mobileProfileRef.current.contains(targetNode));

			// Determine if the click occurred inside the profile trigger (avatar/button)
			const isInsideTrigger =
				!!dropdownTriggerRef.current &&
				dropdownTriggerRef.current.contains(targetNode);

			if (profileDropdownOpen && !isInsideTrigger && !isInsideProfileDropdown) {
				setProfileDropdownOpen(false);
			}

			if (
				moreDropdownOpen &&
				moreDropdownRef.current &&
				!moreDropdownRef.current.contains(targetNode)
			) {
				setMoreDropdownOpen(false);
			}
		}
		function handleEsc(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setProfileDropdownOpen(false);
				setMoreDropdownOpen(false);
			}
		}
		if (profileDropdownOpen || moreDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleEsc);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEsc);
		};
	}, [profileDropdownOpen, moreDropdownOpen]);

	const getUserAvatar = () => {
		if (isLoading) return <div className="navbar__avatar-loading"></div>;

		// Prefer user avatar when a user is logged in.
		if (isAuthenticated && user) {
			const resolvedProfilePicture = resolveProfilePicture(user.profilePicture);
			if (resolvedProfilePicture) {
				return (
					<img
						src={resolvedProfilePicture}
						alt={user.username || user.email || 'User'}
						className="navbar__avatar-image"
					/>
				);
			}
			const letter = user.username?.charAt(0) || user.email?.charAt(0) || '?';
			return (
				<span className="navbar__avatar-circle">{letter.toUpperCase()}</span>
			);
		}

		// Fallback: vendor avatar when vendor is logged in (home page should still show a dropdown).
		if (isVendorAuthenticated && vendorAuthState.vendor) {
			const name = vendorAuthState.vendor.businessName || 'Vendor';
			const letter = name.charAt(0) || 'V';
			return (
				<span className="navbar__avatar-circle">{letter.toUpperCase()}</span>
			);
		}

		return <FaUser />;
	};

	const toggleSideMenu = useCallback((e?: React.MouseEvent): void => {
		e?.preventDefault();
		e?.stopPropagation();
		const newState = !sideMenuOpen;
		setSideMenuOpen(newState);
		if (cartOpen) setCartOpen(false);
		if (newState) {
			document.body.classList.add('navbar--menu-open');
		} else {
			document.body.classList.remove('navbar--menu-open');
		}
	}, [cartOpen, setCartOpen, setSideMenuOpen, sideMenuOpen]);

	const toggleCart = (e?: React.MouseEvent): void => {
		e?.preventDefault();
		e?.stopPropagation();
		const newState = !cartOpen;
		setCartOpen(newState);
		if (sideMenuOpen) setSideMenuOpen(false);

		if (newState) {
			document.body.classList.add('no-scroll');
			document.body.classList.add('cart-open');
			document.body.style.overflow = 'hidden';
		} else {
			document.body.classList.remove('no-scroll');
			document.body.classList.remove('cart-open');
			document.body.classList.remove('navbar--menu-open');
			document.body.style.overflow = '';
		}
	};

	const toggleAuthModal = (e?: React.MouseEvent): void => {
		e?.preventDefault();
		setAuthModalOpen(!authModalOpen);
		if (sideMenuOpen) {
			setSideMenuOpen(false);
			document.body.classList.remove('navbar--menu-open');
		}
	};

	const toggleVendorAuthModal = (e?: React.MouseEvent): void => {
		e?.preventDefault();
		setVendorAuthModalOpen(!vendorAuthModalOpen);
		if (sideMenuOpen) {
			setSideMenuOpen(false);
			document.body.classList.remove('navbar--menu-open');
		}
	};

	const showComingSoon = () => {
		setMoreDropdownOpen(false);
		toast('🚀 Coming soon! This feature will be available soon.', {
			icon: '✨',
		});
	};

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent): void => {
			if (
				sideMenuOpen &&
				sideMenuRef.current &&
				!sideMenuRef.current.contains(e.target as Node) &&
				hamburgerRef.current &&
				!hamburgerRef.current.contains(e.target as Node)
			) {
				toggleSideMenu();
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	}, [sideMenuOpen, toggleSideMenu]);

	useEffect(() => {
		const searchRow = document.querySelector('.navbar__search-row');
		// Keep the search row always visible on every breakpoint. Previously it
		// toggled .hidden on scroll for mobile (<=1099px), which made the bar
		// vanish/reappear on every small scroll and felt janky. Removing the
		// hide-on-scroll behaviour keeps it pinned and smooth.
		searchRow?.classList.remove('hidden');

		const handleScroll = (): void => {
			// The dropdown's position is only ever computed relative to the
			// search input at open time — once the page scrolls, that anchor is
			// stale, so close it rather than let it float disconnected from the
			// field it was opened from.
			void searchRow;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
		queryKey: ['placement', PLACEMENTS.MEGA_MENU],
		queryFn: () => fetchPlacementCategories(PLACEMENTS.MEGA_MENU),
		// Always revalidate (the backend has its own 5-minute cache, so this
		// doesn't add real load), plus a bounded poll so an admin arrangement
		// change reaches an already-open tab even if the user never refocuses
		// or remounts it.
		staleTime: 0,
		gcTime: 10 * 60 * 1000,
		refetchInterval: 60 * 1000,
	});

	useEffect(() => {
		if (categoriesData) {
			setCategories(mapToNavCategories(categoriesData));
			setIsCategoriesReady(true);
		}
	}, [categoriesData]);

	const showLoading = isCategoriesLoading || !isCategoriesReady;

	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const handleSetNavbarSearch = (event: CustomEvent) => {
			focusSearch(event.detail?.searchQuery ?? '');
		};

		window.addEventListener('setNavbarSearch', handleSetNavbarSearch as EventListener);
		return () => window.removeEventListener('setNavbarSearch', handleSetNavbarSearch as EventListener);
	}, [focusSearch]);

	useEffect(() => {
		const openGlobalSearch = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const isEditing = target?.matches('input, textarea, select, [contenteditable="true"]');
			if (isEditing) return;
			if ((event.key === 'k' && (event.ctrlKey || event.metaKey)) || event.key === '/') {
				event.preventDefault();
				focusSearch();
			}
		};
		window.addEventListener('keydown', openGlobalSearch);
		return () => window.removeEventListener('keydown', openGlobalSearch);
	}, [focusSearch]);

	const handleSubcategoryClick = (
		categoryId: number,
		subcategoryId: number
	) => {
		setSideMenuOpen(false);
		setActiveDropdown(null);

		unlockBodyScroll();
		setSideMenuOpen(false);
		setCartOpen(false);


		const isOnShopPage = window.location.pathname === '/shop';

		if (isOnShopPage) {
			const newUrl = `/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}`;
			window.history.pushState({}, '', newUrl);

			window.dispatchEvent(
				new CustomEvent('shopFiltersChanged', {
					detail: { categoryId, subcategoryId },
				})
			);
		} else {
			navigate(`/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}`);
		}
	};

	const clearDropdownTimeout = () => {
		if (dropdownTimeoutRef.current) {
			clearTimeout(dropdownTimeoutRef.current);
			dropdownTimeoutRef.current = null;
		}
	};

	const hideDropdownWithDelay = () => {
		dropdownTimeoutRef.current = setTimeout(() => {
			setActiveDropdown(null);
			setDropdownPosition(null);
		}, 150); // 150ms delay
	};

	const renderCategoryDropdown = (category: Category) => {
		if (activeDropdown !== category.id) return null;

		// Subcategories come straight from the MEGA_MENU placement data already
		// loaded into `categories` - not a separate fetch - so the order here is
		// always exactly what's arranged in the admin panel.
		const subcategories: CategoryItem[] = (category.items ?? []).map((item) => ({
			...item,
			link: `/shop?categoryId=${category.id}&subcategoryId=${item.id}`,
		}));

		return (
			<div className="navbar__dropdown-content">
				{subcategories.length > 0 ? (
					subcategories.map((subcategory) => (
						<Link
							key={subcategory.id}
							to={`/shop?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
							className="navbar__dropdown-link"
							onClick={() =>
								handleSubcategoryClick(category.id, subcategory.id)
							}
						>
							{subcategory.name}
						</Link>
					))
				) : (
					<div
						className="navbar__dropdown-link"
						style={{ color: '#666', fontStyle: 'italic' }}
					>
						No subcategories
					</div>
				)}
			</div>
		);
	};

	const handleExpandSideMenuCategory = (categoryId: number) => {
		setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
	};

	const renderSideMenuCategories = () => {
		if (isCategoriesLoading) {
			return (
				<div className="navbar__side-menu-categories">
					{[1, 2, 3].map((index) => (
						<div
							key={index}
							className="navbar__side-menu-category skeleton"
						>
							<div className="skeleton__category"></div>
						</div>
					))}
				</div>
			);
		}

		return (
			<div className="navbar__side-menu-categories">
				{showLoading
					? Array.from({ length: 6 }).map((_, index) => (
						<div
							key={index}
							className="navbar__side-menu-category skeleton"
						>
							<div className="skeleton__category"></div>
						</div>
					))
					: categories.map((category: Category) => (
						<div
							key={category.id}
							className="navbar__side-menu-category"
						>
							<button
								className="navbar__side-menu-category-button"
								onClick={() => handleExpandSideMenuCategory(category.id)}
							>
								<span>{category.name}</span>
								<FaChevronDown
									size={20}
									className={`navbar__side-menu-category-icon ${selectedCategory === category.id
										? 'navbar__side-menu-category-icon--open'
										: ''
										}`}
								/>
							</button>
							{selectedCategory === category.id && (
								<div className="navbar__side-menu-subcategories">
									{category.items.map((subcategory) => (
										<Link
											key={subcategory.id}
											to={`/shop?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
											className="navbar__side-menu-subcategory"
											onClick={(e) => {
												e.preventDefault();
												handleSubcategoryClick(
													category.id,
													subcategory.id
												);
												setSideMenuOpen(false);
											}}
										>
											{subcategory.name}
										</Link>
									))}
								</div>
							)}
						</div>
					))}
			</div>
		);
	};

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const categoryId = params.get('categoryId');
		if (categoryId) {
			setActiveDropdown(Number(categoryId));
		}
	}, [location.search]);

	const handleFullLogout = async () => {
		// Do not clear all browser storage here.
		// Vendor and User auth live side-by-side in localStorage; the respective logout
		// functions should clear only their own keys.
		if (vendorAuthState.isAuthenticated && vendorAuthState.vendor) {
			vendorLogout();
			return;
		}

		userLogout();
	};

	const scrollCategories = (direction: 'left' | 'right') => {
		if (categoriesRef.current) {
			const scrollAmount = 200;
			const newScrollPosition =
				direction === 'left'
					? scrollPosition - scrollAmount
					: scrollPosition + scrollAmount;
			categoriesRef.current.scrollTo({
				left: newScrollPosition,
				behavior: 'smooth',
			});
			setScrollPosition(newScrollPosition);
		}
	};

	const updateScrollPosition = () => {
		if (categoriesRef.current) {
			setScrollPosition(categoriesRef.current.scrollLeft);
		}
	};

	useEffect(() => {
		const categoriesContainer = categoriesRef.current;
		if (categoriesContainer) {
			categoriesContainer.addEventListener('scroll', updateScrollPosition);
			return () =>
				categoriesContainer.removeEventListener('scroll', updateScrollPosition);
		}
	}, []);

	return (
		<nav className="navbar">
			<div className="navbar__container">
				<div className="nav_bar_right">
					{!isLoading && !isVendorAuthenticated && (
						<a
							className="navbar__top-link"
							onClick={toggleVendorAuthModal}
						>
							Vendor Login
						</a>
					)}
					<a
						href="/becomevendor"
						className="navbar__top-link"
					>
						Become a Vendor
					</a>
				</div>
				<div className="navbar__top">
					<div className="navbar__top-row">
						<div className="navbar__logo">
							<Link to="/">
								<img
									src={logo}
									alt="DajuVai"
									className="navbar__logo-img"
								/>
							</Link>
						</div>

						<div className="navbar__mobile-actions">
							<NavLink
								to="/wishlist"
								className="navbar__account-icon-link"
								style={({ isActive }) => ({
									color: isActive ? '#f97316' : 'inherit',
								})}
							>
								<FaHeart />
							</NavLink>
							{/* FIXED: Cart button with proper toggle functionality */}
							<button
								className="navbar__account-icon-link"
								onClick={toggleCart}
								ref={cartButtonRef}
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
								}}
							>
								<FaShoppingCart />
								{cartCount > 0 && (
									<span className="navbar__cart-count navbar__cart-count--mobile">
										{cartCount}
									</span>
								)}
							</button>
							<div
								className="navbar__mobile-user"
								ref={dropdownTriggerRef}
							>
								<div
									className="navbar__mobile-avatar"
									tabIndex={0}
									role="button"
									aria-label="Profile"
									onClick={
										isProfileAuthenticated
											? () => setProfileDropdownOpen((v) => !v)
											: toggleAuthModal
									}
									onKeyDown={(e) => {
										if (
											isProfileAuthenticated &&
											(e.key === 'Enter' || e.key === ' ')
										)
											setProfileDropdownOpen((v) => !v);
										if (
											!isProfileAuthenticated &&
											(e.key === 'Enter' || e.key === ' ')
										) {
											toggleAuthModal({
												preventDefault: () => { },
												stopPropagation: () => { },
											} as unknown as React.MouseEvent);
										}
									}}
									aria-haspopup="true"
									aria-expanded={profileDropdownOpen}
								>
									{getUserAvatar()}
								</div>



							</div>

							<span className="navbar__social-link navbar__social-link--nepal">
								<img
									src={nepal}
									alt="Nepal Flag"
									className="navbar__nepal-flag"
								/>
							</span>
							<button
								className="navbar__hamburger"
								onClick={toggleSideMenu}
								aria-label="Toggle menu"
								aria-expanded={sideMenuOpen}
								ref={hamburgerRef}
							>
								{sideMenuOpen ? <FaTimes /> : <FaBars />}
							</button>
						</div>
					</div>


					{isProfileAuthenticated && profileDropdownOpen && (
						<div
							className="navbar__profile-dropdown-card mobile_drop_down_hide_desktop"
							ref={mobileProfileRef}
							style={{
								zIndex: 999999999,
							}}
							onClick={(e) => {
								//("CLICK REGISTERED INSIDE DROPDOWN");
								e.stopPropagation(); // prevents parent click handlers from blocking
							}}
						>

							<div className="navbar__profile-card-header">
								{getUserAvatar()}
								<div className="navbar__profile-card-info">
									<div className="navbar__profile-card-name">
										{user?.username ||
											user?.email ||
											vendorAuthState.vendor?.businessName ||
											'Vendor'}
									</div>
									{(user?.email || vendorAuthState.vendor?.email) && (
										<div className="navbar__profile-card-email">
											{user?.email || vendorAuthState.vendor?.email}
										</div>
									)}
								</div>
							</div>

							<div className="navbar__profile-card-divider" />

							{user?.role === 'admin' && (
								<NavLink
									to="/admin-dashboard"
									className="navbar__profile-card-link"
									onClick={() => {
										//("Admin Dashboard CLICKED");
										setProfileDropdownOpen(false);
									}}
									style={({ isActive }) => ({
										color: isActive ? '#f97316' : 'inherit',
									})}
								>
									<FaHome className="navbar__profile-card-icon" /> Admin Dashboard
								</NavLink>
							)}

							{user?.role === 'rider' && (
								<NavLink
									to="/rider-delivery"
									className="navbar__profile-card-link"
									onClick={() => {
										setProfileDropdownOpen(false);
									}}
									style={({ isActive }) => ({
										color: isActive ? '#f97316' : 'inherit',
									})}
								>
									<FaHome className="navbar__profile-card-icon" /> Rider Delivery
								</NavLink>
							)}

							{vendorAuthState.isAuthenticated && vendorAuthState.vendor && (
								<NavLink
									to="/dashboard"
									className="navbar__profile-card-link"
									onClick={() => {
										//("Vendor Dashboard CLICKED");
										setProfileDropdownOpen(false);
									}}
									style={({ isActive }) => ({
										color: isActive ? '#f97316' : 'inherit',
									})}
								>
									<FaHome className="navbar__profile-card-icon" /> Vendor Dashboard
								</NavLink>
							)}

							{isAuthenticated && (
								<NavLink
									to="/user-profile"
									className="navbar__profile-card-link"
									onClick={() => setProfileDropdownOpen(false)}
									style={({ isActive }) => ({
										color: isActive ? '#f97316' : 'inherit',
									})}
								>
									<FaCog className="navbar__profile-card-icon" /> Settings
								</NavLink>
							)}

							{!isAuthenticated && isVendorAuthenticated && (
								<NavLink
									to="/vendor-profile"
									className="navbar__profile-card-link"
									onClick={() => setProfileDropdownOpen(false)}
									style={({ isActive }) => ({
										color: isActive ? '#f97316' : 'inherit',
									})}
								>
									<FaCog className="navbar__profile-card-icon" /> Vendor Profile
								</NavLink>
							)}

							<button
								className="navbar__profile-card-link navbar__profile-card-link--logout"
								onClick={(e) => {
									//("LOGOUT BUTTON CLICKED!");
									e.stopPropagation();
									handleFullLogout();
								}}
							>
								<FaSignOutAlt className="navbar__profile-card-icon" /> Log Out
							</button>

						</div>
					)}

					<div className="navbar__search-row">
						<InlineNavbarSearch
							query={searchQuery}
							onQueryChange={setSearchQuery}
							inputRef={searchTriggerRef}
						/>
						{/*
								<input
									ref={searchTriggerRef}
									type="text"
									placeholder="Search products..."
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											void searchQuery;
										}
									}}
									onFocus={() => {
										if (skipSearchTriggerFocusRef.current) {
											skipSearchTriggerFocusRef.current = false;
											return;
										}
										// Scroll dismisses the dropdown, but the query and its
										// results are still sitting in state — re-clicking the
										// field should bring the same list straight back instead
										// of forcing the user to retype to see it again.
										void searchQuery;
									}}
									className="navbar__search-input"
									autoComplete="off"
									style={{
										outline: 'none',
									}}
								/>
								<button
									type="submit"
									className="navbar__search-button"
								>
									<FaSearch />
								</button>
							</form>*/}
						</div>

					<div className="navbar__desktop-links">
						<div className="navbar__links">
							<NavLink
								to="/"
								className={({ isActive }) =>
									`navbar__link${isActive ? ' active' : ''}`
								}
								end
								style={({ isActive }) => ({
									color: isActive ? '#f97316' : 'inherit',
								})}
							>
								Home
							</NavLink>
							<NavLink
								to="/shop"
								className={({ isActive }) =>
									`navbar__link${isActive ? ' active' : ''}`
								}
								style={({ isActive }) => ({
									color: isActive ? '#f97316' : 'inherit',
								})}
							>
								Shop
							</NavLink>

							<NavLink
								to="/contact"
								className={({ isActive }) =>
									`navbar__link${isActive ? ' active' : ''}`
								}
								style={({ isActive }) => ({
									color: isActive ? '#f97316' : 'inherit',
								})}
							>
								Contact <span className="navbar__link-icon"></span>
							</NavLink>

							<div
								className="navbar__more-dropdown"
								ref={moreDropdownRef}
							>
								<button
									className="navbar__link navbar__more-trigger"
									onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
									style={{
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										fontSize: '16px',
										color: '#42504b',
										display: 'flex',
										alignItems: 'center',
										gap: '5px',
									}}
								>
									More <FaChevronDown size={12} />
								</button>
								{moreDropdownOpen && (
									<div className="navbar__more-dropdown-content">
										<button
											className="navbar__more-dropdown-link"
											onClick={showComingSoon}
											style={{
												cursor: 'pointer',
											}}
										>
											DajuVai Rental
										</button>
										<button
											className="navbar__more-dropdown-link"
											onClick={showComingSoon}
										>
											DajuVai Services
										</button>
									</div>
								)}
							</div>
						</div>

						<div className="navbar__account">
							{/* FIXED: Desktop cart button with proper toggle functionality */}
							<button
								className="navbar__account-link tooltip"
								onClick={toggleCart}
								ref={cartButtonRef}
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
								}}
							>
								<FaShoppingCart
									className="navbar__account-icon"
									style={{
										fontSize: '24px',
									}}
								/>

								{cartCount > 0 && (
									<span className="navbar__cart-count">{cartCount}</span>
								)}

								<span className="tooltip-text">View Cart</span>
							</button>

							<div
								className="navbar__user-profile"
								ref={dropdownTriggerRef}
							>
								<div
									className="navbar__user-avatar tooltip"
									tabIndex={0}
									onClick={
										isProfileAuthenticated
											? () => setProfileDropdownOpen((v) => !v)
											: toggleAuthModal
									}
									onKeyDown={(e) => {
										if (
											isProfileAuthenticated &&
											(e.key === 'Enter' || e.key === ' ')
										)
											setProfileDropdownOpen((v) => !v);
										if (
											!isProfileAuthenticated &&
											(e.key === 'Enter' || e.key === ' ')
										) {
											toggleAuthModal({
												preventDefault: () => { },
												stopPropagation: () => { },
											} as unknown as React.MouseEvent);
										}
									}}
									aria-haspopup="true"
									aria-expanded={profileDropdownOpen}
									role="button"
									aria-label="Profile"
								>
									{getUserAvatar()}
									<span className="tooltip-text">
										{isProfileAuthenticated ? 'Profile' : 'Login'}
									</span>
								</div>
								{isProfileAuthenticated && profileDropdownOpen && (
									<div
										className="navbar__profile-dropdown-card"
										ref={profileRef}
										style={{
											position: 'absolute',
											top: 'calc(100% + 10px)',
											right: 0,
											zIndex: 99999999999999,
										}}
									>
										<div className="navbar__profile-card-header">
											{getUserAvatar()}
											<div className="navbar__profile-card-info">
												<div className="navbar__profile-card-name">
													{user?.username ||
														user?.email ||
														vendorAuthState.vendor?.businessName ||
														'Vendor'}
												</div>
												{(user?.email || vendorAuthState.vendor?.email) && (
													<div className="navbar__profile-card-email">
														{user?.email || vendorAuthState.vendor?.email}
													</div>
												)}
											</div>
										</div>
										<div className="navbar__profile-card-divider" />
										{user?.role === 'admin' && (
											<NavLink
												to="/admin-dashboard"
												className="navbar__profile-card-link"
												onClick={() => setProfileDropdownOpen(false)}
												style={({ isActive }) => ({
													color: isActive ? '#f97316' : 'inherit',
												})}
											>
												<FaHome className="navbar__profile-card-icon" /> Admin
												Dashboard
											</NavLink>
										)}
										{user?.role === 'rider' && (
											<NavLink
												to="/rider-delivery"
												className="navbar__profile-card-link"
												onClick={() => setProfileDropdownOpen(false)}
												style={({ isActive }) => ({
													color: isActive ? '#f97316' : 'inherit',
												})}
											>
												<FaHome className="navbar__profile-card-icon" /> Rider Delivery
											</NavLink>
										)}
										{vendorAuthState.isAuthenticated &&
											vendorAuthState.vendor && (
												<NavLink
													to="/dashboard"
													className="navbar__profile-card-link"
													onClick={() => setProfileDropdownOpen(false)}
													style={({ isActive }) => ({
														color: isActive ? '#f97316' : 'inherit',
													})}
												>
													<FaHome className="navbar__profile-card-icon" />{' '}
													Vendor Dashboard
												</NavLink>
											)}
										{isAuthenticated && (
											<NavLink
												to="/user-profile"
												className="navbar__profile-card-link"
												onClick={() => setProfileDropdownOpen(false)}
												style={({ isActive }) => ({
													color: isActive ? '#f97316' : 'inherit',
												})}
											>
												<FaCog className="navbar__profile-card-icon" /> Settings
											</NavLink>
										)}

										{!isAuthenticated && isVendorAuthenticated && (
											<NavLink
												to="/vendor-profile"
												className="navbar__profile-card-link"
												onClick={() => setProfileDropdownOpen(false)}
												style={({ isActive }) => ({
													color: isActive ? '#f97316' : 'inherit',
												})}
											>
												<FaCog className="navbar__profile-card-icon" /> Vendor Profile
											</NavLink>
										)}
										<button
											className="navbar__profile-card-link navbar__profile-card-link--logout"
											onClick={handleFullLogout}
										>
											<FaSignOutAlt className="navbar__profile-card-icon" /> Log
											Out
										</button>
									</div>
								)}
							</div>

							<NavLink
								to="/wishlist"
								className="navbar__account-icon-link tooltip tooltip_wishlist"
								style={({ isActive }) => ({
									color: isActive ? '#f97316' : 'inherit',
								})}
							>
								<FaHeart />
								<span className="tooltip-text">Wishlist</span>
							</NavLink>
						</div>
					</div>

					<div className="nepal-flag">
						<span className="navbar__social-link navbar__social-link--nepal">
							<img
								src={nepal}
								alt="Nepal Flag"
								className="navbar__nepal-flag"
							/>
						</span>
					</div>
				</div>

				<div
					className={`navbar__side-menu ${sideMenuOpen ? 'navbar__side-menu--open' : ''
						}`}
					ref={sideMenuRef}
				>
					<div className="navbar__side-menu-header">
						<button
							className="navbar__side-menu-close"
							onClick={toggleSideMenu}
							aria-label="Close menu"
						>
							<FaTimes />
						</button>
						<h3 className="navbar__side-menu-title">Menu</h3>
					</div>
					<div className="navbar__side-menu-category">
						{!isLoading && !isVendorAuthenticated && (
							<a
								href="/vendor-login"
								className="navbar__side-menu-category-button"
								onClick={toggleVendorAuthModal}
							>
								Vendor Login
							</a>
						)}
						<a
							href="/becomevendor"
							className="navbar__side-menu-category-button"
						>
							Become a Vendor
						</a>
						<button
							className="navbar__side-menu-category-button"
							onClick={() => setSideMoreOpen(!sideMoreOpen)}
							aria-expanded={sideMoreOpen}
						>
							<span>More</span>
							<FaChevronDown
								size={20}
								className={`navbar__side-menu-category-icon ${sideMoreOpen ? 'navbar__side-menu-category-icon--open' : ''
									}`}
							/>
						</button>
						{sideMoreOpen && (
							<div className="navbar__side-menu-subcategories">
								<div
									className="navbar__side-menu-subcategory"
									style={{ cursor: 'pointer' }}
									onClick={(e) => {
										e.preventDefault();
										showComingSoon();
										setSideMenuOpen(false);
									}}
								>
									DajuVai Rental
								</div>
								<div
									className="navbar__side-menu-subcategory"
									style={{ cursor: 'pointer' }}
									onClick={(e) => {
										e.preventDefault();
										showComingSoon();
										setSideMenuOpen(false);
									}}
								>
									DajuVai Services
								</div>
							</div>
						)}
					</div>

					{renderSideMenuCategories()}

					<div className="navbar__side-menu-social">
						<h3 className="navbar__side-menu-subtitle">Follow Us</h3>
						<div className="navbar__side-menu-social-icons">
							<a
								href="https://www.facebook.com/profile.php?id=61585172477778"
								target="_blank"
								rel="noopener noreferrer"
								className="navbar__social-link navbar__social-link--facebook"
							>
								<FaFacebook />
							</a>
							<a
								href="https://www.instagram.com/dajuvaionline/"
								target="_blank"
								rel="noopener noreferrer"
								className="navbar__social-link navbar__social-link--instagram"
							>
								<FaInstagram />
							</a>
							<a
								href="https://www.youtube.com/@dajuvaionline"
								target="_blank"
								rel="noopener noreferrer"
								className="navbar__social-link navbar__social-link--youtube"
							>
								<FaYoutube />
							</a>
							<a
								href="https://www.tiktok.com/@www.dajuvai.com"
								target="_blank"
								rel="noopener noreferrer"
								className="navbar__social-link navbar__social-link--tiktok"
							>
								<FaTiktok />
							</a>
							<a
								href="https://wa.me/9779700620004"
								target="_blank"
								rel="noopener noreferrer"
								className="navbar__social-link navbar__social-link--whatsapp"
							>
								<FaWhatsapp />
							</a>
						</div>
					</div>
				</div>

				<Cart
					cartOpen={cartOpen}
					toggleCart={toggleCart}
					cartButtonRef={cartButtonRef}
					stableCartItems={stableCartItems}
				/>

				<div
					className={`navbar__overlay ${sideMenuOpen || cartOpen ? 'navbar__overlay--visible' : ''
						}`}
					onClick={() => {
						setSideMenuOpen(false);
						setCartOpen(false);
						document.body.classList.remove('navbar--menu-open');
						document.body.classList.remove('no-scroll');
						document.body.classList.remove('cart-open');
						document.body.style.overflow = '';
					}}
				></div>

				<div className="navbar__bottom">
					<div className="navbar__categories-container">
						<button
							className="navbar__category-nav navbar__category-nav--left"
							onClick={() => scrollCategories('left')}
							disabled={scrollPosition <= 0}
						>
							<FaChevronLeft />
						</button>
						<div
							className="navbar__categories"
							ref={categoriesRef}
						>
							{categories.map((category) => (
								<div
									key={category.id}
									ref={(el) => {
										categoryRefs.current[category.id] = el;
									}}
									className={`navbar__category${activeDropdown === category.id ? ' active' : ''
										}`}
									onMouseEnter={() => {
										clearDropdownTimeout();
										setActiveDropdown(category.id);
										const element = categoryRefs.current[category.id];
										if (element) {
											const rect = element.getBoundingClientRect();

											const adjustedLeft = rect.left + window.scrollX;
											const adjustedTop = rect.bottom + window.scrollY;

											setDropdownPosition({
												top: adjustedTop,
												left: adjustedLeft,
											});
										}
									}}
									onMouseLeave={() => {
										hideDropdownWithDelay();
									}}
								>
									<div className="navbar__category-link">
										{category.name}
										<FaChevronDown
											size={16}
											className={`navbar__category-icon ${activeDropdown === category.id
												? 'navbar__category-icon--active'
												: ''
												}`}
										/>
									</div>
								</div>
							))}
						</div>
						<button
							className="navbar__category-nav navbar__category-nav--right"
							onClick={() => scrollCategories('right')}
							disabled={
								categoriesRef.current &&
								scrollPosition >=
								categoriesRef.current.scrollWidth -
								categoriesRef.current.clientWidth
							}
						>
							<FaChevronRight />
						</button>
					</div>

					<div className="navbar__social navbar__social--desktop">
						<a
							href="https://www.facebook.com/profile.php?id=61585172477778"
							target="_blank"
							rel="noopener noreferrer"
							className="navbar__social-link navbar__social-link--facebook"
						>
							<FaFacebook />
						</a>
						<a
							href="https://www.instagram.com/dajuvaionline/"
							target="_blank"
							rel="noopener noreferrer"
							className="navbar__social-link navbar__social-link--instagram"
						>
							<FaInstagram />
						</a>
						<a
							href="https://www.youtube.com/@dajuvaionline"
							target="_blank"
							rel="noopener noreferrer"
							className="navbar__social-link navbar__social-link--youtube"
						>
							<FaYoutube />
						</a>
						<a
							href="https://www.tiktok.com/@www.dajuvai.com"
							target="_blank"
							rel="noopener noreferrer"
							className="navbar__social-link navbar__social-link--tiktok"
						>
							<FaTiktok />
						</a>
						<a
							href="https://wa.me/9779700620004"
							target="_blank"
							rel="noopener noreferrer"
							className="navbar__social-link navbar__social-link--whatsapp"
						>
							<FaWhatsapp />
						</a>
					</div>
				</div>
			</div>

			<div className="navbar__mobile-dock">
				<NavLink
					to="/"
					className="navbar__mobile-dock-item"
					end
					style={({ isActive }) => ({
						color: isActive ? '#f97316' : 'inherit',
					})}
				>
					<span className="navbar__mobile-dock-icon">
						<FaHome />
					</span>
					<span className="navbar__mobile-dock-text">Home</span>
				</NavLink>
				<NavLink
					to="/shop"
					className="navbar__mobile-dock-item"
					style={({ isActive }) => ({
						color: isActive ? '#f97316' : 'inherit',
					})}
				>
					<span className="navbar__mobile-dock-icon">
						<FaShoppingBag />
					</span>
					<span className="navbar__mobile-dock-text">Shop</span>
				</NavLink>
				<NavLink
					to="/contact"
					className="navbar__mobile-dock-item"
					style={({ isActive }) => ({
						color: isActive ? '#f97316' : 'inherit',
					})}
				>
					<span className="navbar__mobile-dock-icon">
						<FaInfoCircle />
					</span>
					<span className="navbar__mobile-dock-text">Contact</span>
				</NavLink>
				<NavLink
					to="/wishlist"
					className="navbar__mobile-dock-item"
					style={({ isActive }) => ({
						color: isActive ? '#f97316' : 'inherit',
					})}
				>
					<span className="navbar__mobile-dock-icon">
						<FaHeart />
					</span>
					<span className="navbar__mobile-dock-text">Wishlist</span>
				</NavLink>
			</div>

			<AuthModal
				isOpen={authModalOpen}
				onClose={() => setAuthModalOpen(false)}
			/>
			<VendorLogin
				isOpen={vendorAuthModalOpen}
				onClose={() => setVendorAuthModalOpen(false)}
			/>
			{activeDropdown && dropdownPosition && (
				<div
					className="navbar__dropdown-portal"
					style={{
						position: 'absolute',
						top: dropdownPosition.top,
						left: dropdownPosition.left,
						zIndex: 9999,
					}}
					onMouseEnter={() => {
						clearDropdownTimeout();
					}}
					onMouseLeave={() => {
						hideDropdownWithDelay();
					}}
				>
					{renderCategoryDropdown(
						categories.find((cat) => cat.id === activeDropdown)!
					)}
				</div>
			)}
		</nav>
	);
};

export default Navbar;
