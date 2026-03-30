import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { useI18n } from '@/lib/i18n';

export default function PrivacyPolicy() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

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
            {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            {isAr ? 'آخر تحديث: ١ أبريل ٢٠٢٥' : 'Last updated: April 1, 2025'}
          </p>
        </div>

        {isAr ? (
          <div className="prose prose-sm max-w-none space-y-8 text-[#374151]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">١. المعلومات التي نجمعها</h2>
              <p className="mb-2 leading-relaxed">نجمع المعلومات التالية عند استخدامك للمنصة:</p>
              <ul className="list-disc space-y-2 ps-5">
                <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، كلمة المرور المشفرة.</li>
                <li><strong>بيانات الأعمال:</strong> المعلومات التي تُدخلها في أدوات التشخيص (اسم العلامة التجارية، القطاع، الوصف).</li>
                <li><strong>بيانات الاستخدام:</strong> الأدوات المستخدمة، عدد التحليلات، تاريخ الاستخدام.</li>
                <li><strong>بيانات الدفع:</strong> لا نحتفظ ببيانات البطاقة الائتمانية — تتم المعالجة عبر Paymob.</li>
                <li><strong>البيانات التقنية:</strong> عنوان IP، نوع المتصفح، نظام التشغيل.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٢. كيف نستخدم معلوماتك</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>تقديم خدمات التشخيص والتحليل المطلوبة.</li>
                <li>تحسين دقة نماذج الذكاء الاصطناعي (بشكل مجهول الهوية).</li>
                <li>إرسال تحديثات المنصة والنصائح التسويقية (يمكنك إلغاء الاشتراك في أي وقت).</li>
                <li>معالجة المدفوعات وإدارة رصيد الكريدت.</li>
                <li>الامتثال للمتطلبات القانونية والتنظيمية.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٣. مشاركة المعلومات</h2>
              <p className="mb-2 leading-relaxed">
                <strong>لا نبيع بياناتك لأي طرف ثالث.</strong> قد نشارك معلوماتك فقط في الحالات التالية:
              </p>
              <ul className="list-disc space-y-2 ps-5">
                <li><strong>مزودو الخدمة:</strong> Paymob (معالجة الدفع)، خوادم الاستضافة — وفق اتفاقيات سرية صارمة.</li>
                <li><strong>المتطلبات القانونية:</strong> عند الطلب من الجهات القضائية أو الحكومية المختصة.</li>
                <li><strong>حماية الحقوق:</strong> لحماية حقوق WZZRD AI أو مستخدميها في حالات الاحتيال أو الانتهاك.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٤. أمان البيانات</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>تشفير كامل للبيانات أثناء النقل (TLS/HTTPS).</li>
                <li>كلمات المرور مشفرة باستخدام bcrypt.</li>
                <li>قواعد البيانات محمية بجدران حماية وصلاحيات محدودة.</li>
                <li>مراجعات أمنية دورية.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٥. حقوقك</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li><strong>الوصول:</strong> طلب نسخة من بياناتك الشخصية المحفوظة لدينا.</li>
                <li><strong>التصحيح:</strong> تحديث أو تصحيح معلوماتك غير الدقيقة.</li>
                <li><strong>الحذف:</strong> طلب حذف حسابك وجميع بياناتك المرتبطة به.</li>
                <li><strong>الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض التسويق.</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                لممارسة أي من هذه الحقوق، تواصل معنا على:{' '}
                <a href="mailto:privacy@wzzrdai.com" className="font-semibold text-[#1B4FD8] hover:underline">
                  privacy@wzzrdai.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٦. ملفات تعريف الارتباط (Cookies)</h2>
              <p className="leading-relaxed">
                نستخدم ملفات تعريف الارتباط الضرورية فقط للحفاظ على جلسة تسجيل الدخول وتذكر تفضيلات اللغة. لا نستخدم ملفات تعريف ارتباط تتبعية أو إعلانية.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٧. الاحتفاظ بالبيانات</h2>
              <p className="leading-relaxed">
                نحتفظ ببياناتك طالما حسابك نشط. عند حذف الحساب، يتم حذف جميع البيانات الشخصية خلال ٣٠ يوماً. قد تُحتفظ بعض البيانات المجهولة الهوية لتحسين النماذج.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">٨. التواصل معنا</h2>
              <p className="leading-relaxed">
                لأي استفسارات تتعلق بالخصوصية:{' '}
                <a href="mailto:privacy@wzzrdai.com" className="font-semibold text-[#1B4FD8] hover:underline">
                  privacy@wzzrdai.com
                </a>
              </p>
            </section>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none space-y-8 text-[#374151]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">1. Information We Collect</h2>
              <p className="mb-2 leading-relaxed">We collect the following information when you use the Platform:</p>
              <ul className="list-disc space-y-2 ps-5">
                <li><strong>Account Information:</strong> Name, email address, encrypted password.</li>
                <li><strong>Business Data:</strong> Information you enter in diagnostic tools (brand name, industry, description).</li>
                <li><strong>Usage Data:</strong> Tools used, number of analyses, usage history.</li>
                <li><strong>Payment Data:</strong> We do not store credit card data — processing is handled by Paymob.</li>
                <li><strong>Technical Data:</strong> IP address, browser type, operating system.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">2. How We Use Your Information</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>Providing the requested diagnostic and analysis services.</li>
                <li>Improving AI model accuracy (anonymized).</li>
                <li>Sending platform updates and marketing tips (you can unsubscribe at any time).</li>
                <li>Processing payments and managing credit balances.</li>
                <li>Complying with legal and regulatory requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">3. Information Sharing</h2>
              <p className="mb-2 leading-relaxed">
                <strong>We do not sell your data to any third party.</strong> We may share your information only in the following cases:
              </p>
              <ul className="list-disc space-y-2 ps-5">
                <li><strong>Service Providers:</strong> Paymob (payment processing), hosting servers — under strict confidentiality agreements.</li>
                <li><strong>Legal Requirements:</strong> When required by competent judicial or governmental authorities.</li>
                <li><strong>Rights Protection:</strong> To protect the rights of WZZRD AI or its users in cases of fraud or violation.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">4. Data Security</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li>Full data encryption in transit (TLS/HTTPS).</li>
                <li>Passwords encrypted using bcrypt.</li>
                <li>Databases protected by firewalls and limited access permissions.</li>
                <li>Regular security audits.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">5. Your Rights</h2>
              <ul className="list-disc space-y-2 ps-5">
                <li><strong>Access:</strong> Request a copy of your personal data stored with us.</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information.</li>
                <li><strong>Deletion:</strong> Request deletion of your account and all associated data.</li>
                <li><strong>Objection:</strong> Object to processing your data for marketing purposes.</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                To exercise any of these rights, contact us at:{' '}
                <a href="mailto:privacy@wzzrdai.com" className="font-semibold text-[#1B4FD8] hover:underline">
                  privacy@wzzrdai.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">6. Cookies</h2>
              <p className="leading-relaxed">
                We use only necessary cookies to maintain login sessions and remember language preferences. We do not use tracking or advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">7. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your data as long as your account is active. Upon account deletion, all personal data is deleted within 30 days. Some anonymized data may be retained to improve models.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#111827]">8. Contact Us</h2>
              <p className="leading-relaxed">
                For any privacy-related inquiries:{' '}
                <a href="mailto:privacy@wzzrdai.com" className="font-semibold text-[#1B4FD8] hover:underline">
                  privacy@wzzrdai.com
                </a>
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
