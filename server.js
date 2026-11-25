const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_SERPAPI_KEY = '8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8'
};

const ALL_STORES = [
    'نون',
    'أمازون',
    'شي إن',
    'تيمو',
    'ترنديول',
    'علي اكسبرس',
    'جرير',
    'إكسترا',
    'محلي'
];

const STORE_URL_TEMPLATES = {
    'نون': 'https://www.noon.com/saudi-ar/search/?q={QUERY}&utm_source=c1000088L&utm_medium=cpc&utm_campaign=C1000185151N_sa_ar_noonbranded_1072026_noon_web_c1000088l_search_sembranded_&gad_source=1&gad_campaignid=22393947090&gbraid=0AAAAADH71hjzB8JbSuDupG2DRvbxDUnCP&gclid=CjwKCAiAq5rYBhB-EiwAhj1RdicXAEGmSp0UXHMxRwrWJpmSSY9f4a_g5n2qcU3EvEaBSBBcVOSkLRoC5m8QAvD_BwE',
    'أمازون': 'https://www.amazon.sa/s?k={QUERY}&tag=sapcabkara-21&ref=pd_sl_496spse0ql_e&adgrpid=200765048356&hvpone=&hvptwo=&hvadid=827392467304&hvpos=&hvnetw=g&hvrand=8235813963785890632&hvqmt=e&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=2682&hvtargid=kwd-11440784425&hvcampaign=24303921726&hydadcr=19822_2299496_441666&mcid=31748c71050a38349e11d64adf2a0e1f&hvocijid=8235813963785890632--&hvexpln=nav&language=ar_AE',
    'شي إن': 'https://ar.shein.com/pdsearch/{QUERY}/?url_from=sagooglebrandshein_shein01_LAR_srsa_20240424&network=g&kwd=kwd-305460321740&pf=GOOGLE&keyword=%D8%B4%D9%8A%20%D8%A7%D9%86&target=&placement=&gad_source=1&gad_campaignid=21229950196&gbraid=0AAAAADm0yO6qkBaFefIAns6VBIFCBfr9F&gclid=CjwKCAiAq5rYBhB-EiwAhj1RdpGwARkxCRC-4pSR_HWdPCkRYVFNopeFUkzKm_CVI2yxuVYaTpJxdhoCGpcQAvD_BwE',
    'تيمو': 'https://www.temu.com/ul/kuiper/un2.html?_p_rfs=1&subj=un-search-web&_p_jump_id=960&_x_vst_scene=adg&search_key={QUERY}&_x_ads_channel=google&_x_ads_sub_channel=search&adg_ctx=m-7b0028eb~f-1379fb79&_x_ads_account=4898917807&_x_ads_set=21922203772&_x_ads_id=173662756314&_x_ads_creative_id=721859731667&_x_ns_source=g&_x_ns_gclid=CjwKCAiAq5rYBhB-EiwAhj1RdqetHZ8aAMTvU-UlhpT6I_sPYTN8KLUaIi3pnQI2dnzc3VKyqP6hihoCjxMQAvD_BwE&_x_ns_placement=&_x_ns_match_type=p&_x_ns_ad_position=&_x_ns_product_id=&_x_ns_target=&_x_ns_devicemodel=&_x_ns_wbraid=Ck0KCQiAiJXYBhC7ARI8ADMmXbGYV3bv72Wf0WcGBK5Dj8UXwGbtyEX61fkx9ATeWFr80wRSN-Nkg3sjU59tfxtziwx3fVUZ2Ej3GgLg6Q&_x_ns_gbraid=0AAAAAo4mICEos--XMz0tosJr_ZGF5tWRH&_x_ns_keyword=temu&_x_ns_targetid=kwd-368867843197&_x_ns_extensionid=&gad_source=1&gad_campaignid=21922203772&gbraid=0AAAAAo4mICEos--XMz0tosJr_ZGF5tWRH&gclid=CjwKCAiAq5rYBhB-EiwAhj1RdqetHZ8aAMTvU-UlhpT6I_sPYTN8KLUaIi3pnQI2dnzc3VKyqP6hihoCjxMQAvD_BwE',
    'ترنديول': 'https://www.trendyol.sa/sr?q={QUERY}',
    'علي اكسبرس': 'https://ar.aliexpress.com/w/wholesale-{QUERY}.html?osf=ppc_ug&guideModule=ppc_ug&src=google&albch=search&acnt=479-062-3723&isdl=y&aff_short_key=UneMJZVf&albcp=21912434085&albag=169994224505&slnk=&trgt=dsa-1642801257570&plac=&crea=721802015515&albad=721802015515&netw=g&device=c&mtctp=&memo1=&albbt=Google_7_search&aff_platform=google&albagn=888888&isSmbActive=false&isSmbAutoCall=false&needSmbHouyi=false&gad_source=1&gad_campaignid=21912434085&gbraid=0AAAAAD2chG4kJjhtPkytt4uLwrhsclKaQ&gclid=CjwKCAiAq5rYBhB-EiwAhj1RdqkDVn5QsJMJxXoG86YtZ5li88VRSuqC555up7a1fpLXvYEU5IQmSBoCqksQAvD_BwE',
    'جرير': 'https://www.jarir.com/sa-ar/catalogsearch/result?q={QUERY}&srsltid=AYCX9vJ7d1YFA76Heen4bjkVfRVYhqLnuHLAVlZ1SR0kP7wuVobGkndE',
    'إكسترا': 'https://www.extra.com/ar-sa/search/?text={QUERY}',
    'محلي': 'https://mahally.com/ar/?s={QUERY}&srsltid=AYCX9vJYHjqiBUri9tYEz9t1823VhPBM8hYuOS2X-vXb41VY-AxIqnHU'
};

function getSerpApiKey() {
    return (process.env.SERPAPI_KEY || process.env.API_KEY || DEFAULT_SERPAPI_KEY).trim();
}

function buildStoreSearchLink(storeName, query) {
    const template = STORE_URL_TEMPLATES[storeName] || STORE_URL_TEMPLATES['محلي'];
    const encoded = encodeURIComponent((query || '').trim());
    return template.replace('{QUERY}', encoded);
}

function normalizeStoreName(rawSource) {
    if (!rawSource) return 'محلي';
    const lower = rawSource.toLowerCase();
    if (lower.includes('amazon') || lower.includes('أمازون')) return 'أمازون';
    if (lower.includes('noon') || lower.includes('نون')) return 'نون';
    if (lower.includes('jarir') || lower.includes('جرير')) return 'جرير';
    if (lower.includes('extra') || lower.includes('إكسترا') || lower.includes('اكسترا')) return 'إكسترا';
    if (lower.includes('shein') || lower.includes('شي إن') || lower.includes('شي ان')) return 'شي إن';
    if (lower.includes('temu') || lower.includes('تيمو')) return 'تيمو';
    if (lower.includes('trendyol') || lower.includes('ترنديول')) return 'ترنديول';
    if (lower.includes('aliexpress') || lower.includes('علي اكسبرس') || lower.includes('علي إكسبريس')) return 'علي اكسبرس';
    if (lower.includes('mahally') || lower.includes('محلي')) return 'محلي';
    return 'محلي';
}

function normalizeD4DStore(rawSource) {
    if (!rawSource) return 'بنده';
    const lower = rawSource.toLowerCase();
    if (lower.includes('othaim') || lower.includes('العثيم')) return 'العثيم';
    if (lower.includes('panda') || lower.includes('بنده')) return 'بنده';
    if (lower.includes('carrefour') || lower.includes('كارفور')) return 'كارفور';
    if (lower.includes('danube') || lower.includes('الدانوب')) return 'الدانوب';
    if (lower.includes('lulu') || lower.includes('لولو')) return 'لولو';
    if (lower.includes('tamimi') || lower.includes('التميمي')) return 'التميمي';
    return rawSource.trim();
}

function extractPrice(text) {
    if (!text) return null;
    const match = text.replace(/,/g, '').match(/(\d+(\.\d{1,2})?)/);
    return match ? match[1] : null;
}

// 1. مسار بحث المتاجر الإلكترونية الكبرى
async function searchStores(query) {
    let results = [];
    const searchQuery = (query || '').trim();
    const apiKey = getSerpApiKey();

    try {
        if (apiKey && searchQuery) {
            const response = await axios.get('https://serpapi.com/search.json', {
                params: {
                    engine: 'google_shopping',
                    q: searchQuery,
                    gl: 'sa',
                    hl: 'ar',
                    api_key: apiKey
                },
                timeout: 9000
            });
            const shoppingResults = response.data.shopping_results || [];
            if (shoppingResults.length > 0) {
                results = shoppingResults.map((item, index) => {
                    const storeName = normalizeStoreName(item.source);
                    const numericPrice = item.extracted_price || extractPrice(item.price);
                    return {
                        id: index + 1,
                        name: item.title,
                        store: storeName,
                        price: numericPrice ? numericPrice.toString() : 'عرض في المتجر',
                        image: item.thumbnail || '',
                        link: item.link || item.product_link || buildStoreSearchLink(storeName, searchQuery)
                    };
                });
            }
        }
    } catch (error) {
        console.error('خطأ في جلب بيانات المتاجر عبر SerpAPI:', error.message);
    }

    ALL_STORES.forEach((storeName) => {
        if (!results.some((p) => p.store === storeName)) {
            results.push({
                id: results.length + 1,
                name: searchQuery ? `بحث عن "${searchQuery}" في ${storeName}` : `تصفح متجر ${storeName}`,
                store: storeName,
                price: 'عرض في المتجر',
                image: '',
                link: buildStoreSearchLink(storeName, searchQuery)
            });
        }
    });

    return results;
}

// 2. مسار بحث مقارن ماركت (الأسواق الكبرى D4D)
async function fetchD4DOffers(city, query) {
    let results = [];
    const targetCity = city || 'riyadh';
    const searchQuery = query ? query.trim() : '';

    try {
        const d4dUrl = searchQuery
            ? `https://d4donline.com/ar/saudi-arabia/${targetCity}/products?q=${encodeURIComponent(searchQuery)}`
            : `https://d4donline.com/ar/saudi-arabia/${targetCity}/offers`;

        const { data: html } = await axios.get(d4dUrl, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(html);

        $('.product-card, .offer-card, [class*="product"], [class*="offer"]').each((index, el) => {
            const title = $(el).find('h2, h3, h4, .title, [class*="title"], [class*="name"]').first().text().trim();
            const rawPrice = $(el).find('.price, [class*="price"], .amount').first().text().trim();
            const price = extractPrice(rawPrice);
            const imgEl = $(el).find('img').first();
            let image = imgEl.attr('data-src') || imgEl.attr('src') || '';
            if (image && image.startsWith('/')) image = `https://d4donline.com${image}`;

            const rawStore = $(el).find('.store, .retailer, [class*="store"], [class*="brand"]').first().text().trim() || title;
            let link = $(el).find('a').first().attr('href') || d4dUrl;
            if (link && link.startsWith('/')) link = `https://d4donline.com${link}`;

            if (title && image && !image.includes('logo') && !results.some((r) => r.title === title)) {
                results.push({
                    id: 400 + results.length,
                    title,
                    store: normalizeD4DStore(rawStore),
                    price: price || 'عرض خاص',
                    image,
                    link
                });
            }
        });
    } catch (err) {
        console.error('تعذر السحب المباشر من D4D:', err.message);
    }

    if (results.length < 4) {
        try {
            const apiKey = getSerpApiKey();
            if (apiKey) {
                const response = await axios.get('https://serpapi.com/search.json', {
                    params: {
                        engine: 'google',
                        q: `site:d4donline.com/ar/saudi-arabia/${targetCity} ${searchQuery || 'عروض'}`,
                        gl: 'sa',
                        hl: 'ar',
                        num: 20,
                        api_key: apiKey
                    },
                    timeout: 8000
                });

                const organicResults = response.data.organic_results || [];
                organicResults.forEach((item) => {
                    const realPrice = extractPrice(item.snippet) || extractPrice(item.title);
                    const realImage = item.thumbnail || item.pagemap?.cse_image?.[0]?.src;

                    if (item.title && !results.some((r) => r.link === item.link)) {
                        results.push({
                            id: 500 + results.length,
                            title: item.title.replace(/ - D4D Online.*/i, '').trim(),
                            store: normalizeD4DStore(`${item.title} ${item.snippet || ''}`),
                            price: realPrice ? realPrice.toString() : 'اضغط لعرض السعر',
                            image: realImage || '',
                            link: item.link
                        });
                    }
                });
            }
        } catch (error) {
            console.error('خطأ في جلب نتائج D4D:', error.message);
        }
    }

    return results;
}

// 3. مسار الكوبونات
async function fetchLiveCoupons() {
    return [
        { id: 1, store: 'نون', source: 'الموفر', title: 'خصم إضافي 10% على كافة المنتجات', code: 'UKS', desc: 'كود فعال للعملاء الجدد والحاليين في السعودية.' },
        { id: 2, store: 'نون', source: 'قسيمة', title: 'استرداد نقدي وخصم على نون Express', code: 'NUON10', desc: 'يعمل على الإلكترونيات والأزياء والعطور.' },
        { id: 3, store: 'أمازون', source: 'صحصح', title: 'خصم فوري على الطلبات عبر التطبيق', code: 'AMZN20', desc: 'ساري على المنتجات المشحونة من أمازون السعودية.' },
        { id: 4, store: 'شي إن', source: 'الكوبون', title: 'خصم 15% على جميع الأزياء والملابس', code: 'SHN99', desc: 'بدون حد أدنى للطلب.' },
        { id: 5, store: 'نمشي', source: 'الموفر', title: 'خصم 20% على التشكيلات الجديدة', code: 'NM20', desc: 'فعال على معظم الماركات في نمشي.' },
        { id: 6, store: 'تيمو', source: 'الكوبون', title: 'خصم 30% للطلبات عبر التطبيق', code: 'TEMU300', desc: 'قسائم خصم حصرية للمستخدمين.' },
        { id: 7, store: 'جرير', source: 'المتسوق', title: 'تخفيض على الإكسسوارات واللوازم المكتبية', code: 'JARIR50', desc: 'ساري في متجر جرير الإلكتروني.' }
    ];
}

app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    res.json(await searchStores(query));
});

app.get('/api/market-search', async (req, res) => {
    const city = req.query.city ? req.query.city.trim() : 'riyadh';
    const query = req.query.q ? req.query.q.trim() : '';
    res.json(await fetchD4DOffers(city, query));
});

app.get('/api/coupons', async (req, res) => {
    res.json(await fetchLiveCoupons());
});

app.get('/', (req, res) => {
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    const rootIndex = path.join(__dirname, 'index.html');
    if (fs.existsSync(publicIndex)) res.sendFile(publicIndex);
    else if (fs.existsSync(rootIndex)) res.sendFile(rootIndex);
    else res.status(404).send('ملف index.html غير موجود');
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل على المنفذ: ${PORT}`);
});
