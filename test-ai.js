const https = require('https');

// 测试 AI 生成 API
const testAIGeneration = () => {
  const options = {
    hostname: 'firegrid-backend-230828-6-1409174142.sh.run.tcloudbase.com',
    port: 443,
    path: '/ai/generate-bidding',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const data = JSON.stringify({
    category: 'fire-truck',
    budget: '200-300万',
    requirements: '采购水罐消防车2辆，要求载水量8吨以上，配备高压水枪',
  });

  console.log('🤖 测试 AI 招标文件生成...');
  console.log('请求体:', data);

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('\n✅ AI 测试完成！');
      console.log('状态码:', res.statusCode);
      try {
        const parsed = JSON.parse(responseData);
        console.log('响应内容:', JSON.stringify(parsed, null, 2));
        
        if (parsed.success) {
          console.log('\n🎉 AI 功能正常工作！');
          console.log('生成内容长度:', parsed.content?.length || 0, '字符');
        } else {
          console.log('\n⚠️ AI 返回错误:', parsed.note || parsed.error);
        }
      } catch (e) {
        console.log('原始响应:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ 请求失败:', error.message);
  });

  req.write(data);
  req.end();
};

// 运行测试
testAIGeneration();