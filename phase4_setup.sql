CREATE TABLE IF NOT EXISTS archive_circulars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    ref_no TEXT,
    issue_date TEXT,
    organization TEXT,
    category TEXT,
    file_url TEXT,
    content_ocr TEXT,
    keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_receipts_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT NOT NULL,
    recipient_name TEXT,
    phone_or_chatid TEXT,
    channel TEXT DEFAULT 'Bale',
    message_text TEXT,
    status TEXT DEFAULT 'در صف ارسال',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE archive_circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_receipts_outbox ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on circulars') THEN
        CREATE POLICY "Allow public select on circulars" ON archive_circulars FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on circulars') THEN
        CREATE POLICY "Allow public insert on circulars" ON archive_circulars FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on receipts') THEN
        CREATE POLICY "Allow public select on receipts" ON digital_receipts_outbox FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on receipts') THEN
        CREATE POLICY "Allow public insert on receipts" ON digital_receipts_outbox FOR INSERT WITH CHECK (true);
    END IF;
END $$;

INSERT INTO archive_circulars (title, ref_no, issue_date, organization, category, content_ocr, keywords)
SELECT 'دستورالعمل توزیع کشوری انسولین قلمی و سرم‌های تخصصی', '۱۴۰۵/د/۷۸۲۱', '1405/07/15', 'سازمان غذا و دارو', 'توزیع دارویی', 'کلیه شرکت‌های پخش سراسری و استانی موظف به ثبت دقیق آمار توزیع در سامانه تیتک هستند.', 'انسولین,سرم,تیتک,سهمیه'
WHERE NOT EXISTS (SELECT 1 FROM archive_circulars WHERE ref_no = '۱۴۰۵/د/۷۸۲۱');
