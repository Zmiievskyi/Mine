import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Footer component for MineGNK landing page
 *
 * Features:
 * - Giant "MINEGNK" text with outline-only styling (text-stroke)
 * - Dark background with subtle gradient overlay
 * - Large typography for brand impact (15-20vw font size)
 * - Optional copyright text at bottom
 * - Responsive scaling for mobile devices
 *
 * Design:
 * - Very large, bold, outline-only text that spans the width
 * - Minimal distraction, maximum brand presence
 * - Dark theme consistent with landing page
 *
 * Usage:
 * <app-footer />
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
