import React from "react";

export const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	/** Optional — when provided (with onPageSizeChange), renders a "Rows per
	 * page" selector and a "Showing X-Y of Z" summary next to the controls. */
	pageSize?: number;
	onPageSizeChange?: (size: number) => void;
	totalItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	pageSize,
	onPageSizeChange,
	totalItems,
}) => {
	if (totalPages <= 0) return null;

	const getPageNumbers = (): (number | string)[] => {
		const pageNumbers: (number | string)[] = [];

		if (totalPages <= 7) {
			// Show all pages
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			// Always include first page
			pageNumbers.push(1);

			// Calculate middle section
			let startPage, endPage;

			if (currentPage <= 4) {
				startPage = 2;
				endPage = Math.min(5, totalPages - 1);
				for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
				if (endPage < totalPages - 1) pageNumbers.push("...");
			} else if (currentPage >= totalPages - 3) {
				startPage = totalPages - 4;
				endPage = totalPages - 1;
				if (startPage > 1) pageNumbers.push("...");
				for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
			} else {
				pageNumbers.push("...");
				pageNumbers.push(currentPage - 1, currentPage, currentPage + 1);
				if (currentPage + 1 < totalPages - 1) pageNumbers.push("...");
			}

			// Always include last page
			pageNumbers.push(totalPages);
		}

		return pageNumbers;
	};

	const rangeStart = pageSize && totalItems ? (currentPage - 1) * pageSize + 1 : null;
	const rangeEnd = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

	return (
		<div className="vendor-product__pagination" style={{ flexWrap: "wrap", gap: 12 }}>
			<div className="vendor-product__pagination-info">
				{rangeStart != null && rangeEnd != null && totalItems != null
					? `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`
					: `Page ${currentPage} of ${totalPages}`}
			</div>

			{pageSize != null && onPageSizeChange && (
				<label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
					Rows per page:
					<select
						value={pageSize}
						onChange={(e) => onPageSizeChange(Number(e.target.value))}
						style={{ padding: "4px 8px" }}
					>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<option key={size} value={size}>{size}</option>
						))}
					</select>
				</label>
			)}

			<div style={{ display: "flex", gap: "8px" }}>
				<button
					className="vendor-product__pagination-btn vendor-product__pagination-prev"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
				>
					<span className="vendor-product__prev-icon"></span>
					Previous
				</button>

				<div className="vendor-product__pagination-pages">
					{getPageNumbers().map((page, index) =>
						page === "..." ? (
							<span
								key={`ellipsis-${index}`}
								className="vendor-product__pagination-ellipsis"
							>
								...
							</span>
						) : (
							<button
								key={page}
								className={`vendor-product__pagination-page ${
									page === currentPage
										? "vendor-product__pagination-page--active"
										: ""
								}`}
								onClick={() => onPageChange(page as number)}
							>
								{page}
							</button>
						)
					)}
				</div>

				<button
					className="vendor-product__pagination-btn vendor-product__pagination-next"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					Next
					<span className="vendor-product__next-icon"></span>
				</button>
			</div>
		</div>
	);
};

export default Pagination;
