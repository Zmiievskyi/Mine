import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  @Input() revealDelay = 0;
  @Input() revealThreshold = 0.1;

  private observer: IntersectionObserver | null = null;
  private hasRevealed = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      this.el.nativeElement.classList.add('reveal-visible');
      return;
    }

    // Set initial hidden state
    this.el.nativeElement.classList.add('reveal-hidden');

    // Create observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasRevealed) {
            this.reveal();
          }
        });
      },
      { threshold: this.revealThreshold }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private reveal(): void {
    this.hasRevealed = true;

    setTimeout(() => {
      this.el.nativeElement.classList.remove('reveal-hidden');
      this.el.nativeElement.classList.add('reveal-visible');
    }, this.revealDelay);

    // Stop observing after reveal
    if (this.observer) {
      this.observer.unobserve(this.el.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
