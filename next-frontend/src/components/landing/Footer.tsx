import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function Footer() {
  const t = await getTranslations('footer');
  const currentYear = new Date().getFullYear();

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
              {t('brand.name')}
              <span className="bg-gradient-to-r from-[#FF4C00] to-[#FF7A45] bg-clip-text text-transparent">
                {t('brand.highlight')}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('brand.description')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              {t('product.title')}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('product.features')}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('product.pricing')}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              {t('resources.title')}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('resources.howItWorks')}
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('resources.faq')}
                </a>
              </li>
              <li>
                <a
                  href="https://gonka.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('resources.gonkaNetwork')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">{t('legal.title')}</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://gcore.com/legal?tab=privacy_policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('legal.privacyPolicy')}
                </a>
              </li>
              <li>
                <a
                  href="https://gcore.com/legal?tab=terms_of_service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('legal.termsOfService')}
                </a>
              </li>
              <li>
                <Link
                  href="/terms/gonka"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('legal.gpuTermsGonka')}
                </Link>
              </li>
              <li>
                <a
                  href="https://gcore.com/legal?tab=dpa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('legal.dpa')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {currentYear} {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
