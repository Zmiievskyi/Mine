export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';
export type AccountType = 'individual' | 'company';

export interface KycData {
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  countryOfResidence: string;
  address: string;
  companyName?: string;
  companyAddress?: string;
  companyRegistrationNumber?: string;
  companyVatNumber?: string;
  companyRepresentativeName?: string;
  hasParentCompanyAbroad?: boolean;
  residencyDocumentUrl?: string;
  marketingConsent: boolean;
}

export interface KycStatusResponse {
  status: KycStatus;
  data: KycData | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
}

export interface SubmitKycDto {
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  countryOfResidence: string;
  address: string;
  companyName?: string;
  companyAddress?: string;
  companyRegistrationNumber?: string;
  companyVatNumber?: string;
  companyRepresentativeName?: string;
  hasParentCompanyAbroad?: boolean;
  residencyDocumentUrl?: string;
  marketingConsent: boolean;
}

export interface FileUploadResponse {
  url: string;
  key: string;
}
