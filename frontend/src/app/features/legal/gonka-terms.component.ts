import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * GPU Terms for Gonka AI page
 *
 * Displays the terms and conditions specific to GPU Compute for Gonka AI.
 * Links to Gcore's main legal documents for general terms.
 *
 * Dark theme styling consistent with landing page.
 */
@Component({
  selector: 'app-gonka-terms',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './gonka-terms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GonkaTermsComponent {
  protected readonly documentVersion = '11 Dec 2025';

  protected readonly gcoreLegalLinks = [
    {
      name: 'Master Services Agreement',
      url: 'https://gcore.com/legal?tab=terms_of_service',
    },
    {
      name: 'Acceptable Use Policy',
      url: 'https://gcore.com/legal?tab=acceptable_use_policy',
    },
    {
      name: 'Copyright Policy',
      url: 'https://gcore.com/legal?tab=copyright_policy',
    },
    {
      name: 'Privacy Policy',
      url: 'https://gcore.com/legal?tab=privacy_policy',
    },
    {
      name: 'Service Level Agreements',
      url: 'https://gcore.com/legal?tab=sla',
    },
  ];

  protected readonly gonkaLicenseUrl =
    'https://github.com/gonka-ai/gonka?tab=License-1-ov-file';
}
