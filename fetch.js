const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

// 永久地址与最新备用地址列表
const DOMAINS = [
    'https://www.t66y.com',
    'https://ca.hmv3sh.info',
    'https://ca.y3j6qj.info',
    'https://ca.88y9fq.info'
];

async function run() {
    let htmlData = null;
    let currentDomain = '';

    // 尝试寻找可用节点
    for (const domain of DOMAINS) {
        try {
            console.log(`正在尝试连接: ${domain}`);
            const response = await axios.get(`${domain}/thread086.php?fid=7`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
                },
                responseType: 'arraybuffer'
            });

            if (response.status === 200) {
                const decoder = new TextDecoder('gbk');
                htmlData = decoder.decode(response.data);
                currentDomain = domain;
                break;
            }
        } catch (e) {
            console.warn(`节点 ${domain} 访问失败: ${e.message}`);
        }
    }

    if (!htmlData) {
        console.error('所有节点尝试失败！');
        process.exit(1);
    }

    const $ = cheerio.load(htmlData);
    const posts = [];

    $('tr.tr3.t_one').each((i, el) => {
        if (posts.length >= 10) return false;
        const a = $(el).find('h3 a');
        const author = $(el).find('a.bl').text().trim() || '匿名';
        if (a.length > 0) {
            posts.push({
                title: a.text().trim(),
                url: `${currentDomain}/${a.attr('href')}`,
                author: author
            });
        }
    });

    // 生成静态 HTML 文件
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>技术讨论区 Top 10</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 650px; margin: 30px auto; padding: 0 16px; background: #121212; color: #e0e0e0; }
        h1 { font-size: 18px; color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .meta { font-size: 12px; color: #888; margin-bottom: 20px; }
        .item { background: #1e1e1e; padding: 12px 16px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #2a2a2a; display: flex; justify-content: space-between; align-items: center; }
        a { color: #64b5f6; text-decoration: none; font-weight: 500; font-size: 14px; flex: 1; margin-right: 12px; }
        a:hover { text-decoration: underline; }
        .author { font-size: 12px; color: #aaa; background: #2c2c2c; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🛠️ 技术讨论区 - 最新 Top 10 帖子</h1>
    <div class="meta">最后自动更新时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} | 当前抓取来源：${currentDomain}</div>
    <div>
        ${posts.map((p, idx) => `
            <div class="item">
                <a href="${p.url}" target="_blank" rel="noopener">${idx + 1}.${p.title}</a>
                <span class="author">${p.author}</span>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync('index.html', htmlContent);
    console.log('index.html 生成成功！');
}

run();
