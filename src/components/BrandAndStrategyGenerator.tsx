import React from 'react';
import { Language, UserProfile } from '../types';
import BrandIdentityGenerator from './BrandIdentityGenerator';
import BrandStrategyGenerator from './BrandStrategyGenerator';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
}

export default function BrandAndStrategyGenerator({ language, user, onDeductCredits, onOpenLogin }: Props) {
  const isAr = language === 'ar';

  return (
    <div className="space-y-16 pb-20">
      {/* Brand Identity Section */}
      <section>
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            {isAr ? 'توليد الهوية التجارية' : 'Generate Brand Identity'}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {isAr 
              ? 'احصل على هوية بصرية ولفظية متكاملة لعلامتك التجارية.'
              : 'Get a complete visual and verbal identity for your brand.'}
          </p>
        </div>
        <BrandIdentityGenerator 
          language={language} 
          user={user} 
          onDeductCredits={onDeductCredits} 
          onOpenLogin={onOpenLogin} 
        />
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800" />

      {/* Brand Strategy Section */}
      <section>
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight">
            {isAr ? 'توليد الاستراتيجية' : 'Generate Brand Strategy'}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {isAr 
              ? 'خطط لنمو علامتك التجارية باستخدام استراتيجية احترافية مخصصة.'
              : 'Plan your brand\'s growth with a customized professional strategy.'}
          </p>
        </div>
        <BrandStrategyGenerator 
          language={language} 
          user={user} 
          onDeductCredits={onDeductCredits} 
          onOpenLogin={onOpenLogin} 
        />
      </section>
    </div>
  );
}
