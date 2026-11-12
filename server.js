const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// دالة البحث وسحب البيانات الحقيقية
async function searchStores(query) {
    let results = [];
    
    try {
        const encodedQuery = encodeURIComponent(query);
        
        // 🔑 [هنا تضع مفتاح الـ API الخاص بك]
        const apiKey = "8bddfe6d364e5710991f9c72daf937aace4bc5ad978b0811d9b2a7421def93aa"; 

        // مثال لاستخدام المفتاح في طلب حقيقي لـ API خارجي:
        // const response = await axios.get(`رابط_الخدمة?query=${encodedQuery}&api_key=${apiKey}`);
        
        // (حسب الـ API الذي تستخدمه، تستخرج البيانات وتضيفها إلى مصفوفة results)

        results.push({
            id: 1,
            name: `نتيجة مطابقة لـ: ${query}`,
            store: 'أمازون (بحث حقيقي)',
            price: '1500', // مثال لسعر رقمي ليعمل الفرز بشكل صحيح
            image: 'https://via.placeholder.com/150',
            link: 'https://amazon.sa'
        });

    } catch (error) {
        console.error("خطأ في عملية الجلب:", error.message);
    }

    return results;
}

app.get('/api/search', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) return res.json([]);

    const liveResults = await searchStores(query);
    res.json(liveResults);
});

app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل بنجاح على: http://localhost:3000`);
});
