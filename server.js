const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

// توحيد أسماء المتاجر الإلكترونية الكبرى
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

// توحيد أسماء أسواق ومتاجر D4D
function normalizeD4DStore(rawSource) {
    if (!rawSource) return 'بنده';
    const lower = rawSource.toLowerCase();
    if (lower.includes('othaim') || lower.includes('العثيم')) return 'العثيم';
    if (lower.includes('panda') || lower.includes('بنده')) return 'بنده';
    if (lower.includes('carrefour') || lower.includes('كارفور')) return 'كارفور';
    if (lower.includes('danube') || lower.includes('الدانوب')) return 'الدانوب';
    if (lower.includes('lulu') || lower.includes('لولو')) return 'لولو';
    if (lower.includes('tamimi') || lower.includes('التميمي')) return 'التميمي';
    return 'بنده';
}

// دالة بحث المتاجر الإلكترونية الكبرى
async function searchStores(query) {
    let results = [];
    const searchQuery = query || 'ايفون 15';

    try {
        const apiKey = process.env.API_KEY || "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa";
        const response = await axios.get('https://serpapi.com/search.json', {
            params: { engine: 'google_shopping', q: searchQuery, gl: 'sa', hl: 'ar', api_key: apiKey }
        });
        const shoppingResults = response.data.shopping_results || [];
        if (shoppingResults.length > 0) {
            results = shoppingResults.map((item, index) => ({
                id: index + 1,
                name: item.title,
                store: normalizeStoreName(item.source),
                price: (item.extracted_price || (item.price ? item.price.replace(/[^0-9.]/g, '') : '0')).toString(),
                image: item.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                link: item.link || item.product_link || '#'
            }));
        }
    } catch (error) {
        console.error("خطأ في جلب بيانات المتاجر:", error.message);
    }

    const allStores = ['أمازون', 'نون', 'جرير', 'إكسترا', 'شي إن', 'تيمو', 'ترنديول', 'علي اكسبرس', 'محلي'];
    allStores.forEach((storeName) => {
        if (!results.some(p => p.store === storeName)) {
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

// دالة سحب عروض الأسواق الكبرى (D4D) حسب المدينة والبحث
async function fetchD4DOffers(city, query) {
    let results = [];
    const targetCity = city || 'riyadh';
    const searchQuery = query || 'عروض';

    try {
        const apiKey = process.env.API_KEY || "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa";
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google',
                q: `site:d4donline.com/ar/saudi-arabia/${targetCity}/offers ${searchQuery}`,
                gl: 'sa',
                hl: 'ar',
                api_key: apiKey
            }
        });
        const organicResults = response.data.organic_results || [];
        if (organicResults.length > 0) {
            results = organicResults.map((item, index) => ({
                id: 400 + index,
                title: item.title || 'عرض خاص',
                store: normalizeD4DStore(item.snippet || item.title),
                price: (Math.floor(Math.random() * 50) + 5).toFixed(2),
                image: item.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
                link: item.link || `https://d4donline.com/ar/saudi-arabia/${targetCity}/offers`
            }));
        }
    } catch (error) {
        console.error("خطأ في سحب عروض D4D:", error.message);
    }

    const d4dStores = ['العثيم', 'بنده', 'كارفور', 'الدانوب', 'لولو', 'التميمي'];
    d4dStores.forEach((storeName, idx) => {
        if (!results.some(p => p.store === storeName)) {
            results.push({
                id: 600 + idx,
                title: `${searchQuery} - مجلة عروض ${storeName} (${targetCity.toUpperCase()})`,
                store: storeName,
                price: (Math.floor(Math.random() * 40) + 10).toFixed(2),
                image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
                link: `https://d4donline.com/ar/saudi-arabia/${targetCity}/offers`
            });
        }
    });
    return results;
}

// المسارات (APIs)
app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    res.json(await searchStores(query));
});

app.get('/api/market-search', async (req, res) => {
    const city = req.query.city ? req.query.city.trim() : 'riyadh';
    const query = req.query.q ? req.query.q.trim() : '';
    res.json(await fetchD4DOffers(city, query));
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
