# وضع ahwspaces.com خلف Cloudflare

**الحالة اليوم (٢٣ أكتوبر ٢٠٢٦): Cloudflare غير مفعّل.**

```
nameservers : dns1.registrar-servers.com / dns2.registrar-servers.com   (Namecheap)
A           : ahwspaces.com      → 216.198.79.1
CNAME       : www.ahwspaces.com  → e6245ee42b13a3d1.vercel-dns-017.com
الاستجابة   : server: Vercel ، ولا يوجد cf-ray
```

الموقع يعمل بشكل سليم بدونه. ما يضيفه Cloudflare هو **جدار حماية وفلترة بوتات وتحديد معدّل عند الحافة** — أي قبل أن يصل الطلب إلى Vercel أصلاً — بدلاً من داخل التطبيق.

> **لم يُنفَّذ أي من هذا.** الملف خطوات لتشغّلها أنت. أي تغيير في الـDNS يوقف الموقع لو تمّ بشكل خاطئ.

---

## قبل أن تبدأ — اقرأ هذا

**الخطر الحقيقي ليس الموقع، بل البريد.** عند إضافة نطاق، يستورد Cloudflare سجلات DNS الحالية تلقائياً — ولا يلتقط كل شيء دائماً. سجل `MX` مفقود يعني **توقّف البريد الوارد** دون أن يظهر أي خطأ.

سجّل ما لديك الآن قبل أي خطوة:

```bash
for t in A AAAA CNAME MX TXT NS; do
  echo "── $t"; dig +short $t ahwspaces.com
done > ~/dns-ahwspaces-before.txt
dig +short CNAME www.ahwspaces.com >> ~/dns-ahwspaces-before.txt
```

احتفظ بالملف. هو مرجعك للمقارنة وللتراجع.

---

## الخطوات بالترتيب

### ١. إضافة النطاق

في [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a site** → `ahwspaces.com` → اختر **Free**.

سيفحص Cloudflare النطاق ويعرض السجلات التي وجدها.

### ٢. مراجعة السجلات المستوردة — الخطوة الأهم

قارن القائمة المعروضة بملف `dns-ahwspaces-before.txt` **سجلاً بسجل**. تأكد تحديداً من:

| النوع | يجب أن يكون |
|---|---|
| `A` @ | `216.198.79.1` |
| `CNAME` www | `e6245ee42b13a3d1.vercel-dns-017.com` |
| `MX` | **كل** سجلات بريدك — أضفها يدوياً لو نقص أي منها |
| `TXT` | SPF و DKIM و DMARC وأي توثيق ملكية |

**لا تنتقل للخطوة التالية قبل أن تتطابق القائمتان.**

### ٣. حالة السحابة (Proxy)

| السجل | الحالة |
|---|---|
| `A` @ و `CNAME` www | 🟠 **Proxied** — هذا ما يفعّل الحماية |
| `MX` وسجلات البريد | ⬜ **DNS only** — تمريرها عبر Cloudflare يكسر البريد |

### ٤. تغيير الـnameservers في Namecheap

Namecheap → Domain List → `ahwspaces.com` → Manage → **Nameservers** → **Custom DNS** → ضع الاثنين اللذين أعطاهما Cloudflare.

الانتشار يستغرق من دقائق إلى ٢٤ ساعة. تحقّق بـ:

```bash
dig +short NS ahwspaces.com          # يجب أن تظهر nameservers الخاصة بـCloudflare
curl -sI https://ahwspaces.com | grep -i cf-ray   # ظهور cf-ray = الموقع يمر عبر Cloudflare
```

**قبل ظهور `cf-ray` لا تضبط أياً مما يلي** — الإعدادات لن تُطبَّق على شيء.

---

## الإعدادات بعد التفعيل

### SSL/TLS

| الإعداد | القيمة | السبب |
|---|---|---|
| Encryption mode | **Full (strict)** | Vercel يقدّم شهادة صحيحة. أي وضع أقل يجعل الوصلة بين Cloudflare وVercel غير متحقَّق منها |
| Always Use HTTPS | مُفعّل | |
| Minimum TLS Version | 1.2 | |

### HSTS — انتبه هنا

**الموقع يرسل HSTS بالفعل** من التطبيق:

```
strict-transport-security: max-age=63072000; includeSubDomains; preload
```

لو فعّلت HSTS من Cloudflare أيضاً، يصبح لديك **مصدران** لنفس الهيدر وسينحرفان عن بعضهما مع الوقت. اتركه في التطبيق.

وينطبق الأمر نفسه على كل هيدرات الأمان: **CSP و X-Frame-Options و X-Content-Type-Options و Referrer-Policy و Permissions-Policy كلها موجودة ومضبوطة بالفعل.** لا تضف خاصية "Security Headers" من Cloudflare فوقها.

### جدار الحماية

| الإعداد | القيمة |
|---|---|
| WAF → Managed Rules | فعّل **Cloudflare Free Managed Ruleset** |
| Bots → Bot Fight Mode | مُفعّل |

> راقب أول ٤٨ ساعة. Bot Fight Mode قد يحجب زواحف مشروعة. لو اختفى الموقع من Search Console، هذا أول مكان تنظر فيه.

### تحديد المعدّل (Rate Limiting)

التطبيق **لديه تحديد معدّل بالفعل** على `/api/contact` و`/api/portal/auth/login`، مخزّن في Postgres. ما يضيفه Cloudflare أنه يحجب الطلب **قبل** أن يستهلك دالة Vercel وقبل أن يكتب صفاً في قاعدة البيانات.

| المسار | القاعدة |
|---|---|
| `/admin/login` | ١٠ طلبات / دقيقة لكل IP |
| `/api/contact` | ٥ طلبات / ١٠ دقائق لكل IP |
| `/api/portal/auth/*` | ١٠ طلبات / دقيقة لكل IP |

### قواعد التخزين المؤقت

| المسار | القاعدة |
|---|---|
| `/_img/*` | Cache Everything · Edge TTL سنة — ملفات ثابتة محتواها لا يتغيّر |
| `/_next/static/*` | Cache Everything · Edge TTL سنة |
| `/admin/*` و `/api/*` و `/client/*` | **Bypass** — محتوى شخصي، تخزينه تسريب بيانات |

---

## Turnstile — ليس زر تشغيل

تفعيل Turnstile يحتاج **تعديل كود**، لا إعداداً من اللوحة:

1. إنشاء موقع Turnstile في Cloudflare والحصول على `site key` و`secret key`
2. إضافة الودجت في `apps/public-site/src/features/contact/components/ContactForm.tsx`
3. التحقق من الرمز **على الخادم** في `apps/public-site/src/app/api/contact/route.ts` قبل قبول الاستفسار
4. إضافة `https://challenges.cloudflare.com` إلى `script-src` و`frame-src` في سياسة CSP — **وإلا سيحجب الموقعُ الودجتَ بنفسه**

النموذج يحتوي بالفعل على honeypot يعيد نجاحاً كاذباً للبوتات. Turnstile يوقف البوتات الأذكى، لكنه يضيف احتكاكاً لكل زائر حقيقي. القرار يستحق قياس عدد الرسائل المزعجة الواردة فعلاً أولاً.

---

## التراجع

لو ساء شيء: أعد nameservers في Namecheap إلى `dns1.registrar-servers.com` و`dns2.registrar-servers.com`. الانتشار يستغرق الوقت نفسه. استخدم `dns-ahwspaces-before.txt` للتحقق من عودة كل سجل.
