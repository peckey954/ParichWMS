// ============================================================
// ตั้งค่าการอนุมัติใบสั่งซื้อ
//
// ประเภทสินค้าเป็นหัว ช่วงวงเงินเป็นชั้นอยู่ข้างใน:
//   ประเภทสินค้า
//     └─ ช่วงวงเงิน (เริ่มต้น–สูงสุด) · ผู้อนุมัติ · เปิด/ปิดใช้งาน
//
// ที่ต้องเป็นลำดับนี้เพราะวงเงินมีความหมายก็ต่อเมื่อรู้ว่ากำลังพูดถึงสินค้าประเภทไหน
// ของเดิมเป็นบรรทัดเรียงกันโดยแต่ละบรรทัดถือประเภทของตัวเอง ช่วงวงเงินของคนละ
// ประเภทจึงสลับกันอยู่ในรายการเดียว มองไม่ออกว่าประเภทหนึ่ง ๆ ไล่วงเงินครบหรือยัง
// พอรวมชั้นของประเภทเดียวกันไว้ด้วยกัน ช่วงวงเงินจะอ่านต่อเนื่องเป็นบันได
// และรูโหว่กับช่วงที่ทับกันจะเห็นทันทีจากบรรทัดที่อยู่ติดกัน
//
// ช่วงวงเงินเป็น "ช่วงปิด" ทั้งสองด้าน ยอดที่เท่ากับขอบพอดีถือว่าอยู่ในช่วง
// ช่วงจึงต้องไม่ทับกันเอง วิธีเขียนที่ใช้จริงคือให้ขอบล่างของชั้นบน
// เกินขอบบนของชั้นล่างมา .01 (50,000.00 / 50,000.01) ไม่ใช่ให้เท่ากัน
//
// ผู้อนุมัติใส่ได้หลายคนแต่ต้องการแค่คนเดียวกด — ใส่หลายชื่อคือเผื่อคนลา
// ไม่ใช่ต้องเซ็นครบทุกคน ป้ายบนหัวคอลัมน์เขียนกำกับไว้เพราะเข้าใจผิดกันบ่อย
//
// ปิดใช้งานแทนลบ — ชั้นที่ปิดอยู่ยังเก็บค่าที่ตั้งไว้ทั้งหมด เปิดกลับมาใช้
// ได้ทันทีโดยไม่ต้องกรอกใหม่ และประวัติการอนุมัติเก่ายังอ่านออกว่ามาจากกฎไหน
// ============================================================

import { PR_CATEGORIES, PR_CATEGORY_LABEL, type PrCategoryId } from "@/lib/pr";

/** เพดานวงเงินของระบบ ใช้เป็นขอบบนของชั้นสูงสุด */
export const MAX_BAHT = 100_000_000;

/** หนึ่งชั้นวงเงินภายใต้ประเภทสินค้าหนึ่งกลุ่ม */
export type ApprovalTier = {
  id: string;
  /** ขอบล่างของช่วง รวมค่านี้ด้วย */
  minBaht: number;
  /** ขอบบนของช่วง รวมค่านี้ด้วย */
  maxBaht: number;
  /** รหัสผู้อนุมัติ — ใครคนหนึ่งในนี้กดก็ถือว่าผ่าน */
  approverIds: string[];
  enabled: boolean;
};

/** ประเภทสินค้าหนึ่งกลุ่ม พร้อมบันไดวงเงินของมัน */
export type ApprovalGroup = {
  id: string;
  /** ประเภทสินค้าที่กลุ่มนี้คุม — ว่าง = ทั้งหมด ไม่ใช่ "ไม่มีประเภทไหนเลย" */
  categories: PrCategoryId[];
  /** เรียงจากวงเงินสูงลงมาต่ำ ชั้นใหม่แทรกบนสุด */
  tiers: ApprovalTier[];
};

export type ApprovalConfig = {
  groups: ApprovalGroup[];
  /** เวลาที่บันทึกล่าสุด เก็บเป็นสตริงสำเร็จรูป ไม่ให้ render ไปคำนวณเวลาเอง
   *  ไม่งั้นค่าฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ไม่ตรงกันแล้ว hydration พัง */
  updatedAt: string;
};

// ---------------------------------------------------------------
// บัญชีผู้อนุมัติที่เลือกได้
// ---------------------------------------------------------------

export type ApproverAccount = { id: string; name: string };

export const APPROVER_ACCOUNTS: ApproverAccount[] = [
  { id: "alisa", name: "อลิสา พรสุขสิริ" },
  { id: "nattawut", name: "ณัฐวุฒิ แก้วประเสริฐ" },
  { id: "suchanat", name: "สุชานาถ อินทร์ทอง" },
  { id: "kittipong", name: "กิตติพงศ์ ใจดีงาม" },
  { id: "thanakrit", name: "ธนกฤต ศรีบุญเรือง" },
  { id: "pimchanok", name: "พิมพ์ชนก วงศ์อารีย์" },
];

export const APPROVER_OPTIONS = APPROVER_ACCOUNTS.map((a) => ({
  value: a.id,
  label: a.name,
}));

export const CATEGORY_OPTIONS = PR_CATEGORIES.map((id) => ({
  value: id as string,
  label: PR_CATEGORY_LABEL[id],
}));

// ---------------------------------------------------------------

export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  updatedAt: "1/16/2026 | 10:42:52",
  groups: [
    {
      id: "group-all",
      categories: [],
      tiers: [
        {
          id: "tier-high",
          minBaht: 50000.01,
          maxBaht: MAX_BAHT,
          approverIds: [],
          enabled: true,
        },
        {
          id: "tier-low",
          minBaht: 0,
          maxBaht: 50000,
          approverIds: [],
          enabled: true,
        },
      ],
    },
  ],
};

export const round2 = (v: number) => Number(v.toFixed(2));

/**
 * ชั้นใหม่ที่จะไปแทรกบนสุดของกลุ่ม
 *
 * ตั้งขอบล่างต่อจากขอบบนของชั้นที่อยู่บนสุดเดิมมา .01 บันไดจะได้ต่อเนื่อง
 * ตั้งแต่วินาทีแรกโดยไม่ต้องให้คนตั้งค่าคิดเลขเอง ส่วนขอบบนให้เป็นเพดานระบบ
 */
export function blankTier(currentTop: ApprovalTier | undefined): ApprovalTier {
  const from = currentTop ? round2(currentTop.maxBaht + 0.01) : 0;
  return {
    id: `tier-${Date.now()}`,
    minBaht: from,
    maxBaht: Math.max(from, MAX_BAHT),
    approverIds: [],
    enabled: true,
  };
}

/** กลุ่มใหม่ เริ่มด้วยชั้นเดียวที่กินวงเงินทั้งหมด แล้วค่อยซอยทีหลัง */
export function blankGroup(): ApprovalGroup {
  const now = Date.now();
  return {
    id: `group-${now}`,
    categories: [],
    tiers: [
      {
        id: `tier-${now}`,
        minBaht: 0,
        maxBaht: MAX_BAHT,
        approverIds: [],
        enabled: true,
      },
    ],
  };
}

export const formatBaht = (v: number) =>
  v.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** เวลาที่บันทึก ในรูปแบบเดียวกับที่โชว์ใต้หัวข้อ — เรียกตอนกดบันทึกเท่านั้น */
export function stampNow(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} | ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}

// ---------------------------------------------------------------
// บันไดวงเงินขาดตอนตรงไหน
//
// เหตุผลทั้งหมดที่ยกประเภทสินค้าขึ้นเป็นหัว คือให้ชั้นวงเงินของประเภทเดียวกัน
// อยู่ติดกันจนอ่านออกว่าต่อเนื่องไหม ตรวจให้ตรงนี้เลยจะได้ไม่ต้องให้คนไล่ลบเลขเอง
//
// รายการเรียงสูงลงต่ำ ชั้นบนกับชั้นล่างต่อกันสนิทเมื่อขอบล่างของชั้นบน
// เกินขอบบนของชั้นล่างมาพอดี .01 — มากกว่านั้นคือมีรู น้อยกว่านั้นคือทับกัน
// ---------------------------------------------------------------

export type ChainBreak = "gap" | "overlap";

export function chainBreak(
  above: ApprovalTier,
  below: ApprovalTier
): ChainBreak | null {
  const expected = round2(below.maxBaht + 0.01);
  if (round2(above.minBaht) === expected) return null;
  return above.minBaht > expected ? "gap" : "overlap";
}

/** ช่วงที่ไม่มีใครคุม หรือช่วงที่ซ้อนกัน ระหว่างสองชั้นที่ติดกัน */
export function breakRange(above: ApprovalTier, below: ApprovalTier) {
  const kind = chainBreak(above, below);
  if (kind === null) return null;
  return kind === "gap"
    ? { kind, from: round2(below.maxBaht + 0.01), to: round2(above.minBaht - 0.01) }
    : { kind, from: round2(above.minBaht), to: round2(below.maxBaht) };
}

// ---------------------------------------------------------------
// จุดที่ต้องแก้ก่อนบันทึกได้
//
// ทุกเคสในนี้ลงเอยเหมือนกันหมดคือ "ใบสั่งซื้อค้าง" ต่างกันแค่ค้างเพราะอะไร
//   ช่วงกลับหัว  ชั้นนั้นไม่มียอดไหนเข้าได้เลย
//   มีรู         ไม่มีชั้นไหนคุมยอดช่วงนั้น
//   ทับกัน       สองชั้นแย่งใบเดียวกัน
//   ไม่มีผู้อนุมัติ มีชั้นคุมแต่ส่งไปหาที่ว่าง
// จึงนับรวมเป็นกองเดียว ไม่แยกเป็น error ฟอร์มกับ error ตรรกะคนละหน้าตา
//
// ชั้นที่ปิดใช้งานไม่ตรวจเลย — "ปิดใช้งานแทนลบ" แปลว่าจะมีชั้นกรอกค้างจอดอยู่
// เป็นเรื่องปกติ ตรวจทุกชั้นไม่เลือกหน้าแล้วคนจะโดนบล็อกจากชั้นที่ตั้งใจพักไว้
// แล้วจะไม่มีใครกล้าใช้สวิตช์ปิดอีกเลย
//
// แต่ชั้นที่ปิดอยู่ "ไม่นับ" ตอนไล่ความต่อเนื่องด้วย เพราะมันไม่ได้คุมอะไรจริง ๆ
// ปิดชั้นกลางบันไดแล้วจึงขึ้นว่ามีรู ซึ่งถูกแล้ว ยอดช่วงนั้นไม่มีใครรับไปจริง ๆ
// ---------------------------------------------------------------

export type IssueKind = "range" | "gap" | "overlap" | "approver";

export type Issue = {
  groupId: string;
  /** ชั้นที่เป็นเจ้าของปัญหา — เคสรอยต่อคือชั้นบนของรอยนั้น */
  tierId: string;
  /** ชั้นล่างของรอยต่อ มีเฉพาะเคส gap/overlap */
  belowTierId?: string;
  kind: IssueKind;
  /** id ของ element ที่จะเลื่อนไปหาและโฟกัส */
  anchorId: string;
  message: string;
};

/** หัวเรื่องบนแถบแจ้งเตือน — ใช้เมื่อจุดที่เหลือเป็นชนิดเดียวกันทั้งหมด */
export const ISSUE_TITLE: Record<IssueKind, string> = {
  range: "วงเงินเริ่มต้นต้องน้อยกว่าวงเงินสูงสุด",
  gap: "ช่วงวงเงินไม่ต่อเนื่องกัน",
  overlap: "ช่วงวงเงินซ้ำกับเงื่อนไขที่มีอยู่",
  approver: "ยังไม่ได้เลือกผู้อนุมัติ",
};

/**
 * พาดหัวของแถบ
 *
 * เหลือชนิดเดียวก็เรียกชื่อปัญหาไปเลย คนอ่านรู้ทันทีว่าต้องไปแก้อะไร
 * แต่พอปนหลายชนิดแล้วเรียกชื่อชนิดใดชนิดหนึ่งจะกลายเป็นโกหก
 * (พาดหัวบอกว่าช่วงซ้ำ แต่จริง ๆ ยังลืมผู้อนุมัติอยู่อีกสองจุด) เหลือแค่จำนวนแทน
 */
export function issueHeadline(issues: Issue[]): string {
  if (issues.length === 0) return "";
  const kinds = new Set(issues.map((i) => i.kind));
  if (kinds.size > 1) return `พบ ${issues.length} จุดที่ต้องแก้`;
  const title = ISSUE_TITLE[issues[0].kind];
  return issues.length === 1 ? title : `${title} (${issues.length} จุด)`;
}

const range = (t: ApprovalTier) =>
  `${formatBaht(t.minBaht)} – ${formatBaht(t.maxBaht)} บาท`;

/** เรียงตามลำดับที่ตาเห็นบนหน้า ปุ่มกระโดดจะได้ไล่ลงมาเป็นธรรมชาติ */
export function issuesOf(cfg: ApprovalConfig): Issue[] {
  const out: Issue[] = [];

  for (const group of cfg.groups) {
    const active = group.tiers.filter((t) => t.enabled);
    // ชั้นที่ช่วงตัวเองยังกลับหัวอยู่ ยังเทียบความต่อเนื่องกับชั้นอื่นไม่ได้
    // ขึ้นสองข้อความทับกันในชั้นเดียวคือรบกวนเปล่า ๆ แก้ช่วงตัวเองให้ถูกก่อน
    const sane = active.filter((t) => t.minBaht <= t.maxBaht);

    const seam = new Map<string, { below: ApprovalTier; kind: ChainBreak; from: number; to: number }>();
    for (let i = 0; i < sane.length - 1; i++) {
      const b = breakRange(sane[i], sane[i + 1]);
      if (b) seam.set(sane[i].id, { below: sane[i + 1], ...b });
    }

    for (const tier of group.tiers) {
      if (!tier.enabled) continue;

      if (tier.minBaht > tier.maxBaht) {
        out.push({
          groupId: group.id,
          tierId: tier.id,
          kind: "range",
          anchorId: `${tier.id}-min`,
          message: `วงเงินเริ่มต้นต้องน้อยกว่าวงเงินสูงสุด ตอนนี้ตั้งไว้ ${range(tier)} ซึ่งไม่มียอดไหนเข้าได้เลย`,
        });
      }

      if (tier.approverIds.length === 0) {
        out.push({
          groupId: group.id,
          tierId: tier.id,
          kind: "approver",
          anchorId: `${tier.id}-approvers`,
          message: `ช่วงนี้ยังไม่มีผู้อนุมัติ ใบที่ยอด ${range(tier)} จะค้างไม่มีใครกดได้`,
        });
      }

      const s = seam.get(tier.id);
      if (s) {
        out.push({
          groupId: group.id,
          tierId: tier.id,
          belowTierId: s.below.id,
          kind: s.kind,
          anchorId: `${tier.id}-seam`,
          message:
            s.kind === "gap"
              ? `ยอด ${formatBaht(s.from)} – ${formatBaht(s.to)} บาท ไม่มีช่วงไหนคุม ใบที่ตกช่วงนี้จะไม่เข้าสายอนุมัติ`
              : `ยอด ${formatBaht(s.from)} – ${formatBaht(s.to)} บาท อยู่ในสองช่วงพร้อมกัน ช่วงบนจะกินใบไปก่อน`,
        });
      }
    }
  }

  return out;
}

/**
 * ช่องที่ต้องขึ้นกรอบแดง
 *
 * เคสรอยต่อทำแดงสองช่องคนละชั้น เพราะปัญหาอยู่ที่ "รอย" ไม่ใช่ชั้นใดชั้นหนึ่ง
 * ทำแดงชั้นเดียวแล้วคนจะแก้ผิดข้าง
 */
export function redFieldsOf(issues: Issue[]): Set<string> {
  const red = new Set<string>();
  for (const i of issues) {
    if (i.kind === "range") {
      red.add(`${i.tierId}-min`);
      red.add(`${i.tierId}-max`);
    } else if (i.kind === "approver") {
      red.add(`${i.tierId}-approvers`);
    } else {
      red.add(`${i.tierId}-min`);
      if (i.belowTierId) red.add(`${i.belowTierId}-max`);
    }
  }
  return red;
}

// ---------------------------------------------------------------
// ใบหนึ่งตกไปหาใคร
// ---------------------------------------------------------------

/**
 * กลุ่มนี้คุมใบที่มีของประเภทพวกนี้ไหม
 *
 * เช็กแบบ "มีอย่างน้อยหนึ่งรายการตรง" ไม่ใช่ต้องตรงทั้งใบ —
 * ใบที่มีของประเภทที่กลุ่มนั้นคุมปนอยู่แม้รายการเดียวก็ต้องให้เขาเห็น
 */
export function groupCovers(
  group: ApprovalGroup,
  categories: PrCategoryId[]
): boolean {
  if (group.categories.length === 0) return true;
  return categories.some((c) => group.categories.includes(c));
}

export function tierApplies(tier: ApprovalTier, totalBaht: number): boolean {
  return tier.enabled && totalBaht >= tier.minBaht && totalBaht <= tier.maxBaht;
}

/** ชั้นแรกที่กินใบนี้ — กลุ่มที่ระบุประเภทไว้ชนะกลุ่ม "ทั้งหมด" ที่เป็นตาข่ายรองท้าย */
export function tierFor(
  totalBaht: number,
  categories: PrCategoryId[],
  cfg: ApprovalConfig
): { group: ApprovalGroup; tier: ApprovalTier } | undefined {
  const ordered = [...cfg.groups].sort(
    (a, b) => (b.categories.length > 0 ? 1 : 0) - (a.categories.length > 0 ? 1 : 0)
  );
  for (const group of ordered) {
    if (!groupCovers(group, categories)) continue;
    const tier = group.tiers.find((t) => tierApplies(t, totalBaht));
    if (tier) return { group, tier };
  }
  return undefined;
}

/** ชื่อประเภทที่กลุ่มนี้คุม ใช้เขียนเป็นคำอ่าน */
export const categorySummary = (group: ApprovalGroup) =>
  group.categories.length === 0
    ? "ทั้งหมด"
    : group.categories.map((c) => PR_CATEGORY_LABEL[c]).join(" · ");
