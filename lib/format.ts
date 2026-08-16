// แอปนี้เป็นภาษาไทยภาษาเดียว — ถ้าวันหนึ่งรองรับหลายภาษา เปลี่ยนที่นี่ที่เดียว
export const LOCALE = "th-TH";

/** วันที่แสดงเป็น ค.ศ. แบบ M/D/YYYY ตามระบบเดิม
 *  อยากได้ พ.ศ. แบบไทย (16/1/2569) เปลี่ยนเป็น "th-TH" */
export const DATE_LOCALE = "en-US";

export function formatNumber(value: number, digits = 0) {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** ตัน แสดงทศนิยม 2 ตำแหน่งเสมอ */
export const formatTon = (value: number) => formatNumber(value, 2);

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(DATE_LOCALE)} | ${d.toLocaleTimeString(
    DATE_LOCALE,
    { hour12: false }
  )}`;
}

/** วันที่อย่างเดียว ไม่มีเวลา — ใช้กับวันที่รับล็อตเข้าคลัง */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(DATE_LOCALE);
}
