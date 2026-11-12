const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

// دالة البحث الحقيقي لجلب المنتجات والأسعار والصور والروابط من جميع المتاجر
async function searchStores(query) {
    let results = [];
    
    try {
        const apiKey = process.env.API_KEY || "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa"; 
        
        // طلب البيانات من Google Shopping مع تحديد السعودية (gl=sa) واللغة العربية (hl=ar)
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_shopping',
                q: query,
                gl: 'sa',
                hl: 'ar',
                api_key: apiKey
            }
        });

        const shoppingResults = response.data.shopping_results || [];

        // استخراج البيانات وتجهيزها للواجهة
        results = shoppingResults.map((item, index) => {
            const numericPrice = item.extracted_price || (item.price ? item.price.replace(/[^0-9.]/g, '') : '0');
            
            return {
                id: index + 1,
                name: item.title,
                store: item.source || 'متجر إلكتروني',
                price: numericPrice.toString(),
                image: item.thumbnail || 'https://placehold.co/200x200?text=No+Image',
                link: item.link || '#'
            };
        });

    } catch (error) {
        console.error("خطأ في عملية الجلب:", error.message);
    }

    return results;
}

// مسار البحث الفعلي
app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) return res.json([]);

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
