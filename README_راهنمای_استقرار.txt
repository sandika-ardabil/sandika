راهنمای استقرار سامانه صندیکا روی GitHub Pages
=================================================

۱) ساخت مخزن (Repository):
   - وارد GitHub شوید و یک مخزن جدید Public با نام دلخواه بسازید (مثلاً sandika).

۲) آپلود فایل‌ها:
   - همه فایل‌های داخل این بسته را عیناً در ریشه مخزن آپلود کنید:
     index.html , submit.html , submit_final.html , mafasa.html ,
     letters-sync-unified.js , bale-notify.js , supabase_client.js ,
     accounting_data.js , association_data.js , data.json , accounts.json
   - حتماً index.html در ریشه مخزن باشد (صفحه اصلی سامانه).

۳) فعال‌سازی GitHub Pages:
   - وارد Settings مخزن شوید.
   - از منوی Pages در بخش «Build and deployment» گزینه Source را روی
     «Deploy from a branch» بگذارید.
   - Branch را روی main و پوشه را روی / (root) تنظیم و Save کنید.
   - پس از چند دقیقه آدرس سایت به شکل زیر فعال می‌شود:
     https://<نام‌کاربری>.github.io/<نام‌مخزن>/

۴) نکات مهم:
   - کلیدهای Supabase در فایل supabase_client.js تنظیم می‌شود؛ در صورت نیاز
     مقادیر URL و ANON KEY را پیش از آپلود ویرایش کنید.
   - در صورت ویرایش index.html، هرگز عبارت </script> را داخل رشته‌های
     جاوااسکریپت به‌صورت خام ننویسید؛ آن را به شکل <\/script> بنویسید.
   - فایل letters-sync-unified.js باید کنار index.html باشد چون در انتهای
     صفحه قبل از </body> بارگذاری می‌شود و تابع window.lettersSyncMerge
     را برای ادغام نامه‌های همگام‌شده فراهم می‌کند.
   - پس از هر تغییر، یک تا دو دقیقه صبر کنید و صفحه را با Ctrl+F5 رفرش کنید.

۵) بررسی صحت استقرار:
   - باز شدن صفحه اصلی بدون خطای کنسول (F12).
   - وجود اسکریپت letters-sync-unified.js در تب Network.
