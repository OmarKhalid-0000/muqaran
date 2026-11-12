const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

// دالة البحث وسحب البيانات
async function searchStores(query) {
    let results = [];
    
    try {
        const encodedQuery = encodeURIComponent(query);
        const apiKey = process.env.API_KEY || "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa"; 

        // يمكنك إضافة نتائج بحث مطابقة لكلمة البحث هنا
        results.push({
            id: 1,
            name: `نتيجة مطابقة لـ: ${query}`,
            store: 'أمازون',
            price: '1500',
            image: 'https://via.placeholder.com/150',
            link: 'https://amazon.sa'
        });

    } catch (error) {
        console.error("خطأ في عملية الجلب:", error.message);
    }

    return results;
}

// مسار البحث (يعرض منتجات افتراضية إذا كانت خانة البحث فارغة لكي لا يظهر الموقع فارغاً)
app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    
    if (!query) {
        return res.json([
            { id: 1, name: 'آيفون 15 برو ماكس', store: 'أمازون', price: '4500', image: 'https://via.placeholder.com/150', link: 'https://amazon.sa' },
            { id: 2, name: 'جالاكسي إس 24 ألترا', store: 'نون', price: '4200', image: 'https://via.placeholder.com/150', link: 'https://noon.com' },
            { id: 3, name: 'ساعة أبل الترا 2', store: 'جرير', price: '3100', image: 'https://via.placeholder.com/150', link: 'https://jarir.com' }
        ]);
    }

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
