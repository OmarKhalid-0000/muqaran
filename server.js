const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// API لجلب الأسعار ومقارنتها من المتاجر المستهدفة
app.get('/api/search', async (req, res) => {
    const query = req.query.q || 'منتج';
    
    // محاكاة بيانات حقيقية وواقعية من المتاجر التي طلبتها (أمازون، نون، شي إن، علي إكسبريس، تيمو، ترنديول، محلي)
    const storesData = [
        { id: 1, title: `${query} الأصلي`, price: 349, store: "أمازون السعودية", logo: "amazon", link: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}` },
        { id: 2, title: `${query} - ضمان المتاجر`, price: 335, store: "نون", logo: "noon", link: `https://www.noon.com/saudi-ar/search?q=${encodeURIComponent(query)}` },
        { id: 3, title: `${query} - أزياء وعروض`, price: 89, store: "شي إن (Shein)", logo: "shein", link: `https://www.shein.com/ar/pdsearch/${encodeURIComponent(query)}` },
        { id: 4, title: `${query} - شحن دولي`, price: 65, store: "علي إكسبريس", logo: "aliexpress", link: `https://s.aliexpress.com/_oE7...` },
        { id: 5, title: `${query} - عرض خاص`, price: 55, store: "تيمو (Temu)", logo: "temu", link: `https://www.temu.com/sa/search_result.html?search_key=${encodeURIComponent(query)}` },
        { id: 6, title: `${query} - ترنديول`, price: 110, store: "ترنديول", logo: "trendyol", link: `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}` },
        { id: 7, title: `${query} - متجر محلي معتمد`, price: 360, store: "متجر محلي (جرير/إكسترا)", logo: "local", link: `https://www.jarir.com` }
    ];

    // ترتيب المنتجات تلقائياً من الأرخص إلى الأغلى لتظهر للمستخدم بأفضل سعر أولاً
    storesData.sort((a, b) => a.price - b.price);

    res.json({
        query: query,
        totalStores: storesData.length,
        results: storesData
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Muqaran Multi-Store API running on port ${PORT}`);
});
