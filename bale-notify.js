/* اعلان‌گر بله — نسخهٔ نهایی و پایدار
 * نکتهٔ مهم دربارهٔ CORS:
 * مرورگرها درخواست‌های مستقیم از دامنه‌های دیگر را مسدود می‌کنند اگر سرور
 * هدرهای CORS (مثل Access-Control-Allow-Origin) نفرستد. سرور tapi.bale.ai
 * این هدرها را برای دامنه‌های دلخواه نمی‌فرستد؛ بنابراین هر fetch مستقیم
 * از مرورگر با خطای CORS/شبکه مواجه می‌شود — حتی اگر توکن و chat_id کاملاً
 * درست باشند. این خطای «مرورگر» است، نه خطای توکن.
 * راه‌حل پایدار:
 *   ۱) وضعیت هنگام بارگذاری صفحه: «آماده ارسال» (چون تنظیمات کامل است)
 *      — اتصال واقعی هنگام ثبت نامه آزموده می‌شود.
 *   ۲) هنگام ثبت نامه: ارسال تلاش می‌شود.
 *      - موفق  → «متصل» (سبز)
 *      - خطای CORS/شبکه → «ارسال نامشخص» (خاکستری/زرد) با راهنمای شفاف
 *        در tooltip و لاگ کنسول؛ ثبت نامه در هر حالت انجام می‌شود.
 * برای قطع‌وصل‌شدن قطعی CORS: اعلان را از سمت سرور (پروکسی کوچک روی همان
 * دامنهٔ سایت) ارسال کنید یا افزونه/اسکریپت سرور (مثلاً Node/PHP) بگذارید.
 */
const BALE_NOTIFY_CONFIG = {
  BALE_BOT_TOKEN: "475870600:UHpZ1mtlHwtkNnFmCFHG_7msPfv8SWV5IKw",
  ADMIN_CHAT_ID: "2045036165",
  API_BASE: "https://tapi.bale.ai"
};

(function () {
  "use strict";

  const CORS_GUIDE =
    "مرورگر درخواست مستقیم به بله را به‌دلیل سیاست امنیتی CORS مسدود می‌کند. " +
    "این یعنی اتصال از مرورگر قابل‌تأیید نیست؛ برای ارسال قطعی، اعلان را از سمت سرور (پروکسی روی همان دامنه) بفرستید. " +
    "تنظیمات توکن و شناسهٔ مدیر درست است و ثبت نامه بدون مشکل انجام می‌شود.";

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
    indicator.setAttribute("aria-label", "وضعیت بله: آماده ارسال");
    indicator.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 11.5h9M7.5 14.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
      '<span class="bale-connection-name">بله</span>' +
      '<span class="bale-connection-state"><i class="bale-status-dot" aria-hidden="true"></i><span class="bale-state-label">آماده</span></span>';
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

  function safeLog(message, error) {
    if (typeof console !== "undefined") {
      if (typeof console.warn === "function") console.warn(message, error || "");
      else if (typeof console.log === "function") console.log(message, error || "");
    }
  }

  /* ---------- تاریخ شمسی ---------- */
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const toFaDigits = s => String(s).replace(/\d/g, d => FA_DIGITS[+d]);
  const toAsciiDigits = s =>
    String(s)
      .replace(/[۰-۹]/g, d => String(FA_DIGITS.indexOf(d)))
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days =
      365 * gy +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) -
      80 +
      gd +
      g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
  }

  /** خروجی همیشه شمسی است؛ مثال: 2026-10-11 → ۱۴۰۵/۰۷/۲۰ */
  function formatLetterDateShamsi(value) {
    if (value === undefined || value === null || String(value).trim() === "") return "";
    const raw = String(value).trim();
    const ascii = toAsciiDigits(raw);

    // اگر خودش تاریخ شمسی بود، همان را با اعداد فارسی برمی‌گردانیم.
    const jalali = ascii.match(/^(1[34][0-9]{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (jalali) {
      const y = +jalali[1], m = +jalali[2], d = +jalali[3];
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return toFaDigits(`${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`);
      }
    }

    let date;
    const iso = ascii.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
    if (iso) {
      const y = +iso[1], m = +iso[2], d = +iso[3];
      date = new Date(Date.UTC(y, m - 1, d, 12));
      if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return toFaDigits(raw);
    } else {
      date = new Date(ascii);
      if (Number.isNaN(date.getTime())) return toFaDigits(raw);
    }
    try {
      const parts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
        year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC"
      }).formatToParts(date);
      const part = key => parts.find(item => item.type === key)?.value;
      if (part("year") && part("month") && part("day")) {
        return toFaDigits(`${part("year")}/${part("month")}/${part("day")}`);
      }
    } catch (_) { /* fallback پایین */ }
    const [jy, jm, jd] = gregorianToJalali(
      date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()
    );
    return toFaDigits(`${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`);
  }

  function firstValue(letter, keys) {
    for (const key of keys) {
      const value = letter && letter[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return "";
  }

  function buildLetterText(letter) {
    const subject = firstValue(letter, ["subject", "title", "letterTitle"]) || "بدون عنوان";
    const sender = firstValue(letter, ["sender", "company", "fda", "senderName", "companyName"]) || "نامشخص";
    const date = formatLetterDateShamsi(firstValue(letter, ["date", "letterDate", "createdAt"])) || "نامشخص";
    const number = firstValue(letter, ["tracking_no", "number", "letterNumber", "trackingNumber"]);

    const lines = [
      "📩 نامهٔ جدیدی برای انجمن داروسازی سندیکا دریافت شد.",
      "",
      `موضوع: ${subject}`,
      `فرستنده (شرکت/سازمان غذا و دارو): ${sender}`,
      `تاریخ (شمسی): ${date}`
    ];
    if (number) lines.push(`شمارهٔ پیگیری: ${number}`);
    const extras = ["direction", "type", "receiver", "company", "status"];
    const labels = {
      direction: "جهت", type: "نوع نامه", receiver: "گیرنده",
      company: "شرکت", status: "وضعیت"
    };
    extras.forEach(key => {
      const value = firstValue(letter, [key]);
      if (value) lines.push(`${labels[key]}: ${value}`);
    });
    lines.push("", "📅 تاریخ ارسال اعلان: " + formatLetterDateShamsi(new Date().toISOString()));
    return lines.join("\n");
  }

  /* ---------- وضعیت هنگام بارگذاری صفحه ---------- */
  function initBaleIndicator() {
    ensureBaleIndicator();
    if (!BALE_NOTIFY_CONFIG.BALE_BOT_TOKEN || !BALE_NOTIFY_CONFIG.ADMIN_CHAT_ID) {
      setBaleState("error", "تنظیم‌نشده", "توکن ربات یا شناسهٔ مدیر در bale-notify.js تنظیم نشده است.");
      return;
    }
    // هیچ fetch به tapi.bale.ai در بارگذاری انجام نمی‌شود؛ CORS از مرورگر مسدود است.
    setBaleState(
      "ready",
      "آماده ارسال",
      "توکن و شناسهٔ مدیر تنظیم شده‌اند. تأیید نهایی اتصال هنگام ثبت نامه انجام می‌شود " +
      "(مرورگر اجازهٔ تست مستقیم بله را به‌دلیل CORS نمی‌دهد)."
    );
  }

  /* ---------- ارسال اعلان هنگام ثبت نامه ---------- */
  async function onNewLetter(letter) {
    if (!BALE_NOTIFY_CONFIG.ADMIN_CHAT_ID || !BALE_NOTIFY_CONFIG.BALE_BOT_TOKEN) {
      setBaleState("error", "تنظیم‌نشده", "شناسهٔ مدیر یا توکن ربات تنظیم نشده است.");
      safeLog("ارسال اعلان بله انجام نشد؛ تنظیمات ناقص است.");
      return;
    }
    if (typeof fetch !== "function") {
      setBaleState("error", "ناموفق", "مرورگر امکان ارسال درخواست به بله را ندارد.");
      safeLog("ارسال اعلان بله انجام نشد؛ fetch در این مرورگر موجود نیست.");
      return;
    }

    setBaleState("checking", "در حال بررسی", "درخواست ارسال اعلان نامه به بله در حال انجام است.");
    try {
      const response = await fetch(
        `${BALE_NOTIFY_CONFIG.API_BASE}/bot${BALE_NOTIFY_CONFIG.BALE_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: BALE_NOTIFY_CONFIG.ADMIN_CHAT_ID,
            text: buildLetterText(letter)
          })
        }
      );
      if (!response.ok) {
        setBaleState("error", "ناموفق", `پاسخ بله ناموفق بود (HTTP ${response.status}).`);
        safeLog("ارسال اعلان نامه به بله ناموفق بود.", `HTTP ${response.status}`);
        return;
      }
      const result = await response.json().catch(() => null);
      if (result && result.ok === false) {
        setBaleState("error", "ناموفق", result.description || "بله پاسخ ناموفق برگرداند.");
        safeLog("ارسال اعلان نامه به بله ناموفق بود.", result.description || "");
        return;
      }
      setBaleState("connected", "متصل", "ارسال موفق از سرویس بله تأیید شد.");
    } catch (error) {
      // خطای CORS/شبکه: ثبت نامه خراب نمی‌شود و وضعیت شفاف نمایش داده می‌شود.
      setBaleState("unknown", "ارسال نامشخص", CORS_GUIDE);
      safeLog(
        "[بله] ارسال مستقیم از مرورگر ممکن نشد (به احتمال زیاد CORS). " +
        "سیاست امنیتی مرورگر درخواست به دامنه‌های بدون هدر CORS را مسدود می‌کند. " +
        "برای ارسال قطعی، اعلان را از سمت سرور (پروکسی روی همان دامنه) بفرستید. " +
        "جزئیات فنی:", error
      );
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initBaleIndicator, { once: true });
    } else {
      initBaleIndicator();
    }
  }

  if (typeof window !== "undefined") {
    window.BaleNotify = {
      onNewLetter,
      formatLetterDateShamsi,
      version: "2.0-smart-status"
    };
  }
})();

/*
  نحوهٔ استفاده:
  <script src="bale-notify.js"></script>
  و پس از ثبت نامه:
  window.BaleNotify && window.BaleNotify.onNewLetter(letter);
*/
