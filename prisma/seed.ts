import 'dotenv/config';
import { PrismaClient, ShippingMethod, UserRole } from '../generated/prisma_client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

const IMG = (id: string) => `https://picsum.photos/seed/${id}/800/450`;

const POSTS = [
  {
    slug: 'oil-change-guide',
    title: 'راهنمای کامل تعویض روغن موتور در خانه',
    excerpt: 'تعویض روغن موتور یکی از مهم‌ترین کارهای نگهداری خودرو است. در این راهنما یاد می‌گیرید چگونه این کار را به تنهایی و با هزینه کمتر انجام دهید.',
    body: `<h2>چرا تعویض روغن مهم است؟</h2>
<p>روغن موتور وظیفه روان‌کاری قطعات متحرک، خنک نگه داشتن موتور و جلوگیری از خوردگی را برعهده دارد. روغن کهنه این توانایی‌ها را از دست می‌دهد و می‌تواند به موتور آسیب جدی بزند.</p>
<h2>ابزار مورد نیاز</h2>
<ul>
<li>آچار روغن مناسب خودرو شما</li>
<li>قیف روغن</li>
<li>ظرف جمع‌آوری روغن کهنه</li>
<li>روغن موتور با گرانروی مناسب</li>
<li>فیلتر روغن نو</li>
<li>دستکش و دستمال</li>
</ul>
<h2>مراحل تعویض</h2>
<p>ابتدا موتور را ۱۰ دقیقه گرم کنید تا روغن روان‌تر خارج شود. سپس خودرو را روی جک بالا ببرید و دسترسی به کارتل روغن داشته باشید. پیچ تخلیه را باز کرده و صبر کنید تا روغن کاملاً خارج شود. فیلتر روغن را نیز تعویض کنید. پیچ را ببندید، روغن نو را اضافه کنید و سطح آن را با گیج بررسی نمایید.</p>
<p>پس از روشن کردن موتور چند دقیقه صبر کنید و زیر ماشین را از نظر نشت بررسی کنید.</p>`,
    coverImage: IMG('oil-change'),
    author: 'علی احمدی',
    tags: ['نگهداری', 'موتور', 'DIY'],
    readTime: 7,
    publishedAt: new Date('2026-05-10'),
  },
  {
    slug: 'brake-pad-wear',
    title: 'چگونه فرسودگی لنت ترمز را تشخیص دهیم؟',
    excerpt: 'لنت ترمز یکی از مهم‌ترین اجزای ایمنی خودرو است. در این مقاله نشانه‌های فرسودگی لنت را بررسی می‌کنیم تا قبل از وقوع حادثه اقدام کنید.',
    body: `<h2>اهمیت بررسی لنت ترمز</h2>
<p>لنت‌های فرسوده می‌توانند مسافت ترمزگیری را به‌شدت افزایش دهند و در شرایط اضطراری خطرساز باشند. تشخیص به‌موقع فرسودگی می‌تواند جان شما را نجات دهد.</p>
<h2>نشانه‌های اصلی فرسودگی</h2>
<ul>
<li><strong>صدای جیر جیر:</strong> اولین علامت؛ ساینده فلزی روی دیسک کشیده می‌شود</li>
<li><strong>لرزش فرمان:</strong> هنگام ترمز‌گرفتن فرمان می‌لرزد</li>
<li><strong>طولانی شدن مسافت توقف:</strong> حتی با فشار زیاد، خودرو دیرتر می‌ایستد</li>
<li><strong>چراغ هشدار ترمز:</strong> در برخی مدل‌ها سنسور دارند</li>
</ul>
<h2>بازرسی بصری</h2>
<p>از پنجره رینگ لاستیک به دیسک و لنت نگاه کنید. ضخامت لنت باید حداقل ۳ میلیمتر باشد. اگر کمتر از این بود، فوراً تعویض کنید. توصیه می‌شود هر ۱۰۰۰۰ کیلومتر لنت‌ها را بررسی نمایید.</p>`,
    coverImage: IMG('brake-pad'),
    author: 'سارا محمدی',
    tags: ['ایمنی', 'ترمز'],
    readTime: 5,
    publishedAt: new Date('2026-05-05'),
  },
  {
    slug: 'spark-plug-comparison',
    title: 'مقایسه شمع‌های NGK و بوش؛ کدام بهتر است؟',
    excerpt: 'شمع‌های NGK و بوش دو برند پیشتاز در بازار ایران هستند. در این مقاله کیفیت، عمر و عملکرد آن‌ها را در مدل‌های مختلف خودرو مقایسه می‌کنیم.',
    body: `<h2>نقش شمع در موتور</h2>
<p>شمع وظیفه جرقه‌زنی و احتراق سوخت را برعهده دارد. شمع فرسوده باعث افزایش مصرف سوخت، کاهش قدرت موتور و بد روشن شدن خودرو می‌شود.</p>
<h2>NGK؛ برند ژاپنی با کیفیت پایدار</h2>
<p>شمع‌های NGK به خاطر پایداری دمایی و عمر طولانی شناخته می‌شوند. الکترود ایریدیومی آن‌ها مقاومت بالایی در برابر خوردگی دارد و تا ۱۰۰۰۰۰ کیلومتر قابل استفاده است.</p>
<h2>بوش؛ مهندسی آلمانی در قطعه کوچک</h2>
<p>شمع‌های بوش با فناوری الکترود دوگانه عملکرد بهتری در دور پایین موتور دارند. برای خودروهای ایرانی مثل پژو ۴۰۵ و پراید بیشتر توصیه می‌شوند.</p>
<h2>نتیجه‌گیری</h2>
<p>هر دو برند کیفیت بالایی دارند. NGK برای موتورهای با فشار بالا بهتر است و بوش برای خودروهای معمولی و شهری گزینه اقتصادی‌تری محسوب می‌شود.</p>`,
    coverImage: IMG('spark-plug'),
    author: 'محمد کریمی',
    tags: ['مقایسه', 'موتور', 'شمع'],
    readTime: 6,
    publishedAt: new Date('2026-04-28'),
  },
  {
    slug: 'cooling-system-summer',
    title: 'نگهداری سیستم خنک‌کننده خودرو در تابستان',
    excerpt: 'گرمای تابستان فشار زیادی به سیستم خنک‌کننده وارد می‌کند. این راهنما کمک می‌کند از جوش آمدن خودرو و آسیب به موتور جلوگیری کنید.',
    body: `<h2>چرا تابستان خطرناک‌تر است؟</h2>
<p>در دمای بالا، ضد یخ سریع‌تر تبخیر می‌شود، واترپمپ بیشتر کار می‌کند و رادیاتور فشار بیشتری را تحمل می‌کند. خودروهایی که در ترافیک شهری حرکت می‌کنند بیشتر در معرض جوشیدن هستند.</p>
<h2>بررسی‌های ضروری</h2>
<ul>
<li>سطح مایع ضدیخ را هر هفته چک کنید</li>
<li>غلظت ضد یخ را با گلیکومتر بسنجید (نسبت ۵۰-۵۰ با آب)</li>
<li>فن رادیاتور را قبل از سفرهای طولانی بررسی کنید</li>
<li>شلنگ‌های خنک‌کننده را از نظر ترک و نشتی بررسی کنید</li>
</ul>
<h2>اگر موتور جوشید چه کار کنیم؟</h2>
<p>بلافاصله کنار بزنید و موتور را خاموش کنید. هرگز در آن لحظه در رادیاتور را باز نکنید. ۳۰ دقیقه صبر کنید تا موتور خنک شود، سپس مایع خنک‌کننده اضافه کنید.</p>`,
    coverImage: IMG('cooling-system'),
    author: 'رضا تهرانی',
    tags: ['نگهداری', 'خنک‌کننده', 'فصلی'],
    readTime: 8,
    publishedAt: new Date('2026-04-20'),
  },
  {
    slug: 'best-oil-peugeot-206',
    title: 'بهترین روغن موتور برای پژو ۲۰۶؛ راهنمای انتخاب',
    excerpt: 'انتخاب روغن موتور مناسب برای پژو ۲۰۶ می‌تواند عمر موتور را افزایش و مصرف سوخت را کاهش دهد. در این مقاله بهترین گزینه‌ها را بررسی می‌کنیم.',
    body: `<h2>گرانروی مناسب برای ۲۰۶</h2>
<p>موتور TU5 پژو ۲۰۶ به روغن ۱۵W-۴۰ یا ۱۰W-۴۰ نیاز دارد. در زمستان‌های سرد گرانروی ۱۰W-۴۰ انتخاب بهتری است.</p>
<h2>برندهای توصیه‌شده</h2>
<ul>
<li><strong>ایران‌یاک ۱۵W-۴۰:</strong> مناسب‌ترین گزینه برای آب‌وهوای ایران</li>
<li><strong>بهران ۱۵W-۴۰:</strong> کیفیت قابل قبول با قیمت مناسب</li>
<li><strong>شل هلیکس HX7:</strong> گزینه اروپایی برای کسانی که کیفیت بالاتر می‌خواهند</li>
</ul>
<h2>دوره تعویض</h2>
<p>برای روغن معدنی، تعویض هر ۵۰۰۰ کیلومتر توصیه می‌شود. روغن نیمه‌سنتتیک را هر ۷۵۰۰ کیلومتر و روغن کاملاً سنتتیک را هر ۱۰۰۰۰ کیلومتر تعویض کنید.</p>`,
    coverImage: IMG('motor-oil'),
    author: 'زهرا موسوی',
    tags: ['توصیه', 'روغن', 'پژو'],
    readTime: 5,
    publishedAt: new Date('2026-04-15'),
  },
  {
    slug: 'air-filter-replacement',
    title: 'تعویض فیلتر هوا در خانه؛ ساده اما مؤثر',
    excerpt: 'فیلتر هوای مسدود باعث افزایش مصرف سوخت و کاهش قدرت موتور می‌شود. یاد بگیرید چطور آن را خودتان تعویض کنید.',
    body: `<h2>چرا فیلتر هوا مهم است؟</h2>
<p>فیلتر هوا از ورود گرد و خاک و ذرات جامد به داخل موتور جلوگیری می‌کند. فیلتر کثیف جریان هوا را محدود می‌کند و نسبت سوخت به هوا را برهم می‌زند.</p>
<h2>چه زمانی تعویض کنیم؟</h2>
<p>معمولاً هر ۱۵۰۰۰ تا ۲۰۰۰۰ کیلومتر یا حداقل سالی یک بار. اگر در مناطق گرد و خاکی رانندگی می‌کنید، بیشتر بررسی کنید.</p>
<h2>مراحل تعویض</h2>
<ul>
<li>درپوش جعبه فیلتر را باز کنید (معمولاً با چند پیچ یا قفل‌های پلاستیکی)</li>
<li>فیلتر کهنه را خارج کنید</li>
<li>داخل جعبه را با پارچه تمیز کنید</li>
<li>فیلتر نو را جایگزین کنید</li>
<li>درپوش را ببندید</li>
</ul>
<p>کل این کار کمتر از ۱۰ دقیقه طول می‌کشد و هیچ ابزار خاصی نیاز ندارد.</p>`,
    coverImage: IMG('air-filter'),
    author: 'علی احمدی',
    tags: ['آموزش', 'DIY', 'فیلتر'],
    readTime: 4,
    publishedAt: new Date('2026-04-08'),
  },
  {
    slug: 'suspension-failure-signs',
    title: 'نشانه‌های هشداردهنده خرابی سیستم تعلیق',
    excerpt: 'سیستم تعلیق معیوب نه تنها رانندگی را ناراحت می‌کند، بلکه می‌تواند کنترل خودرو را به خطر بیندازد. این نشانه‌ها را جدی بگیرید.',
    body: `<h2>وظیفه سیستم تعلیق</h2>
<p>سیستم تعلیق بین چرخ‌ها و بدنه خودرو قرار می‌گیرد و ضربات جاده را جذب می‌کند. همچنین تماس لاستیک با جاده را در شرایط مختلف حفظ می‌نماید.</p>
<h2>نشانه‌های خرابی</h2>
<ul>
<li><strong>ضربه‌های شدید:</strong> وقتی از دست‌انداز رد می‌شوید صدا یا ضربه شدید احساس می‌کنید</li>
<li><strong>کشیدن به یک طرف:</strong> خودرو روی جاده مستقیم به سمتی کشیده می‌شود</li>
<li><strong>لرزش فرمان:</strong> به خصوص در سرعت‌های بالا</li>
<li><strong>فرو رفتن زیاد در ترمز:</strong> جلوی خودرو هنگام ترمز به شدت فرو می‌رود</li>
<li><strong>صدای غیرطبیعی:</strong> صدای خش‌خش، کلیک یا جیغ هنگام پیچ زدن</li>
</ul>
<h2>راه‌حل</h2>
<p>سیستم تعلیق را هر ۵۰۰۰۰ کیلومتر بررسی کنید. در صورت مشاهده هر یک از نشانه‌های بالا به تعمیرگاه مراجعه کنید.</p>`,
    coverImage: IMG('suspension'),
    author: 'حسین رضایی',
    tags: ['ایمنی', 'تعلیق', 'عیب‌یابی'],
    readTime: 6,
    publishedAt: new Date('2026-04-01'),
  },
  {
    slug: 'car-battery-buying-guide',
    title: 'راهنمای خرید باطری مناسب برای خودرو',
    excerpt: 'انتخاب باطری اشتباه می‌تواند خودرو را سر بزنگاه از کار بیندازد. این راهنما کمک می‌کند باطری صحیح را با اطمینان انتخاب کنید.',
    body: `<h2>مشخصات مهم باطری</h2>
<p>دو پارامتر اصلی باطری ظرفیت (آمپر-ساعت) و جریان راه‌اندازی سرد (CCA) است. ظرفیت نشان می‌دهد چقدر انرژی ذخیره می‌کند و CCA توانایی راه‌اندازی موتور در سرما را مشخص می‌کند.</p>
<h2>چطور باطری مناسب پیدا کنم؟</h2>
<p>به کتابچه راهنمای خودرو مراجعه کنید. معمولاً سایز و ظرفیت مورد نیاز ذکر شده است. اگر دسترسی ندارید، باطری قدیمی را ببینید؛ مشخصات روی برچسب آن نوشته است.</p>
<h2>برندهای معتبر بازار ایران</h2>
<ul>
<li>اطلس BX (کره‌ای)</li>
<li>صبا (ایرانی - کیفیت مناسب)</li>
<li>واریتا (اروپایی - قیمت بالاتر)</li>
<li>دلکور (آمریکایی)</li>
</ul>
<h2>عمر باطری</h2>
<p>باطری معمولی ۳ تا ۵ سال دوام می‌آورد. در آب‌وهوای گرم عمر آن کمتر می‌شود. اگر خودرو با سختی استارت می‌زند، باطری را بررسی کنید.</p>`,
    coverImage: IMG('car-battery'),
    author: 'مریم صادقی',
    tags: ['راهنمای خرید', 'برق', 'باطری'],
    readTime: 7,
    publishedAt: new Date('2026-03-25'),
  },
  {
    slug: 'wheel-alignment-importance',
    title: 'تنظیم فرمان‌بندی خودرو؛ چرا و چه موقع؟',
    excerpt: 'تنظیم نبودن چرخ‌ها باعث سایش نامتقارن لاستیک، افزایش مصرف سوخت و خطرناک شدن رانندگی می‌شود.',
    body: `<h2>فرمان‌بندی چیست؟</h2>
<p>فرمان‌بندی یا wheel alignment تنظیم زاویه چرخ‌ها نسبت به یکدیگر و نسبت به بدنه خودرو است. سه پارامتر اصلی: camber (شیب عمودی)، toe (زاویه افقی) و caster (زاویه تکیه‌گاه فرمان).</p>
<h2>نشانه‌های نیاز به تنظیم</h2>
<ul>
<li>کشیدن خودرو به سمت چپ یا راست</li>
<li>سایش ناهموار لاستیک</li>
<li>فرمان در حالت مستقیم نیست</li>
<li>لرزش فرمان</li>
</ul>
<h2>چه زمانی تنظیم کنیم؟</h2>
<p>پس از تعویض لاستیک، بعد از ضربه شدید به جدول یا دست‌انداز، پس از تغییر قطعات سیستم تعلیق، و هر ۱۵۰۰۰ کیلومتر به عنوان نگهداری پیشگیرانه.</p>`,
    coverImage: IMG('wheel-alignment'),
    author: 'سارا محمدی',
    tags: ['نگهداری', 'لاستیک', 'ایمنی'],
    readTime: 5,
    publishedAt: new Date('2026-03-18'),
  },
  {
    slug: 'fake-parts-detection',
    title: 'قطعات تقلبی خودرو را چطور تشخیص دهیم؟',
    excerpt: 'قطعات تقلبی بازار ایران را فرا گرفته‌اند. یک قطعه تقلبی می‌تواند هزینه تعمیرات گزافی به بار بیاورد یا حتی جان شما را به خطر بیندازد.',
    body: `<h2>چرا قطعات تقلبی خطرناک‌اند؟</h2>
<p>قطعات تقلبی از مواد بی‌کیفیت ساخته می‌شوند و آزمون‌های استاندارد را پشت سر نمی‌گذارند. یک لنت ترمز تقلبی ممکن است در لحظه بحرانی از کار بیفتد.</p>
<h2>نشانه‌های قطعه اصل</h2>
<ul>
<li><strong>بسته‌بندی:</strong> بسته‌بندی اصلی دارای هلوگرام ضد جعل، بارکد قابل ردیابی و چاپ با کیفیت است</li>
<li><strong>وزن:</strong> قطعات اصل معمولاً سنگین‌تر از نمونه تقلبی هستند</li>
<li><strong>کد شناسایی:</strong> برندهای معتبر کد QR یا سریال قابل استعلام دارند</li>
<li><strong>فروشنده:</strong> از نمایندگی‌های رسمی یا فروشگاه‌های معتبر خرید کنید</li>
</ul>
<h2>قطعاتی که بیشتر جعل می‌شوند</h2>
<p>فیلتر روغن، فیلتر هوا، لنت ترمز، شمع، و روغن موتور بیشترین نرخ جعل را دارند. این قطعات را حتماً از منابع معتبر تهیه کنید.</p>`,
    coverImage: IMG('car-parts'),
    author: 'رضا تهرانی',
    tags: ['آگاهی‌رسانی', 'کیفیت', 'خرید'],
    readTime: 8,
    publishedAt: new Date('2026-03-12'),
  },
  {
    slug: 'car-winter-care',
    title: 'مراقبت از خودرو در فصل زمستان',
    excerpt: 'سرما، یخ و برف چالش‌های خاصی برای خودرو ایجاد می‌کند. با این راهنما خودروی خود را برای زمستان آماده کنید.',
    body: `<h2>آماده‌سازی قبل از زمستان</h2>
<p>بهترین زمان برای آماده‌سازی، اوایل پاییز است. منتظر نمانید تا دما زیر صفر برود و بعد دنبال قطعات بگردید.</p>
<h2>چک‌لیست زمستانی</h2>
<ul>
<li>بررسی و تعویض ضدیخ؛ غلظت مناسب برای دمای -۲۰ درجه</li>
<li>تعویض لاستیک‌های تابستانه با لاستیک زمستانی یا چهارفصل</li>
<li>بررسی سطح روغن موتور؛ در سرما روغن غلیظ‌تر می‌شود</li>
<li>چک کردن باطری؛ سرما ظرفیت باطری را کاهش می‌دهد</li>
<li>بررسی سیستم گرمایش و بخاری</li>
<li>تست برف‌پاک‌کن‌ها و پر کردن آب پاک‌کن ضدیخ</li>
</ul>
<h2>در روزهای یخ‌زده</h2>
<p>هرگز با آب داغ یخ شیشه را آب نکنید؛ شیشه ممکن است بشکند. از اسکرپر مخصوص یا اسپری ضدیخ شیشه استفاده کنید. موتور را چند دقیقه قبل از حرکت روشن نگه دارید تا گرم شود.</p>`,
    coverImage: IMG('winter-car'),
    author: 'محمد کریمی',
    tags: ['نگهداری', 'فصلی', 'زمستان'],
    readTime: 6,
    publishedAt: new Date('2026-03-05'),
  },
  {
    slug: 'water-pump-replacement',
    title: 'راهنمای کامل تشخیص و تعویض واترپمپ',
    excerpt: 'واترپمپ معیوب می‌تواند به سرعت موتور را از پا درآورد. یاد بگیرید چه وقت و چطور باید آن را تعویض کنید.',
    body: `<h2>واترپمپ چیست و چه کار می‌کند؟</h2>
<p>واترپمپ مایع خنک‌کننده را در مدار سیستم خنک‌کننده به جریان در می‌آورد. این پمپ معمولاً توسط تسمه تایم یا تسمه دینام به حرکت در می‌آید.</p>
<h2>علائم خرابی واترپمپ</h2>
<ul>
<li>جوشیدن مکرر موتور</li>
<li>نشت مایع خنک‌کننده زیر ماشین</li>
<li>صدای ویز ویز از محل واترپمپ</li>
<li>بالا رفتن دمای موتور در ترافیک</li>
</ul>
<h2>زمان تعویض</h2>
<p>بیشتر سازندگان تعویض هر ۶۰۰۰۰ تا ۱۰۰۰۰۰ کیلومتر را توصیه می‌کنند. اگر تسمه تایم هم تعویض می‌کنید، بهتر است واترپمپ را هم با آن عوض کنید تا دو بار هزینه دستمزد پرداخت نکنید.</p>
<h2>هزینه تعویض</h2>
<p>هزینه قطعه بسته به مدل خودرو و برند واترپمپ متفاوت است. دستمزد نصب معمولاً به دلیل دسترسی سخت، هزینه قابل توجهی دارد.</p>`,
    coverImage: IMG('water-pump'),
    author: 'علی احمدی',
    tags: ['آموزش', 'DIY', 'خنک‌کننده', 'موتور'],
    readTime: 10,
    publishedAt: new Date('2026-02-25'),
  },
  {
    slug: 'oil-filter-types',
    title: 'انواع فیلتر روغن خودرو و تفاوت‌های آن‌ها',
    excerpt: 'فیلتر روغن‌های مختلف عملکرد و عمر متفاوتی دارند. انتخاب فیلتر مناسب می‌تواند موتور شما را سال‌ها سالم نگه دارد.',
    body: `<h2>چرا فیلتر روغن مهم است؟</h2>
<p>فیلتر روغن ذرات فلزی، کربن و آلودگی‌های دیگر را از روغن حذف می‌کند. روغن تصفیه‌شده کمتر سایش ایجاد می‌کند و عمر موتور را افزایش می‌دهد.</p>
<h2>انواع فیلتر روغن</h2>
<ul>
<li><strong>فیلتر کاغذی (Cellulose):</strong> ارزان‌ترین نوع؛ مناسب برای روغن‌های معدنی؛ عمر ۵۰۰۰ کیلومتر</li>
<li><strong>فیلتر ترکیبی (Synthetic Blend):</strong> ترکیب کاغذ و الیاف مصنوعی؛ عمر ۷۵۰۰ کیلومتر</li>
<li><strong>فیلتر کاملاً مصنوعی (Full Synthetic):</strong> بهترین فیلتراسیون؛ عمر ۱۰۰۰۰-۱۵۰۰۰ کیلومتر</li>
</ul>
<h2>برندهای پیشنهادی</h2>
<p>بوش، مان فیلتر و ایساکو از بهترین گزینه‌ها برای خودروهای ایرانی هستند. از خرید فیلترهای بدون برند یا برند ناشناس خودداری کنید.</p>`,
    coverImage: IMG('oil-filter'),
    author: 'حسین رضایی',
    tags: ['مقایسه', 'فیلتر', 'روغن'],
    readTime: 6,
    publishedAt: new Date('2026-02-18'),
  },
  {
    slug: 'electrical-system-maintenance',
    title: 'نگهداری از سیستم برق خودرو؛ نکاتی که باید بدانید',
    excerpt: 'سیستم برق خودرو پیچیده است اما با چند اقدام ساده می‌توانید از خرابی‌های ناگهانی پیشگیری کنید.',
    body: `<h2>اجزای اصلی سیستم برق</h2>
<p>سیستم برق خودرو شامل باطری، دینام، استارت، فیوزها، کابل‌کشی و سنسورهای مختلف است. هر کدام از این اجزا نقش حیاتی دارند.</p>
<h2>بررسی‌های دوره‌ای</h2>
<ul>
<li>سطح آب باطری (در باطری‌های قدیمی) را ماهانه چک کنید</li>
<li>اتصال کابل‌های باطری را بررسی کنید؛ نباید شل یا زنگ‌زده باشند</li>
<li>اگر دینام خوب کار می‌کند ولتاژ باطری باید بین ۱۳.۵ تا ۱۴.۵ ولت باشد</li>
<li>فیوزها را هر ساله بازرسی کنید</li>
</ul>
<h2>علائم مشکل برقی</h2>
<p>چراغ‌های ضعیف، کند استارت خوردن، چراغ‌های هشدار روی داشبورد، یا قطع و وصل شدن دستگاه‌های الکترونیکی نشانه مشکل برقی هستند. این علائم را جدی بگیرید.</p>`,
    coverImage: IMG('electrical'),
    author: 'زهرا موسوی',
    tags: ['برق', 'نگهداری', 'باطری'],
    readTime: 7,
    publishedAt: new Date('2026-02-10'),
  },
  {
    slug: 'oil-leak-detection',
    title: 'تشخیص و رفع نشت روغن در خودرو',
    excerpt: 'نشت روغن موتور اگر به موقع درمان نشود می‌تواند به موتور آسیب جدی بزند. این راهنما محل نشت را شناسایی و راه‌حل ارائه می‌دهد.',
    body: `<h2>چرا نشت روغن جدی است؟</h2>
<p>روغن موتور سیستم روان‌کاری است. اگر سطح آن پایین بیفتد، قطعات موتور با اصطکاک شدید کار می‌کنند و ممکن است در عرض چند کیلومتر موتور از کار بیفتد.</p>
<h2>تشخیص محل نشت</h2>
<ul>
<li>پارچه تمیز سفید را زیر خودرو بگذارید و صبح بررسی کنید</li>
<li>لکه روغنی روی زمین زیر موتور نشانه نشت است</li>
<li>بوی سوختن روغن هنگام گرم شدن موتور (روغن روی اگزوز می‌ریزد)</li>
<li>دود آبی رنگ از اگزوز نشانه سوختن روغن در موتور است</li>
</ul>
<h2>شایع‌ترین منابع نشت</h2>
<p>واشر سرسیلندر، کاسه نمدها، درپوش سوپاپ، و پیچ تخلیه روغن. تعمیر هر کدام هزینه و پیچیدگی متفاوتی دارد. با یک تعمیرکار معتبر مشورت کنید.</p>`,
    coverImage: IMG('oil-leak'),
    author: 'رضا تهرانی',
    tags: ['موتور', 'عیب‌یابی', 'نگهداری'],
    readTime: 8,
    publishedAt: new Date('2026-02-03'),
  },
  {
    slug: 'brake-disc-care',
    title: 'نحوه صحیح مراقبت از دیسک و لنت ترمز',
    excerpt: 'دیسک و لنت ترمز دو قطعه حیاتی ایمنی هستند که با مراقبت صحیح می‌توان عمرشان را تا دو برابر افزایش داد.',
    body: `<h2>دیسک ترمز چگونه فرسوده می‌شود؟</h2>
<p>دیسک ترمز با اصطکاک لنت در حین ترمز‌گرفتن نازک می‌شود. همچنین گرمای شدید می‌تواند باعث تاب برداشتن دیسک شود که به لرزش فرمان منجر می‌گردد.</p>
<h2>افزایش عمر دیسک و لنت</h2>
<ul>
<li>از ترمز ناگهانی خودداری کنید؛ تدریجی ترمز بگیرید</li>
<li>پس از شستن خودرو یا رد شدن از آب چند بار آرام ترمز بگیرید تا رطوبت دیسک خشک شود</li>
<li>سرعت را قبل از رسیدن به ترافیک با گاز گرفتن کاهش دهید نه فقط با ترمز</li>
<li>از قطعات مارک‌دار استفاده کنید؛ لنت ارزان قیمت دیسک را سریع‌تر می‌ساید</li>
</ul>
<h2>زمان تعویض</h2>
<p>ضخامت لنت کمتر از ۳ میلیمتر و ضخامت دیسک کمتر از حداقل مجاز (روی خود دیسک حک شده) سیگنال تعویض هستند. هر دو را همزمان تعویض کنید.</p>`,
    coverImage: IMG('brake-disc'),
    author: 'مریم صادقی',
    tags: ['ایمنی', 'ترمز', 'نگهداری'],
    readTime: 5,
    publishedAt: new Date('2026-01-28'),
  },
];

async function main() {
  // ── Posts (idempotent) ─────────────────────────────────────────────────────
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    const now = new Date();
    await prisma.post.createMany({
      data: POSTS.map(p => ({ ...p, updatedAt: now })),
    });
    console.log(`  ${POSTS.length} blog posts seeded.`);
  }

  // ── FAQs (idempotent — runs even when the rest is already seeded) ──────────
  const faqCount = await prisma.faq.count();
  if (faqCount === 0) {
    await prisma.faq.createMany({
      data: [
        {
          question: 'چگونه از اصالت قطعات مطمئن شوم؟',
          answer: 'تمامی محصولات کارخودرو دارای ضمانت اصالت کالا هستند و از منابع معتبر و رسمی تأمین می‌شوند. کد پیگیری ضمانت روی بسته‌بندی هر محصول درج شده است.',
          sortOrder: 1,
        },
        {
          question: 'مدت زمان ارسال چقدر است؟',
          answer: 'سفارشات تهران معمولاً ۲۴ ساعته و سایر شهرها ظرف ۴۸ تا ۷۲ ساعت کاری ارسال می‌شوند. پس از ثبت سفارش، کد رهگیری پستی از طریق پیامک ارسال می‌گردد.',
          sortOrder: 2,
        },
        {
          question: 'آیا امکان مرجوع کردن کالا وجود دارد؟',
          answer: 'بله. تا ۷ روز پس از دریافت کالا، در صورت عدم استفاده و سالم بودن بسته‌بندی، امکان مرجوع و بازگشت وجه وجود دارد.',
          sortOrder: 3,
        },
        {
          question: 'چه روش‌های پرداختی پذیرفته می‌شود؟',
          answer: 'پرداخت آنلاین از طریق درگاه بانکی، پرداخت در محل (کارت‌خوان) و پرداخت کارت به کارت برای سفارش‌های خاص امکان‌پذیر است.',
          sortOrder: 4,
        },
        {
          question: 'چطور قطعه مناسب خودرو خود را پیدا کنم؟',
          answer: 'از فیلتر جستجو بر اساس مدل خودرو در صفحه محصولات استفاده کنید. همچنین می‌توانید از طریق شماره تلفن پشتیبانی با کارشناسان فنی ما مشورت نمایید.',
          sortOrder: 5,
        },
        {
          question: 'آیا برای محصولات گارانتی وجود دارد؟',
          answer: 'اکثر محصولات دارای گارانتی برند سازنده هستند. مدت گارانتی روی صفحه هر محصول قید شده است.',
          sortOrder: 6,
        },
      ],
    });
    console.log('  6 FAQs seeded.');
  }

  const count = await prisma.product.count();
  if (count > 0) {
    console.log(`Already seeded (${count} products). Skipping.`);
    return;
  }

  // ── Provinces ──────────────────────────────────────────────────────────────
  const provinceNames = [
    'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز',
    'ایلام', 'بوشهر', 'تهران', 'چهارمحال و بختیاری', 'خراسان جنوبی',
    'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 'سمنان',
    'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان',
    'کرمان', 'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان',
    'لرستان', 'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد',
  ];
  const provinces = await prisma.$transaction(
    provinceNames.map(name => prisma.province.create({ data: { name } })),
  );
  const provinceId = new Map(provinces.map(p => [p.name, p.id]));

  // ── Cities (one representative city per province) ──────────────────────────
  const cities = await prisma.$transaction(
    provinces.map(p => prisma.city.create({ data: { name: p.name, provinceId: p.id } })),
  );
  const cityId = new Map(cities.map(c => [c.name, c.id]));

  // ── Car Brands ─────────────────────────────────────────────────────────────
  const carBrandsInput = [
    { name: 'ایران خودرو', slug: 'iran-khodro', logoImage: '/tempt/ezam.webp', productCount: 4520 },
    { name: 'سایپا',       slug: 'saipa',        logoImage: '/tempt/ezam.webp', productCount: 3210 },
    { name: 'تویوتا',      slug: 'toyota',       logoImage: '/tempt/ezam.webp', productCount: 2840 },
    { name: 'هیوندای',     slug: 'hyundai',      logoImage: '/tempt/ezam.webp', productCount: 2150 },
    { name: 'کیا',         slug: 'kia',          logoImage: '/tempt/ezam.webp', productCount: 1980 },
    { name: 'نیسان',       slug: 'nissan',       logoImage: '/tempt/ezam.webp', productCount: 1750 },
    { name: 'مزدا',        slug: 'mazda',        logoImage: '/tempt/ezam.webp', productCount: 1340 },
    { name: 'بی‌ام‌و',    slug: 'bmw',          logoImage: '/tempt/ezam.webp', productCount: 2100 },
    { name: 'مرسدس',       slug: 'mercedes',     logoImage: '/tempt/ezam.webp', productCount: 1890 },
    { name: 'پژو',         slug: 'peugeot',      logoImage: '/tempt/ezam.webp', productCount: 3200 },
    { name: 'رنو',         slug: 'renault',      logoImage: '/tempt/ezam.webp', productCount: 2100 },
    { name: 'فولکس',       slug: 'volkswagen',   logoImage: '/tempt/ezam.webp', productCount: 1560 },
  ];
  const carBrands = await prisma.$transaction(
    carBrandsInput.map(b => prisma.carBrand.create({ data: b })),
  );
  // keyed by 1-based position matching mock carBrandId
  const cbId = (mockId: number) => carBrands[mockId - 1].id;

  // ── Car Models ─────────────────────────────────────────────────────────────
  // yearStart/yearEnd are Gregorian (Jalali + 621)
  const carModelsInput = [
    { carBrandId: cbId(1), name: 'پژو ۲۰۶',   yearStart: 2001, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'پژو ۴۰۵',   yearStart: 1991, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'سمند',       yearStart: 2002, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'دنا',        yearStart: 2012, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'پارس',       yearStart: 1998, yearEnd: 2022 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'پراید',      yearStart: 1989, yearEnd: 2021 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'تیبا',       yearStart: 2010, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'ساینا',      yearStart: 2015, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'شاهین',      yearStart: 2021, yearEnd: null,                  image: '/tempt/quick.jpg' },
    { carBrandId: cbId(3), name: 'کرولا',      yearStart: 2006, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(3), name: 'کمری',       yearStart: 2001, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(3), name: 'لندکروزر',   yearStart: 1996, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(4), name: 'آکسنت',      yearStart: 2009, yearEnd: 2022 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(4), name: 'النترا',     yearStart: 2006, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(4), name: 'توسان',      yearStart: 2013, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(5), name: 'ریو',        yearStart: 2009, yearEnd: 2022 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(5), name: 'سراتو',      yearStart: 2011, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
  ];
  const carModels = await prisma.$transaction(
    carModelsInput.map(m => prisma.carModel.create({ data: m })),
  );
  const cmId = (mockId: number) => carModels[mockId - 1].id;

  // ── Parts Brands ───────────────────────────────────────────────────────────
  const partsBrandsInput = [
    { name: 'بوش' },       // 1
    { name: 'ایساکو' },    // 2
    { name: 'NGK' },       // 3
    { name: 'واریان' },    // 4
    { name: 'کیان‌پارت' }, // 5
    { name: 'تکنو' },      // 6
    { name: 'مپکو' },      // 7
    { name: 'فدک' },       // 8
  ];
  const partsBrands = await prisma.$transaction(
    partsBrandsInput.map(b => prisma.partsBrand.create({ data: b })),
  );
  const pbId = (mockId: number) => partsBrands[mockId - 1].id;

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoriesInput = [
    { key: 'engine',      name: 'موتور و قطعات',   image: '/logo.png', sortOrder: 1, productCount: 1284 },
    { key: 'body',        name: 'بدنه و شیشه',     image: '/logo.png', sortOrder: 2, productCount: 856  },
    { key: 'electrical',  name: 'برق و روشنایی',   image: '/logo.png', sortOrder: 3, productCount: 642  },
    { key: 'brake',       name: 'ترمز و تعلیق',    image: '/logo.png', sortOrder: 4, productCount: 524  },
    { key: 'cooling',     name: 'سیستم خنک‌کننده', image: '/logo.png', sortOrder: 5, productCount: 398  },
    { key: 'oil',         name: 'روغن و مایعات',   image: '/logo.png', sortOrder: 6, productCount: 312  },
    { key: 'accessories', name: 'لوازم جانبی',     image: '/logo.png', sortOrder: 7, productCount: 756  },
    { key: 'filter',      name: 'فیلترها',         image: '/logo.png', sortOrder: 8, productCount: 480  },
  ];
  const categories = await prisma.$transaction(
    categoriesInput.map(c => prisma.category.create({ data: c })),
  );
  const catId = (mockId: number) => categories[mockId - 1].id;

  // ── Products ───────────────────────────────────────────────────────────────
  type ProductSeed = {
    sku: string; name: string;
    pbMock: number; cmMock: number; catMock: number;
    price: number; oldPrice?: number;
    isOffer: boolean; stock: number;
    sales: number; views: number;
    rating: number; reviewCount: number;
    warranty: string; origin: string;
    pack: number; carton: number; isOriginal: boolean;
    desc?: string;
  };

  const productSeeds: ProductSeed[] = [
    { sku: 'BSH-ENG-206-001', name: 'فیلتر روغن موتور اصلی بوش',       pbMock: 1, cmMock: 1,  catMock: 1, price: 85000,                  isOffer: false, stock: 34, sales: 1240, views: 4520, rating: 4.5, reviewCount: 128, warranty: '۶ ماه',  origin: 'آلمان', pack: 1,  carton: 12, isOriginal: true,
      desc: 'فیلتر روغن موتور بوش با جدیدترین تکنولوژی‌های فیلتراسیون، آلودگی‌های ذره‌ای و میکروسکوپی موجود در روغن موتور را به طور کامل جذب می‌کند. پوشش ضدخوردگی و مقاومت در برابر دمای بالا و فشار روغن. تناوب تعویض: هر ۵٬۰۰۰ کیلومتر یا ۶ ماه.' },
    { sku: 'ISC-ENG-405-002', name: 'واتر پمپ موتور ایساکو اصلی',       pbMock: 2, cmMock: 2,  catMock: 1, price: 1150000, oldPrice: 1400000, isOffer: true,  stock: 12, sales: 340,  views: 1820, rating: 4.2, reviewCount: 43,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 6,  isOriginal: true,
      desc: 'واتر پمپ موتور ایساکو برای خودروهای پژو ۴۰۵ طراحی شده و دارای تأییدیه‌های رسمی ایران‌خودرو است. سیستم آب‌بندی مضاعف از نشت مایع خنک‌کننده جلوگیری می‌کند. دبی آب: ۶۰ لیتر در دقیقه.' },
    { sku: 'VAR-ENG-PRA-003', name: 'کیت کلاچ کامل سه‌پارچه واریان',    pbMock: 4, cmMock: 6,  catMock: 1, price: 1200000, oldPrice: 1800000, isOffer: true,  stock: 8,  sales: 890,  views: 5240, rating: 4.6, reviewCount: 189, warranty: '۲۴ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: true,
      desc: 'کیت کلاچ کامل سه‌پارچه واریان شامل صفحه کلاچ، دیسک کلاچ و بلبرینگ آزاد. مواد اصطکاکی درجه یک با قطر دیسک ۱۸۰ میلی‌متر و گشتاور انتقالی حداکثر ۱۸۰ نیوتون متر.' },
    { sku: 'BSH-ENG-SMD-004', name: 'تسمه تایم با مجموعه کامل بوش',     pbMock: 1, cmMock: 3,  catMock: 1, price: 450000,  oldPrice: 600000,  isOffer: true,  stock: 19, sales: 520,  views: 2800, rating: 4.3, reviewCount: 78,  warranty: '۱۲ ماه', origin: 'آلمان', pack: 1,  carton: 6,  isOriginal: true  },
    { sku: 'MPK-ENG-206-005', name: 'گژپین موتور استاندارد مپکو',        pbMock: 7, cmMock: 1,  catMock: 1, price: 320000,                     isOffer: false, stock: 6,  sales: 280,  views: 1540, rating: 4.1, reviewCount: 32,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'KYN-ENG-TBA-006', name: 'فیلتر هوای موتور کیان‌پارت',       pbMock: 5, cmMock: 7,  catMock: 1, price: 75000,                      isOffer: false, stock: 47, sales: 1580, views: 6200, rating: 4.6, reviewCount: 91,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'TKN-ENG-DNA-007', name: 'کمربند تایم با کیت کامل تکنو',     pbMock: 6, cmMock: 4,  catMock: 1, price: 290000,  oldPrice: 380000,  isOffer: true,  stock: 15, sales: 430,  views: 2100, rating: 4.3, reviewCount: 38,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 6,  isOriginal: false },
    { sku: 'ISC-ENG-PRA-008', name: 'واشر سرسیلندر موتور ایساکو',        pbMock: 2, cmMock: 6,  catMock: 1, price: 580000,                     isOffer: false, stock: 0,  sales: 190,  views: 1020, rating: 4.0, reviewCount: 24,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 6,  isOriginal: true  },
    { sku: 'BSH-BRK-405-009', name: 'لنت ترمز جلو دیسکی بوش',           pbMock: 1, cmMock: 2,  catMock: 4, price: 420000,                     isOffer: false, stock: 22, sales: 720,  views: 3400, rating: 4.8, reviewCount: 74,  warranty: '۱۲ ماه', origin: 'آلمان', pack: 2,  carton: 20, isOriginal: true,
      desc: 'لنت ترمز جلو دیسکی بوش با مواد اصطکاکی پیشرفته، قدرت ترمزگیری بالا و صدای کمینه. سازگار با ECE R-90. ضخامت: ۱۵ میلی‌متر، مقاومت حرارتی تا ۵۰۰ درجه.' },
    { sku: 'VAR-BRK-SMD-010', name: 'دیسک ترمز چرخ جلو واریان',          pbMock: 4, cmMock: 3,  catMock: 4, price: 850000,  oldPrice: 1100000, isOffer: true,  stock: 11, sales: 360,  views: 2250, rating: 4.5, reviewCount: 52,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'TKN-BRK-TBA-011', name: 'کمک فنر جلو گازی تکنو',             pbMock: 6, cmMock: 7,  catMock: 4, price: 920000,  oldPrice: 1300000, isOffer: true,  stock: 7,  sales: 490,  views: 2900, rating: 4.3, reviewCount: 78,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'FDK-BRK-PRA-012', name: 'لنت ترمز عقب کفشکی فدک',            pbMock: 8, cmMock: 6,  catMock: 4, price: 185000,                     isOffer: false, stock: 38, sales: 840,  views: 4100, rating: 4.2, reviewCount: 95,  warranty: '۶ ماه',  origin: 'ایران', pack: 2,  carton: 20, isOriginal: false },
    { sku: 'KYN-BRK-SHN-013', name: 'روغن ترمز ایمنی ۵۰۰ میلی‌لیتر',    pbMock: 5, cmMock: 9,  catMock: 4, price: 95000,                      isOffer: false, stock: 25, sales: 660,  views: 3100, rating: 4.4, reviewCount: 58,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'NGK-ELC-206-014', name: 'شمع خودرو NGK اصلی',                pbMock: 3, cmMock: 1,  catMock: 3, price: 340000,                     isOffer: false, stock: 30, sales: 1100, views: 5500, rating: 4.4, reviewCount: 67,  warranty: '۱۲ ماه', origin: 'ژاپن',  pack: 4,  carton: 40, isOriginal: true,
      desc: 'شمع خودرو NGK اصلی با فناوری الکترود ایریدیوم. احتراق بهتر، مصرف کمتر سوخت. فاصله الکترود: ۱.۱ میلی‌متر، رزوه: M14×1.25.' },
    { sku: 'BSH-ELC-405-015', name: 'دلکو کامل برق بوش',                 pbMock: 1, cmMock: 2,  catMock: 3, price: 2100000, oldPrice: 2800000, isOffer: true,  stock: 4,  sales: 210,  views: 1380, rating: 4.5, reviewCount: 67,  warranty: '۲۴ ماه', origin: 'آلمان', pack: 1,  carton: 4,  isOriginal: true  },
    { sku: 'BSH-ELC-SMD-016', name: 'سنسور اکسیژن لامبدا بوش',            pbMock: 1, cmMock: 3,  catMock: 3, price: 680000,  oldPrice: 950000,  isOffer: true,  stock: 9,  sales: 380,  views: 2100, rating: 4.4, reviewCount: 56,  warranty: '۱۲ ماه', origin: 'آلمان', pack: 1,  carton: 6,  isOriginal: true  },
    { sku: 'TKN-ELC-DNA-017', name: 'باتری ۶۰ آمپر تکنو',                pbMock: 6, cmMock: 4,  catMock: 3, price: 1850000,                    isOffer: false, stock: 14, sales: 570,  views: 3400, rating: 4.6, reviewCount: 83,  warranty: '۲۴ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'MPK-ELC-SNA-018', name: 'چراغ جلو دو چشم کامل مپکو',         pbMock: 7, cmMock: 8,  catMock: 3, price: 1200000, oldPrice: 1600000, isOffer: true,  stock: 6,  sales: 290,  views: 1750, rating: 4.1, reviewCount: 29,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'ISC-CLN-PRA-019', name: 'رادیاتور آب کامل ایساکو',            pbMock: 2, cmMock: 6,  catMock: 5, price: 1450000, oldPrice: 1900000, isOffer: true,  stock: 5,  sales: 220,  views: 1580, rating: 4.7, reviewCount: 34,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: true  },
    { sku: 'KYN-CLN-206-020', name: 'ترموستات خنک‌کننده کیان‌پارت',       pbMock: 5, cmMock: 1,  catMock: 5, price: 180000,                     isOffer: false, stock: 28, sales: 480,  views: 2400, rating: 4.3, reviewCount: 48,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'FDK-CLN-SMD-021', name: 'شیلنگ رادیاتور بالایی فدک',          pbMock: 8, cmMock: 3,  catMock: 5, price: 95000,                      isOffer: false, stock: 41, sales: 680,  views: 3200, rating: 4.0, reviewCount: 62,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'TKN-CLN-TBA-022', name: 'پنکه رادیاتور برقی تکنو',            pbMock: 6, cmMock: 7,  catMock: 5, price: 750000,  oldPrice: 980000,  isOffer: true,  stock: 10, sales: 310,  views: 1950, rating: 4.4, reviewCount: 37,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'BSH-OIL-206-023', name: 'روغن موتور ۴ لیتری ۵W40 بوش',       pbMock: 1, cmMock: 1,  catMock: 6, price: 580000,                     isOffer: false, stock: 60, sales: 2350, views: 8900, rating: 4.7, reviewCount: 215, warranty: '۶ ماه',  origin: 'آلمان', pack: 1,  carton: 6,  isOriginal: true,
      desc: 'روغن موتور ۴ لیتری بوش ویسکوزیته 5W-40 برای موتورهای بنزینی و دیزلی مدرن. استاندارد API SN Plus / CF. کاهش سایش و بهبود عملکرد. فاصله تعویض: ۱۰٬۰۰۰ کیلومتر یا ۱ سال.' },
    { sku: 'KYN-OIL-DNA-024', name: 'روغن گیربکس اتوماتیک کیان‌پارت',     pbMock: 5, cmMock: 4,  catMock: 6, price: 420000,  oldPrice: 560000,  isOffer: true,  stock: 33, sales: 560,  views: 2800, rating: 4.4, reviewCount: 89,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 6,  isOriginal: false },
    { sku: 'MPK-OIL-SHN-025', name: 'گریس چرخ ۵ کیلوگرمی مپکو',           pbMock: 7, cmMock: 9,  catMock: 6, price: 310000,                     isOffer: false, stock: 17, sales: 190,  views: 980,  rating: 4.2, reviewCount: 28,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 6,  isOriginal: false },
    { sku: 'NGK-OIL-SNA-026', name: 'مایع ترمز DOT4 اصلی NGK',            pbMock: 3, cmMock: 8,  catMock: 6, price: 125000,                     isOffer: false, stock: 44, sales: 820,  views: 4100, rating: 4.5, reviewCount: 72,  warranty: '۶ ماه',  origin: 'ژاپن',  pack: 1,  carton: 12, isOriginal: true  },
    { sku: 'TKN-BDY-405-027', name: 'برف‌پاک‌کن جلو کامل تکنو',           pbMock: 6, cmMock: 2,  catMock: 2, price: 185000,  oldPrice: 280000,  isOffer: true,  stock: 23, sales: 740,  views: 4500, rating: 4.2, reviewCount: 112, warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'ISC-BDY-PRA-028', name: 'آینه بغل چپ کامل ایساکو',             pbMock: 2, cmMock: 6,  catMock: 2, price: 650000,                     isOffer: false, stock: 9,  sales: 430,  views: 2300, rating: 4.3, reviewCount: 45,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: true  },
    { sku: 'VAR-BDY-SMD-029', name: 'گلگیر جلو اصلی واریان',               pbMock: 4, cmMock: 3,  catMock: 2, price: 980000,  oldPrice: 1300000, isOffer: true,  stock: 4,  sales: 180,  views: 1200, rating: 4.1, reviewCount: 23,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'FDK-BDY-TBA-030', name: 'شیشه جلو اتاق STD فدک',               pbMock: 8, cmMock: 7,  catMock: 2, price: 2400000,                    isOffer: false, stock: 0,  sales: 95,   views: 780,  rating: 4.0, reviewCount: 12,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 2,  isOriginal: false },
    { sku: 'BSH-FLT-DNA-031', name: 'فیلتر کابین تهویه هوا بوش',           pbMock: 1, cmMock: 4,  catMock: 8, price: 120000,  oldPrice: 180000,  isOffer: true,  stock: 52, sales: 1050, views: 5200, rating: 4.6, reviewCount: 88,  warranty: '۶ ماه',  origin: 'آلمان', pack: 1,  carton: 12, isOriginal: true  },
    { sku: 'KYN-FLT-206-032', name: 'فیلتر بنزین موتور کیان‌پارت',         pbMock: 5, cmMock: 1,  catMock: 8, price: 85000,                      isOffer: false, stock: 37, sales: 880,  views: 4300, rating: 4.3, reviewCount: 65,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'MPK-FLT-SHN-033', name: 'فیلتر روغن کلاچ مپکو',                pbMock: 7, cmMock: 9,  catMock: 8, price: 65000,                      isOffer: false, stock: 20, sales: 420,  views: 2100, rating: 4.1, reviewCount: 34,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'NGK-FLT-SNA-034', name: 'فیلتر گازوئیل دیزل NGK',              pbMock: 3, cmMock: 8,  catMock: 8, price: 145000,  oldPrice: 200000,  isOffer: true,  stock: 16, sales: 310,  views: 1580, rating: 4.5, reviewCount: 41,  warranty: '۶ ماه',  origin: 'ژاپن',  pack: 1,  carton: 12, isOriginal: true  },
  ];

  const products = await prisma.$transaction(
    productSeeds.map(s =>
      prisma.product.create({
        data: {
          sku:           s.sku,
          name:          s.name,
          partsBrandId:  pbId(s.pbMock),
          categoryId:    catId(s.catMock),
          basePrice:     BigInt(s.price),
          oldPrice:      s.oldPrice ? BigInt(s.oldPrice) : null,
          isOffer:       s.isOffer,
          stock:         s.stock,
          saleCount:     s.sales,
          viewCount:     s.views,
          ratingAvg:     s.rating,
          reviewCount:   s.reviewCount,
          warranty:      s.warranty,
          origin:        s.origin,
          packQuantity:  s.pack,
          cartonQuantity: s.carton,
          isOriginal:    s.isOriginal,
          mainImage:     '/logo.png',
          description:   s.desc ?? null,
          isActive:      true,
        },
      }),
    ),
  );

  // ── Product Compatibilities ────────────────────────────────────────────────
  await prisma.productCompatibility.createMany({
    data: productSeeds.map((s, i) => ({
      productId:  products[i].id,
      carModelId: cmId(s.cmMock),
    })),
  });

  // ── Nav Links ──────────────────────────────────────────────────────────────
  await prisma.navLink.createMany({
    data: [
      { href: '/',            label: 'خانه',         sortOrder: 1 },
      { href: '/products',    label: 'همه محصولات',  sortOrder: 2 },
      { href: '/products?category=engine',      label: 'قطعات موتوری', sortOrder: 3 },
      { href: '/products?category=body',        label: 'بدنه خودرو',   sortOrder: 4 },
      { href: '/products?category=electrical',  label: 'برق خودرو',    sortOrder: 5 },
      { href: '/blog',        label: 'وبلاگ',          sortOrder: 6 },
      { href: '/faq',         label: 'سوالات متداول', sortOrder: 7 },
      { href: '/contact',     label: 'تماس با ما',   sortOrder: 8 },
    ],
  });

  // ── Shipping Options ───────────────────────────────────────────────────────
  await prisma.shippingOption.createMany({
    data: [
      { method: ShippingMethod.STANDARD, label: 'ارسال عادی (پست)',   description: 'تحویل در ۳ تا ۵ روز کاری', cost: BigInt(120_000), isActive: true },
      { method: ShippingMethod.EXPRESS,  label: 'ارسال اکسپرس',       description: 'تحویل در ۱ تا ۲ روز کاری', cost: BigInt(350_000), isActive: true },
    ],
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      id: 'usr_001', phoneNumber: '09121234567',
      firstName: 'علی', lastName: 'محمدی',
      role: UserRole.RETAIL, isVerified: true,
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      addresses: {
        create: { cityId: cityId.get('تهران')!, street: 'خیابان ولیعصر، پلاک ۱۲۴، واحد ۳', postalCode: '1411873563', isDefault: true },
      },
    },
  });
  await prisma.user.create({
    data: {
      id: 'usr_002', phoneNumber: '09351112233',
      firstName: 'فاطمه', lastName: 'حسینی',
      role: UserRole.RETAIL, isVerified: true,
      createdAt: new Date('2024-02-20T12:30:00.000Z'),
      addresses: {
        create: { cityId: cityId.get('اصفهان')!, street: 'خیابان چهارباغ، کوچه رضوی، پلاک ۷', postalCode: '8174793651', isDefault: true },
      },
    },
  });

  const p = (i: number) => products[i - 1].id; // 1-based mock index → DB id

  // ── Carts & cart items (mirrors initialCartItems from cartMockData.ts) ──────
  await prisma.cart.create({
    data: {
      userId: 'usr_001',
      items: {
        createMany: {
          data: [
            { productId: p(1),  quantity: 2 }, // فیلتر روغن موتور بوش
            { productId: p(9),  quantity: 1 }, // لنت ترمز جلو بوش
            { productId: p(14), quantity: 4 }, // شمع NGK
            { productId: p(4),  quantity: 1 }, // تسمه تایم بوش
          ],
        },
      },
    },
  });
  await prisma.cart.create({
    data: {
      userId: 'usr_002',
      items: {
        createMany: {
          data: [
            { productId: p(23), quantity: 1 }, // روغن موتور ۴ لیتری بوش
            { productId: p(31), quantity: 2 }, // فیلتر کابین بوش
          ],
        },
      },
    },
  });

  // ── Reviews ────────────────────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      { productId: p(1),  authorName: 'محمد رضایی',   rating: 5, text: 'کیفیت عالی، کاملاً اصل، موتورم بعد از نصب روان‌تر کار می‌کنه.',          isVerifiedPurchase: true  },
      { productId: p(1),  authorName: 'علی احمدی',    rating: 4, text: 'محصول خوبی هست ولی کمی گران‌قیمت. بسته‌بندی عالی بود.',                   isVerifiedPurchase: true  },
      { productId: p(1),  authorName: 'سارا کریمی',   rating: 5, text: 'دقیقاً همون چیزی که نیاز داشتم. سریع ارسال شد.',                          isVerifiedPurchase: false },
      { productId: p(2),  authorName: 'حسین محمدی',   rating: 4, text: 'بعد از نصب خودروم به درستی خنک می‌شه. نصب آسون بود.',                     isVerifiedPurchase: true  },
      { productId: p(2),  authorName: 'فاطمه نظری',   rating: 5, text: 'محصول اصل ایساکو، قیمت مناسب با تخفیف خوب.',                              isVerifiedPurchase: true  },
      { productId: p(3),  authorName: 'امیر تهرانی',  rating: 5, text: 'کیفیت فوق‌العاده! بعد از نصب احساس می‌کنم ماشین نو شده.',                  isVerifiedPurchase: true  },
      { productId: p(3),  authorName: 'رضا اکبری',    rating: 4, text: 'کیت کامل با همه قطعات اومد. نصب توسط تعمیرگاه انجام شد.',                 isVerifiedPurchase: true  },
      { productId: p(3),  authorName: 'مهدی شیرازی',  rating: 5, text: 'بسته‌بندی خوب، قطعات اصل، ارسال سریع.',                                   isVerifiedPurchase: false },
      { productId: p(9),  authorName: 'نادر قاسمی',   rating: 5, text: 'بهترین لنتی که تا حالا خریدم. ترمز عالی و بدون صدا.',                      isVerifiedPurchase: true  },
      { productId: p(9),  authorName: 'لیلا صادقی',   rating: 4, text: 'لنت بوش اصل. کیفیت خوب. قیمت مناسب.',                                     isVerifiedPurchase: true  },
      { productId: p(14), authorName: 'کیوان موسوی',  rating: 5, text: 'شمع اصل NGK. بعد از نصب مصرف بنزین کمتر شد.',                             isVerifiedPurchase: true  },
      { productId: p(14), authorName: 'پریسا علوی',   rating: 4, text: 'بسته‌بندی اصل، سریع ارسال شد، کیفیت عالی.',                               isVerifiedPurchase: false },
      { productId: p(14), authorName: 'داوود کمالی',  rating: 5, text: 'NGK همیشه بهترین بوده. توصیه می‌کنم.',                                    isVerifiedPurchase: true  },
      { productId: p(23), authorName: 'بهروز منصوری', rating: 5, text: 'روغن اصل بوش. موتور بعد از تعویض خیلی روان شد.',                           isVerifiedPurchase: true  },
      { productId: p(23), authorName: 'زینب حیدری',   rating: 5, text: 'قیمت مناسب، سریع ارسال شد. رضایت کامل.',                                  isVerifiedPurchase: true  },
      { productId: p(23), authorName: 'مجتبی فراهانی', rating: 4, text: 'خوب بود ولی دیر رسید. کیفیت روغن ایده‌آل.',                              isVerifiedPurchase: false },
    ],
  });

  console.log('Seed complete:');
  console.log(`  ${provinces.length} provinces, ${cities.length} cities`);
  console.log(`  ${carBrands.length} car brands, ${carModels.length} car models`);
  console.log(`  ${partsBrands.length} parts brands, ${categories.length} categories`);
  console.log(`  ${products.length} products`);
  console.log(`  9 nav links, 2 shipping options`);
  console.log(`  2 users, 2 carts (6 cart items), 16 reviews`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
