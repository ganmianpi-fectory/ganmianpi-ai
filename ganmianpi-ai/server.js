const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 聊天接口
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const response = await axios.post(DEEPSEEK_API_URL, {
            model: 'deepseek-chat',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Chat Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 配方生成接口
app.post('/api/formula', async (req, res) => {
    try {
        const { country, province, city, district, taste, batch, thickness, line } = req.body;
        const prompt = `你是擀面皮工厂配方专家。根据以下参数生成配方JSON：
国家：${country}，地区：${province} ${city} ${district}，口味：${taste}，批次：${batch}kg，厚度：${thickness}mm，产线：${line}

只返回JSON，格式：{"flour":面粉克数,"water":水克数,"salt":盐克数,"flavorName":"酱料名","flavorWeight":酱料克数,"oilName":"油名","oilWeight":油克数,"mixTemp":和面温度℃,"restTime":醒面分钟,"spicy":辣度0-10,"sweet":甜度0-10,"advice":"简短生产建议"}`;

        const response = await axios.post(DEEPSEEK_API_URL, {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 800
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            res.json({ error: '解析失败' });
        }
    } catch (error) {
        console.error('Formula Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
});