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
    const date = firstValue(letter, ["date", "letterDate", "createdAt"]) || "نامشخص";
    const number = firstValue(letter, ["tracking_no", "number", "letterNumber", "trackingNumber"]);

    const lines = [
      "📩 نامهٔ جدیدی برای انجمن داروسازی سندیکا دریافت شد.",
      "",
      `موضوع: ${subject}`,
      `فرستنده (شرکت/سازمان غذا و دارو): ${sender}`,
      `تاریخ: ${date}`
    ];
    if (number) lines.push(`شمارهٔ پیگیری: ${number}`);
    const direction = firstValue(letter, ["direction"]);
    const type = firstValue(letter, ["type"]);
    const receiver = firstValue(letter, ["receiver"]);
    const company = firstValue(letter, ["company"]);
    const status = firstValue(letter, ["status"]);
    if (direction) lines.push(`جهت: ${direction}`);
    if (type) lines.push(`نوع نامه: ${type}`);
    if (receiver) lines.push(`گیرنده: ${receiver}`);
    if (company) lines.push(`شرکت: ${company}`);
    if (status) lines.push(`وضعیت: ${status}`);

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
  window.BaleNotify && window.BaleNotify.onNewLetter(letter);
  به منطق یا فایل‌های دیگر دست نزنید؛ فقط تگ اسکریپت و یک فراخوانی پس از ثبت نامه کافی است.
*/
