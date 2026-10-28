// کلید مدیر را اینجا عوض کن (یک رمز دلخواه، فقط خودت بدانی)
const ADMIN_KEY = "Almas3120";

function sheet_() {
  const ss = SpreadsheetApp.openById("1cn0S6DB7PISUSGzC8vHx_WEFH5U4J8jegjIA6UuzLM4");
  let s = ss.getSheetByName("Predictions");
  if (!s) { s = ss.insertSheet("Predictions"); s.appendRow(["time", "pid", "name", "home", "away", "h", "a"]); }
  return s;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const props = PropertiesService.getScriptProperties();

  // تنظیم رمزهای شخصی (فقط مدیر)
  if (d.action === "setpins") {
    if (d.key !== ADMIN_KEY) return out_({ ok: false, error: "bad key" });
    props.setProperty("PINS", JSON.stringify(d.pins || {}));
    return out_({ ok: true, n: Object.keys(d.pins || {}).length });
  }

  // برنامه‌ی ساعت شروع بازی‌ها (فقط مدیر)
  if (d.action === "setmatches") {
    if (d.key !== ADMIN_KEY) return out_({ ok: false, error: "bad key" });
    props.setProperty("SCHED", JSON.stringify(d.items || []));
    return out_({ ok: true, n: (d.items || []).length });
  }

  // ثبت پیش‌بینی توسط کاربر، فقط با رمز شخصی خودش
  const pid = String(d.pid), cache = CacheService.getScriptCache(), fk = "fail:" + pid;
  if (Number(cache.get(fk) || 0) >= 5) return out_({ ok: false, error: "locked" }); // ۵ رمز غلط = ۱۵ دقیقه قفل
  const pins = JSON.parse(props.getProperty("PINS") || "{}");
  if (!pins[pid] || String(pins[pid]) !== String(d.pin)) {
    cache.put(fk, String(Number(cache.get(fk) || 0) + 1), 900);
    return out_({ ok: false, error: "pin" });
  }
  // قفل ساعت بازی: بعد از شروع بازی، ثبت یا ویرایش پذیرفته نمی‌شود (ساعت خود سرور گوگل ملاک است)
  const norm = x => String(x).replace(/[\u200c\s]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک");
  const sched = JSON.parse(props.getProperty("SCHED") || "[]"), now = Date.now();
  const s = sheet_(), t = new Date().toISOString(), rejected = [];
  let n = 0;
  (d.rows || []).forEach(r => {
    if (sched.length) {
      const it = sched.find(x => norm(x.home) === norm(r.home) && norm(x.away) === norm(r.away));
      if (!it || (it.ts && now >= it.ts)) { rejected.push(r.home + " - " + r.away); return; }
    }
    s.appendRow([t, pid, String(d.name), String(r.home), String(r.away), Number(r.h), Number(r.a)]);
    n++;
  });
  return out_({ ok: true, n: n, rejected: rejected });
}
// دریافت همه‌ی پیش‌بینی‌ها (فقط با کلید مدیر)
function doGet(e) {
  if (!e.parameter || e.parameter.key !== ADMIN_KEY) return out_({ error: "bad key" });
  const v = sheet_().getDataRange().getValues().slice(1);
  return out_({ rows: v.map(r => ({ t: r[0], pid: r[1], name: r[2], home: r[3], away: r[4], h: r[5], a: r[6] })) });
}
