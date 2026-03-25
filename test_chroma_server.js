#!/usr/bin/env node
/**
 * 临时 ChromaDB 测试服务器（无需数据库）
 * 直接测试 ChromaDB + bge-m3 查询功能
 */
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3001;

// Python 脚本路径
const pythonScript = path.join(__dirname, 'backend/scripts/chroma_search.py');
const pythonEnv = '/Users/rabbit-y/.openclaw/workspace/chroma-env';

app.get('/api/test/chroma/search', async (req, res) => {
  const query = req.query.q || '消防车';
  const nResults = req.query.n || 3;

  console.log(`🔍 查询: ${query}, 结果数: ${nResults}`);

  const pythonPath = `${pythonEnv}/bin/python`;
  const process = spawn(pythonPath, [pythonScript, query, nResults]);

  let stdout = '';
  let stderr = '';

  process.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  process.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ ChromaDB 查询失败:', stderr);
      return res.status(500).json({
        success: false,
        error: stderr,
        query: query
      });
    }

    try {
      const result = JSON.parse(stdout);
      console.log(`✅ 找到 ${result.count} 条结果`);
      res.json(result);
    } catch (error) {
      console.error('❌ 解析结果失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        query: query
      });
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'ChromaDB 测试服务器',
    endpoints: {
      '/api/test/chroma/search': 'ChromaDB 查询测试 (?q=关键词&n=结果数)'
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n🦐 ChromaDB 测试服务器启动成功！`);
  console.log(`📡 地址: http://localhost:${PORT}`);
  console.log(`🔍 测试查询: http://localhost:${PORT}/api/test/chroma/search?q=消防车\n`);
});
