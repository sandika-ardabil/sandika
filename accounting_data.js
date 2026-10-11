/* Mafasa Hesab schema and browser-side records.
 * Loaded by index_updated_mafasa.html as a regular script (no module/CORS requirement).
 * Dates are strictly Shamsi strings in YYYY/MM/DD form.
 */
(function (root) {
  'use strict';
  const FinancialRecords = {
    invoices: {
      schema: {
        invoiceNumber: { type: 'string', label: 'شماره فاکتور', required: true },
        invoiceDate: { type: 'string', format: 'YYYY/MM/DD', calendar: 'jalali', label: 'تاریخ فاکتور', required: true },
        amount: { type: 'number', min: 0, label: 'مبلغ', required: true },
        receiptName: { type: 'string', label: 'نام رسید فاکتور', required: true }
      }, records: []
    },
    transitCheques: {
      schema: {
        chequeNumber: { type: 'string', label: 'شماره چک', required: true },
        date: { type: 'string', format: 'YYYY/MM/DD', calendar: 'jalali', label: 'تاریخ', required: true },
        amount: { type: 'number', min: 0, label: 'مبلغ', required: true },
        ownerName: { type: 'string', label: 'نام صاحب چک', required: true }
      }, records: []
    },
    bouncedCheques: {
      schema: {
        chequeNumber: { type: 'string', label: 'شماره چک', required: true },
        amount: { type: 'number', min: 0, label: 'مبلغ', required: true },
        date: { type: 'string', format: 'YYYY/MM/DD', calendar: 'jalali', label: 'تاریخ', required: true },
        ownerName: { type: 'string', label: 'نام صاحب چک', required: true }
      }, records: []
    }
  };
  const CorrespondenceRecords = {
    letters: {
      schema: {
        recipientName: { type: 'string', label: 'نام مخاطب', required: true },
        letterNumber: { type: 'string', label: 'شماره نامه', required: true },
        date: { type: 'string', format: 'YYYY/MM/DD', calendar: 'jalali', label: 'تاریخ', required: true },
        attachment: { type: 'string', label: 'پیوست نامه', required: false, description: 'نام فایل یا مسیر/شناسهٔ پیوست' }
      }, records: []
    }
  };
  root.MafasaAccountingData = Object.assign({}, FinancialRecords, CorrespondenceRecords);
  root.MafasaAccountingSchemas = { FinancialRecords, CorrespondenceRecords };
})(typeof window !== 'undefined' ? window : globalThis);
