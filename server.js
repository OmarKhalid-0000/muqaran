const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json());

// دالة البحث الحقيقية عبر Google Shopping API (تجلب من أمازون، نون، جرير، إكسترا، إلخ)
async function searchStores(query) {
    let results = [];
    
    try {
        const apiKey = process.env.API_KEY || "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa"; 
        
        // الاتصال الفعلي بـ SerpApi مع تحديد الموقع الجغرافي السعودية (gl=sa) واللغة العربية (hl=ar)
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_shopping',
                q: query,
                gl: 'sa', // السعودية
                hl: 'ar', // اللغة العربية
                api_key: apiKey
            }
        });

        const shoppingResults = response.data.shopping_results || [];

        // تحويل النتائج لتتناسب مع تصميم موقعك
        results = shoppingResults.map((item, index) => {
            // تنظيف السعر واستخراج الرقم فقط ليعمل الفرز بشكل صحيح
            const numericPrice = item.extracted_price || (item.price ? item.price.replace(/[^0-9.]/g, '') : '0');
            
            return {
                id: index + 1,
                name: item.title,
                store: item.source || 'متجر إلكتروني',
                price: numericPrice.toString(),
                image: item.thumbnail || 'https://placehold.co/200x200/1e293b/ffffff?text=No+Image', // صورة حقيقية أو بديل شغال
                link: item.link || item.product_link || '#'
            };
        });

    } catch (error) {
        console.error("خطأ في عملية الجلب من API:", error.response ? error.response.data : error.message);
    }

    return results;
}

// مسار البحث
app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    
    // إذا كانت خانة البحث فارغة، ابحث تلقائياً عن "ايفون" أو "لابتوب" لعرض منتجات حقيقية في الواجهة
    const searchQuery = query || 'ايفون 15';
    const liveResults = await searchStores(searchQuery);
    
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
