import React from "react";

/**
 * App dashboard home (was `/`; now served at `/dashboard`).
 */
export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">
        الصفحة الرئيسية للتطبيق بعد تسجيل الدخول.
      </p>
    </div>
  );
}
