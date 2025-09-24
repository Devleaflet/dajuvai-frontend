import React from "react";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
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

	return (
		<div className="vendor-product__pagination">
			<div className="vendor-product__pagination-info">
				Page {currentPage} of {totalPages}
			</div>

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
