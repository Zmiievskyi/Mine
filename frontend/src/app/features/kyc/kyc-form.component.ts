import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
  OnInit,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { KycService } from '../../core/services/kyc.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  AccountType,
  SubmitKycDto,
  KycStatusResponse,
} from '../../core/models/kyc.model';

@Component({
  selector: 'app-kyc-form',
  standalone: true,
  imports: [
    FormsModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmSelectImports,
    BrnSelectImports,
  ],
  templateUrl: './kyc-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KycFormComponent implements OnInit {
  private readonly kycService = inject(KycService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  // Form state
  protected readonly loading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploadedFileUrl = signal<string | null>(null);

  // Form data - accountType as signal for reactivity
  protected readonly accountType = signal<AccountType>('individual');
  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected countryOfResidence = '';
  protected address = '';
  protected companyName = '';
  protected companyAddress = '';
  protected companyRegistrationNumber = '';
  protected companyVatNumber = '';
  protected companyRepresentativeName = '';
  protected hasParentCompanyAbroad: boolean | undefined = undefined;
  protected marketingConsent = false;

  // Computed properties
  protected readonly isCompanyAccount = computed(() => this.accountType() === 'company');
  protected readonly canSubmit = computed(() => !this.loading() && !this.uploading());
  protected readonly selectedFileName = computed(() => {
    const file = this.selectedFile();
    return file ? file.name : null;
  });

  public ngOnInit(): void {
    this.checkExistingKycStatus();
    this.prefillUserData();
  }

  private checkExistingKycStatus(): void {
    this.kycService
      .getKycStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: KycStatusResponse) => {
          if (response.status !== 'not_submitted') {
            this.notificationService.info(
              `You already have a KYC submission with status: ${response.status}`
            );
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          // Ignore error - user probably hasn't submitted KYC yet
        },
      });
  }

  private prefillUserData(): void {
    const user = this.authService.currentUser;
    if (user?.email) {
      this.email = user.email;
      if (user.name) {
        const nameParts = user.name.split(' ');
        this.firstName = nameParts[0] || '';
        this.lastName = nameParts.slice(1).join(' ') || '';
      }
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.error.set('Only PDF, JPG, and PNG files are allowed');
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.error.set('File size must be less than 10MB');
        return;
      }

      this.selectedFile.set(file);
      this.error.set(null);
      this.uploadFile(file);
    }
  }

  protected removeFile(): void {
    this.selectedFile.set(null);
    this.uploadedFileUrl.set(null);
    // Reset file input so same file can be re-selected
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private uploadFile(file: File): void {
    this.uploading.set(true);
    this.error.set(null);

    this.kycService
      .uploadDocument(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.uploadedFileUrl.set(response.url);
          this.uploading.set(false);
          this.notificationService.success('Document uploaded successfully');
        },
        error: (err) => {
          this.uploading.set(false);
          this.selectedFile.set(null);
          this.error.set(err.error?.message || 'Failed to upload document');
          this.notificationService.error('Failed to upload document');
        },
      });
  }

  protected onAccountTypeChange(type: AccountType): void {
    this.accountType.set(type);
    // Reset company fields when switching to individual
    if (type === 'individual') {
      this.companyName = '';
      this.companyAddress = '';
      this.companyRegistrationNumber = '';
      this.companyVatNumber = '';
      this.companyRepresentativeName = '';
      this.hasParentCompanyAbroad = undefined;
    }
  }

  protected onParentCompanyChange(value: string): void {
    this.hasParentCompanyAbroad = value === 'yes' ? true : value === 'no' ? false : undefined;
  }

  protected onSubmit(): void {
    this.error.set(null);

    // Validate required fields
    if (!this.firstName || !this.lastName || !this.email) {
      this.error.set('Please fill in all personal information fields');
      return;
    }

    if (!this.countryOfResidence || !this.address) {
      this.error.set('Please fill in your residence information');
      return;
    }

    // Validate company fields if account type is company
    if (this.accountType() === 'company') {
      if (!this.companyName || !this.companyAddress || !this.companyRegistrationNumber) {
        this.error.set('Please fill in all required company information fields');
        return;
      }

      if (this.hasParentCompanyAbroad === undefined) {
        this.error.set('Please indicate if your company has a parent company abroad');
        return;
      }
    }

    // Validate document upload
    if (!this.uploadedFileUrl()) {
      this.error.set('Please upload a residency document');
      return;
    }

    this.loading.set(true);

    const kycData: SubmitKycDto = {
      accountType: this.accountType(),
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      countryOfResidence: this.countryOfResidence,
      address: this.address,
      marketingConsent: this.marketingConsent,
      residencyDocumentUrl: this.uploadedFileUrl() || undefined,
    };

    // Add company fields if applicable
    if (this.accountType() === 'company') {
      kycData.companyName = this.companyName;
      kycData.companyAddress = this.companyAddress;
      kycData.companyRegistrationNumber = this.companyRegistrationNumber;
      kycData.companyVatNumber = this.companyVatNumber || undefined;
      kycData.companyRepresentativeName = this.companyRepresentativeName || undefined;
      kycData.hasParentCompanyAbroad = this.hasParentCompanyAbroad;
    }

    this.kycService
      .submitKyc(kycData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.notificationService.success(
            'KYC verification submitted successfully. We will review your information shortly.'
          );
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Failed to submit KYC verification');
          this.notificationService.error('Failed to submit KYC verification');
        },
      });
  }
}
