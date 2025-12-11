export enum KycStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum AccountType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export interface KycData {
  // Common fields
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  countryOfResidence: string;
  address: string;

  // Company-specific fields (optional for individuals)
  companyName?: string;
  companyAddress?: string;
  companyRegistrationNumber?: string;
  companyVatNumber?: string;
  companyRepresentativeName?: string;
  hasParentCompanyAbroad?: boolean;

  // File reference
  residencyDocumentUrl?: string;

  // Marketing consent
  marketingConsent: boolean;
}
