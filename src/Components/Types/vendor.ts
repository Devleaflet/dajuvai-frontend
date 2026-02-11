export type PaymentType = "ESEWA" | "KHALTI" | "IMEPAY" | "FONEPAY" | "NPS";

export interface PaymentOption {
	id: number;
	paymentType: PaymentType;
	details: {
		walletNumber?: string;
		accountNumber?: string;
		bankName?: string;
		accountName?: string;
		branch?: string;
	};
	qrCodeImage?: string | null;
	isActive: boolean;
}

export interface PaymentOptionInput {
	paymentType: PaymentType;
	details: {
		walletNumber?: string;
		accountNumber?: string;
		bankName?: string;
		accountName?: string;
		branch?: string;
	};
	qrCodeImage?: string | null;
	isActive?: boolean;
}

export interface Vendor {
	id: number;
	businessName: string;
	email: string;
	businessAddress?: string;
	phoneNumber: string;
	telePhone?: string;
	profilePicture?: string;
	taxNumber?: string;
	taxDocuments: string[] | null;
	businessRegNumber?: string;
	citizenshipDocuments: string[] | null;
	chequePhoto: string[] | null;
	accountName?: string;
	bankName?: string;
	accountNumber?: string;
	bankBranch?: string;
	bankCode?: string;
	verificationCode: string | null;
	verificationCodeExpire: string | null;
	isVerified: boolean;
	isApproved: boolean | null;
	resetToken: string | null;
	resetTokenExpire: string | null;
	resendCount: number;
	resendBlockUntil: string | null;
	createdAt: string;
	updatedAt: string;
	district: District;
	status: "Active" | "Inactive";
	paymentOptions?: PaymentOption[];
}

export interface VendorSignupRequest {
	businessName: string;
	email: string;
	password: string;
	phoneNumber: string;
	telePhone?: string;
	district: string;
	taxNumber: string;
	taxDocuments: string[];
	businessRegNumber: string;
	citizenshipDocuments?: string[] | null;
	chequePhoto?: string;
	paymentOptions?: PaymentOptionInput[];
}

export interface VendorLoginRequest {
	email: string;
	password: string;
}

export interface VendorUpdateRequest {
	id: number;
	businessName?: string;
	phoneNumber?: string;
	telePhone?: string;
	isVerified?: boolean;
	districtId?: number;
	district?: string;
	taxNumber?: string;
	taxDocuments?: string[] | null;
	businessRegNumber?: string;
	citizenshipDocuments?: string[] | null;
	chequePhoto?: string | null;
	accountName?: string;
	bankName?: string;
	accountNumber?: string;
	bankBranch?: string;
	bankCode?: string;
	businessAddress?: string;
	profilePicture?: string;
	paymentOptions?: PaymentOptionInput[];
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	vendor?: T;
	message?: string;
	errors?: { path: string[]; message: string }[];
	token?: string;
}

export interface District {
	id: number;
	name: string;
}
