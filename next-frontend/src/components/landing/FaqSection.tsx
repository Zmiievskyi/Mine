import { getTranslations } from 'next-intl/server';
import { validateQuestionAnswer } from '@/lib/validation';

export async function FaqSection() {
  const t = await getTranslations('faq');
  const faqs = validateQuestionAnswer(t.raw('items'));

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <div className="scroll-reveal text-center mb-12">
          <span className="inline-flex items-center justify-center rounded-full border border-accent/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
            {t('badge')}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold font-heading">
            {t('title')}
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="scroll-reveal rounded-xl border border-border bg-card/30 p-6"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {faq.question}
              </h3>
              <p className="text-muted-foreground text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
