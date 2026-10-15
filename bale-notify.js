/* تنظیمات اتصال ربات بله */
const BALE_NOTIFY_CONFIG = {
  BALE_BOT_TOKEN: "475870600:UHpZ1mtlHwtkNnFmCFHG_7msPfv8SWV5IKw",
  // مدیر باید شناسهٔ گفت‌وگوی خود را پس از بررسی خروجی getUpdates در این قسمت وارد کند.
  ADMIN_CHAT_ID: "2045036165",
  API_BASE: "https://tapi.bale.ai"
};

(function () {
  "use strict";

  function firstValue(letter, keys) {
    for (const key of keys) {
      const value = letter && letter[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return "";
  }

  function formatLetterDate(value) {
    if (value === undefined || value === null || String(value).trim() === "") return "";
    const raw = String(value).trim();
    const ascii = raw.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    const jalali = ascii.match(/^(1[23][0-9]{2}|14[0-9]{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (jalali) return `${jalali[1]}/${jalali[2].padStart(2, "0")}/${jalali[3].padStart(2, "0")}`;
    let date;
    const iso = ascii.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
    if (iso) {
      const y = +iso[1], m = +iso[2], d = +iso[3];
      date = new Date(Date.UTC(y, m - 1, d, 12));
      if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return raw;
    } else {
      date = new Date(ascii);
      if (Number.isNaN(date.getTime())) return raw;
    }
    try {
      const parts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).formatToParts(date);
      const part = key => parts.find(item => item.type === key)?.value;
      return `${part("year")}/${part("month")}/${part("day")}`;
    } catch (_) { return raw; }
  }

  function safeLog(message, error) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(message, error || "");
    }
  }

  async function onNewLetter(letter) {
    if (!BALE_NOTIFY_CONFIG.ADMIN_CHAT_ID) {
      safeLog("ارسال اعلان بله انجام نشد؛ شناسهٔ مدیر تنظیم نشده است.");
      return;
    }

    if (typeof fetch !== "function") {
      safeLog("ارسال اعلان بله انجام نشد؛ امکان ارسال درخواست در این مرورگر وجود ندارد.");
      return;
    }

    const subject = firstValue(letter, ["subject", "title", "letterTitle"]) || "بدون عنوان";
    const sender = firstValue(letter, ["sender", "company", "fda", "senderName", "companyName"]) || "نامشخص";
    const date = formatLetterDate(firstValue(letter, ["date", "letterDate", "createdAt"])) || "نامشخص";
    const number = firstValue(letter, ["number", "letterNumber", "trackingNumber"]);

    const lines = [
      "📩 نامهٔ جدیدی برای انجمن داروسازی سندیکا دریافت شد.",
      "",
      `موضوع: ${subject}`,
      `فرستنده (شرکت/سازمان غذا و دارو): ${sender}`,
      `تاریخ: ${date}`
    ];
    if (number) lines.push(`شمارهٔ نامه: ${number}`);

    try {
      const response = await fetch(
        `${BALE_NOTIFY_CONFIG.API_BASE}/bot${BALE_NOTIFY_CONFIG.BALE_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: BALE_NOTIFY_CONFIG.ADMIN_CHAT_ID,
            text: lines.join("\n")
          })
        }
      );

      if (!response.ok) {
        safeLog("ارسال اعلان نامه به بله ناموفق بود.", `HTTP ${response.status}`);
        return;
      }

      const result = await response.json();
      if (result && result.ok === false) {
        safeLog("ارسال اعلان نامه به بله ناموفق بود.", result.description || "پاسخ ناموفق از سرویس بله");
      }
    } catch (error) {
      safeLog("در ارسال اعلان نامه به بله خطایی رخ داد.", error);
    }
  }

  if (typeof window !== "undefined") {
    window.BaleNotify = { onNewLetter };
  }
})();

/*
  برای اتصال، فایل را با یک تگ اسکریپت اضافه کنید و پس از ثبت نامه فقط این خط را فراخوانی کنید:
  <script src="bale-notify.js"></script>
  window.BaleNotify && window.BaleNotify.onNewLetter({subject, sender, date, number});
  به منطق یا فایل‌های دیگر دست نزنید؛ فقط تگ اسکریپت و یک فراخوانی پس از ثبت نامه کافی است.
*/
