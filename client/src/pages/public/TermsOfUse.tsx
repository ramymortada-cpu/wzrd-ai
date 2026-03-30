import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { useI18n } from '@/lib/i18n';

export default function TermsOfUse() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const lastUpdated = '١ أبريل ٢٠٢٥';
  const lastUpdatedEn = 'April 1, 2025';

  return (
    <div className="wzrd-public-page min-h-screen">
      <WzrdPublicHeader />

      <div className="mx-auto max-w-3xl px-6 pb-20 pt-24">
        {/* Header */}
        <div className="mb-10 border-b border-[#E5E7EB] pb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-1.5">
            <span className="text-xs font-bold text-[#1B4FD8]">
              {isAr ? 'وثيقة قانونية' : 'Legal Document'}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-black text-[#111827]">
            {isAr ? 'شروط الاستخدام' : 'Terms of Use'}
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdatedEn}`}
          </p>
        </div>

        {isAr ? (
          <div className="prose prose-sm max-w-none space-y-8 text-[#374151]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">١. القبول بالشروط</h2>
              <p className="leading-relaxed">
                باستخدامك لمنصة WZZRD AI (المشار إليها بـ "المنصة")، فأنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٢. وصف الخدمة</h2>
              <p className="leading-relaxed">
                WZZRD AI هي منصة تشخيص علامات تجارية مدعومة بالذكاء الاصطناعي، تُقدّم تحليلات وتقارير تشخيصية للعلامات التجارية والمشاريع. تعمل المنصة بنظام الكريدت (Credits) حيث يُستهلك عدد محدد من الكريدت مقابل كل تحليل.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٣. إنشاء الحساب</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>يجب أن تكون قد بلغت ١٨ عاماً أو أكثر لإنشاء حساب.</li>
                <li>يجب تقديم معلومات دقيقة وكاملة عند التسجيل.</li>
                <li>أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك.</li>
                <li>يُحظر مشاركة حسابك مع أي طرف آخر.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٤. نظام الكريدت والمدفوعات</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>تُمنح ١٠٠ كريدت مجانية عند التسجيل لأول مرة.</li>
                <li>الكريدت المشتراة غير قابلة للاسترداد بعد استخدامها.</li>
                <li>تتم المعالجة عبر بوابة Paymob الآمنة.</li>
                <li>تنتهي صلاحية الكريدت غير المستخدمة بعد ١٢ شهراً من تاريخ الشراء.</li>
                <li>لا يمكن نقل الكريدت بين الحسابات.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٥. الاستخدام المقبول</h2>
              <p className="mb-2 leading-relaxed">يُحظر استخدام المنصة في:</p>
              <ul className="list-disc space-y-2 ps-5">
                <li>أي نشاط غير قانوني أو مخالف للأنظمة المعمول بها.</li>
                <li>محاولة اختراق أو تعطيل المنصة أو خوادمها.</li>
                <li>إنشاء حسابات متعددة للتحايل على نظام الكريدت المجانية.</li>
                <li>إعادة بيع أو توزيع نتائج التحليلات دون إذن كتابي مسبق.</li>
                <li>إدخال بيانات مضللة أو كاذبة بقصد التلاعب بنتائج التحليل.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٦. الملكية الفكرية</h2>
              <p className="leading-relaxed">
                جميع المحتويات والتقارير والتحليلات المُنتجة بواسطة المنصة هي ملك لـ WZZRD AI. يُمنح المستخدم ترخيصاً محدوداً وغير حصري لاستخدام نتائج التحليل لأغراضه التجارية الخاصة فقط. لا يجوز إعادة نشر أو بيع أو توزيع هذه النتائج.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٧. إخلاء المسؤولية</h2>
              <p className="leading-relaxed">
                تُقدَّم تحليلات WZZRD AI لأغراض إرشادية فقط ولا تُعدّ استشارة قانونية أو مالية أو تسويقية متخصصة. لا تتحمل المنصة مسؤولية أي قرارات تجارية تُتخذ بناءً على نتائج التحليل. النتائج مبنية على البيانات المُدخلة من قِبل المستخدم وقد لا تعكس الواقع الكامل.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٨. تعليق الحساب وإنهاؤه</h2>
              <p className="leading-relaxed">
                تحتفظ WZZRD AI بالحق في تعليق أو إنهاء أي حساب يُخالف هذه الشروط، دون إشعار مسبق وبدون استرداد أي كريدت متبقية.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٩. التعديلات على الشروط</h2>
              <p className="leading-relaxed">
                تحتفظ WZZRD AI بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل. استمرارك في استخدام المنصة بعد نشر التعديلات يُعدّ موافقة ضمنية عليها.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">١٠. التواصل معنا</h2>
              <p className="leading-relaxed">
                لأي استفسارات تتعلق بهذه الشروط، يُرجى التواصل معنا عبر:{' '}
                <a href="mailto:hello@wzzrdai.com" className="font-semibold text-[#1B4FD8] hover:underline">
                  hello@wzzrdai.com
                </a>
              </p>
            </section>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none space-y-8 text-[#374151]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By using the WZZRD AI platform (the "Platform"), you agree to be bound by these Terms of Use. If you do not agree to any of these terms, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">2. Service Description</h2>
              <p className="leading-relaxed">
                WZZRD AI is an AI-powered brand diagnosis platform that provides diagnostic analyses and reports for brands and businesses. The Platform operates on a credit system where a specific number of credits is consumed per analysis.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">3. Account Creation</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>You must be 18 years of age or older to create an account.</li>
                <li>You must provide accurate and complete information during registration.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>Sharing your account with any third party is prohibited.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">4. Credits & Payments</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>100 free credits are granted upon first registration.</li>
                <li>Purchased credits are non-refundable once used.</li>
                <li>Payments are processed via the secure Paymob gateway.</li>
                <li>Unused credits expire 12 months from the date of purchase.</li>
                <li>Credits cannot be transferred between accounts.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">5. Acceptable Use</h2>
              <p className="mb-2 leading-relaxed">You may not use the Platform for:</p>
              <ul className="list-disc space-y-2 ps-5">
                <li>Any illegal activity or activity that violates applicable regulations.</li>
                <li>Attempting to hack or disrupt the Platform or its servers.</li>
                <li>Creating multiple accounts to circumvent the free credit system.</li>
                <li>Reselling or distributing analysis results without prior written permission.</li>
                <li>Entering misleading or false data with the intent to manipulate analysis results.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">6. Intellectual Property</h2>
              <p className="leading-relaxed">
                All content, reports, and analyses produced by the Platform are the property of WZZRD AI. Users are granted a limited, non-exclusive license to use analysis results for their own commercial purposes only. Republishing, selling, or distributing these results is not permitted.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">7. Disclaimer</h2>
              <p className="leading-relaxed">
                WZZRD AI analyses are provided for guidance purposes only and do not constitute specialized legal, financial, or marketing advice. The Platform bears no responsibility for any business decisions made based on analysis results. Results are based on user-inputted data and may not reflect the complete reality.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">8. Account Suspension & Termination</h2>
              <p className="leading-relaxed">
                WZZRD AI reserves the right to suspend or terminate any account that violates these Terms, without prior notice and without refunding any remaining credits.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">9. Modifications to Terms</h2>
              <p className="leading-relaxed">
                WZZRD AI reserves the right to modify these Terms at any time. Users will be notified of any material changes via their registered email. Continued use of the Platform after changes are published constitutes implicit acceptance.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">10. Contact Us</h2>
              <p className="leading-relaxed">
                For any inquiries regarding these Terms, please contact us at:{' '}
                <a href="mailto:hello@wzzrdai.com" className="font-semibold text-[#1B4FD8] hover:underline">
                  hello@wzzrdai.com
                </a>
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
