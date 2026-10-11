/* تنظیمات اتصال ربات بله */
const BALE_NOTIFY_CONFIG = {
  BALE_BOT_TOKEN: "475870600:UHpZ1mtlHwtkNnFmCFHG_7msPfv8SWV5IKw",
  // مدیر باید شناسهٔ گفت‌وگوی خود را پس از بررسی خروجی getUpdates در این قسمت وارد کند.
  ADMIN_CHAT_ID: "2045036165",
  API_BASE: "https://tapi.bale.ai"
};

(function () {
  "use strict";

  // افزودن نشانگر مستقل به سربرگ؛ ساختار HTML و منطق سامانه دست‌نخورده می‌ماند.
  let baleIndicator = null;
  function ensureBaleIndicator() {
    if (baleIndicator || typeof document === "undefined") return baleIndicator;
    const header = document.querySelector("header.topbar .topbar-content");
    if (!header) return null;
    const indicator = document.createElement("div");
    indicator.className = "bale-connection-indicator";
    indicator.dataset.state = "ready";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-live", "polite");
    indicator.setAttribute("aria-label", "وضعیت بله: آماده؛ اتصال پس از ارسال اعلان بررسی می‌شود");
    indicator.title = "اتصال بله پس از ارسال اعلان بررسی می‌شود.";
    indicator.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 11.5h9M7.5 14.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span class="bale-connection-name">بله</span><span class="bale-connection-state"><i class="bale-status-dot" aria-hidden="true"></i><span class="bale-state-label">آماده</span></span>';
    header.appendChild(indicator);
    baleIndicator = indicator;
    return indicator;
  }

  function setBaleState(state, label, detail) {
    const indicator = ensureBaleIndicator();
    if (!indicator) return;
    indicator.dataset.state = state;
    const labelNode = indicator.querySelector(".bale-state-label");
    if (labelNode) labelNode.textContent = label;
    indicator.title = detail;
    indicator.setAttribute("aria-label", `وضعیت بله: ${label}. ${detail}`);
  }

  ensureBaleIndicator();

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
      setBaleState("error", "تنظیم‌نشده", "شناسهٔ مدیر برای ارسال اعلان بله تنظیم نشده است.");
      safeLog("ارسال اعلان بله انجام نشد؛ شناسهٔ مدیر تنظیم نشده است.");
      return;
    }

    if (typeof fetch !== "function") {
      setBaleState("error", "ناموفق", "مرورگر امکان ارسال درخواست به بله را ندارد.");
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
      setBaleState("checking", "در حال بررسی", "درخواست اتصال به بله در حال ارسال است.");
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
        setBaleState("error", "ناموفق", `پاسخ بله ناموفق بود (HTTP ${response.status}).`);
        safeLog("ارسال اعلان نامه به بله ناموفق بود.", `HTTP ${response.status}`);
        return;
      }

      const result = await response.json();
      if (result && result.ok === false) {
        setBaleState("error", "ناموفق", result.description || "بله پاسخ ناموفق برگرداند.");
        safeLog("ارسال اعلان نامه به بله ناموفق بود.", result.description || "پاسخ ناموفق از سرویس بله");
        return;
      }
      setBaleState("connected", "متصل", "ارسال موفق از سرویس بله تأیید شد.");
    } catch (error) {
      setBaleState("error", "ناموفق", "ارتباط با سرویس بله برقرار نشد.");
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
