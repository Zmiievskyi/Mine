'use client';

import { Link } from '@/i18n/navigation';

interface FooterProps {
  onSectionClick: (sectionId: string) => void;
}

export function Footer({ onSectionClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    onSectionClick(sectionId);
  };

  return (
    <footer className="relative border-t border-border py-12">
      {/* Background brand text */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-[0.03]">
        <span className="text-[20vw] font-bold tracking-tighter text-foreground whitespace-nowrap">
          MINEGNK
        </span>
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold mb-4">
              Mine
              <span className="bg-gradient-to-r from-[#FF4C00] to-[#FF7A45] bg-clip-text text-transparent">
                GNK
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Professional GPU mining infrastructure for the Gonka network. Earn
              GNK tokens with enterprise-grade hosting and monitoring.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleClick(e, '#features')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleClick(e, '#pricing')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleClick(e, '#how-it-works')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleClick(e, '#faq')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="https://gonka.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Gonka Network
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://gcore.com/legal?tab=privacy_policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://gcore.com/legal?tab=terms_of_service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <Link
                  href="/terms/gonka"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GPU Terms for Gonka
                </Link>
              </li>
              <li>
                <a
                  href="https://gcore.com/legal?tab=dpa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Data Processing Agreement
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {currentYear} MineGNK
          </p>
        </div>
      </div>
    </footer>
  );
}
