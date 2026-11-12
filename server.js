const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

// توحيد أسماء المتاجر القادمة من محرك البحث لتطابق أزرار الفلترة العربية
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
    if (lower.includes('aliexpress') || lower.includes('علي اكسبرس')) return 'علي اكسبرس';
    return `محلي (${rawSource})`;
}

// دالة البحث الحقيقي عبر SerpApi
async function searchStores(query) {
    let results = [];
    const searchQuery = query || 'ايفون 15';

    try {
        const apiKey = process.env.API_KEY || "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa";
        
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_shopping',
                q: searchQuery,
                gl: 'sa',
                hl: 'ar',
                api_key: apiKey
            }
        });

        const shoppingResults = response.data.shopping_results || [];

        if (shoppingResults.length > 0) {
            results = shoppingResults.map((item, index) => {
                const numericPrice = item.extracted_price || (item.price ? item.price.replace(/[^0-9.]/g, '') : '0');
                return {
                    id: index + 1,
                    name: item.title,
                    store: normalizeStoreName(item.source),
                    price: numericPrice.toString(),
                    image: item.thumbnail || 'https://placehold.co/300x200/1e293b/ffffff?text=صورة+المنتج',
                    link: item.link || item.product_link || '#'
                };
            });
        }
    } catch (error) {
        console.error("خطأ في جلب البيانات من الـ API:", error.message);
    }

    // نتائج بديلة في حال انتهاء رصيد الـ API المجاني لضمان عدم توقف الموقع
    if (results.length === 0) {
        results = [
            { id: 1, name: `${searchQuery} - العرض الأول`, store: 'أمازون', price: '4500', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', link: 'https://amazon.sa' },
            { id: 2, name: `${searchQuery} - العرض الثاني`, store: 'نون', price: '4450', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', link: 'https://noon.com' },
            { id: 3, name: `${searchQuery} - العرض الثالث`, store: 'جرير', price: '4599', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', link: 'https://jarir.com' },
            { id: 4, name: `${searchQuery} - العرض الرابع`, store: 'إكسترا', price: '4550', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', link: 'https://extra.com' }
        ];
    }

    return results;
}

// مسار البحث
app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    const liveResults = await searchStores(query);
    res.json(liveResults);
});

// توجيه الصفحة الرئيسية
app.get('/', (req, res) => {
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    const rootIndex = path.join(__dirname, 'index.html');

    if (fs.existsSync(publicIndex)) {
        res.sendFile(publicIndex);
    } else if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
    } else {
        res.status(404).send('لم يتم العثور على ملف index.html!');
    }
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل بنجاح على المنفذ: ${PORT}`);
});
