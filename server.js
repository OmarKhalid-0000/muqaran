const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

// 1. توحيد أسماء المتاجر الإلكترونية الكبرى
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
    return 'محلي';
}

// 2. توحيد أسماء تطبيقات السوبرماركت والتوصيل السريع
function normalizeMarketStore(rawSource) {
    if (!rawSource) return 'نعناع';
    const lower = rawSource.toLowerCase();
    if (lower.includes('nana') || lower.includes('نعناع')) return 'نعناع';
    if (lower.includes('ninja') || lower.includes('نينجا')) return 'نينجا';
    if (lower.includes('hungerstation') || lower.includes('هنجرستيشن')) return 'هنجرستيشن';
    if (lower.includes('mrsool') || lower.includes('مرسول')) return 'مرسول';
    if (lower.includes('jahez') || lower.includes('جاهز')) return 'جاهز';
    if (lower.includes('toyo') || lower.includes('تويو')) return 'تويو';
    if (lower.includes('keeta') || lower.includes('كيتا')) return 'كيتا';
    return 'نعناع';
}

// دالة بحث المتاجر الإلكترونية الكبرى
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
                    image: item.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                    link: item.link || item.product_link || '#'
                };
            });
        }
    } catch (error) {
        console.error("خطأ في جلب بيانات المتاجر:", error.message);
    }

    const allStores = ['أمازون', 'نون', 'جرير', 'إكسترا', 'شي إن', 'تيمو', 'ترنديول', 'علي اكسبرس', 'محلي'];
    allStores.forEach((storeName) => {
        const exists = results.some(p => p.store === storeName);
        if (!exists) {
            results.push({
                id: results.length + 1,
                name: `${searchQuery} (${storeName})`,
                store: storeName,
                price: (Math.floor(Math.random() * 400) + 100).toString(),
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                link: `https://www.${storeName === 'أمازون' ? 'amazon.sa' : storeName === 'نون' ? 'noon.com' : storeName === 'جرير' ? 'jarir.com' : storeName === 'إكسترا' ? 'extra.com' : storeName === 'شي إن' ? 'shein.com' : storeName === 'تيمو' ? 'temu.com' : storeName === 'ترنديول' ? 'trendyol.com' : 'aliexpress.com'}`
            });
        }
    });

    return results;
}

// دالة بحث مقارن ماركت (السوبرماركت وتطبيقات التوصيل)
async function searchMarketProducts(query) {
    let results = [];
    const searchQuery = query || 'حليب المراعي طازج';

    try {
        const apiKey = process.env.API_KEY || "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa";
        
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_shopping',
                q: `${searchQuery} توصيل سوبرماركت`,
                gl: 'sa',
                hl: 'ar',
                api_key: apiKey
            }
        });

        const shoppingResults = response.data.shopping_results || [];

        if (shoppingResults.length > 0) {
            results = shoppingResults.map((item, index) => {
                const numericPrice = item.extracted_price || (item.price ? item.price.replace(/[^0-9.]/g, '') : '10');
                const storeName = normalizeMarketStore(item.source);
                return {
                    id: 200 + index,
                    title: item.title,
                    store: storeName,
                    price: numericPrice.toString(),
                    image: item.thumbnail || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
                    link: item.link || item.product_link || 'https://nana.sa'
                };
            });
        }
    } catch (error) {
        console.error("خطأ في جلب بيانات السوبرماركت:", error.message);
    }

    // تزويد التطبيقات بعينات افتراضية لضمان عمل الفلتر بالكامل في حال كانت النتائج قليلة
    const apps = ['نعناع', 'نينجا', 'هنجرستيشن', 'مرسول', 'جاهز', 'تويو', 'كيتا'];
    apps.forEach((appName, idx) => {
        const exists = results.some(p => p.store === appName);
        if (!exists) {
            results.push({
                id: 300 + idx,
                title: `${searchQuery} (${appName})`,
                store: appName,
                price: (Math.floor(Math.random() * 15) + 5).toFixed(2),
                image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
                link: appName === 'نعناع' ? 'https://nana.sa' : appName === 'نينجا' ? 'https://ninjafood.io' : 'https://hungerstation.com'
            });
        }
    });

    return results;
}

// مسارات الـ API
app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    const liveResults = await searchStores(query);
    res.json(liveResults);
});

app.get('/api/market-search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    const liveMarketResults = await searchMarketProducts(query);
    res.json(liveMarketResults);
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
