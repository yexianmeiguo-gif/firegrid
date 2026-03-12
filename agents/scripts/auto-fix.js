// FireGrid 自动修复脚本 - Node.js版
// 自动修复常见代码错误

const fs = require('fs')
const path = require('path')

const WEIXIN_DIR = path.join(__dirname, '../../firegrid-weixin')
const LOG_FILE = path.join(__dirname, '../logs/auto-fix.log')

// 确保日志目录存在
const logDir = path.dirname(LOG_FILE)
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

function log(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`
  fs.appendFileSync(LOG_FILE, logMessage)
  console.log(message)
}

// 修复WXML标签错误
function fixWxmlTags(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let fixed = false
  
  // 修复1: view标签用text闭合
  const regex1 = /<view([^\u003e]*)>([^\u003c]*)<\/text>/g
  if (regex1.test(content)) {
    content = content.replace(regex1, '<view$1>$2</view>')
    fixed = true
    log(`  🔧 修复 ${path.basename(filePath)}: view/text标签不匹配`)
  }
  
  // 修复2: 其他常见标签问题
  // 可以添加更多修复规则
  
  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }
  
  return false
}

// 主函数
function main() {
  log('🔧 自动修复脚本启动')
  log('====================')
  
  let fixedCount = 0
  
  // 扫描所有WXML文件
  function scanDir(dir) {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else if (item.endsWith('.wxml')) {
        if (fixWxmlTags(fullPath)) {
          fixedCount++
        }
      }
    }
  }
  
  try {
    scanDir(path.join(WEIXIN_DIR, 'pages'))
    
    log('')
    log(`✅ 修复完成，共修复 ${fixedCount} 个文件`)
    
    process.exit(fixedCount > 0 ? 0 : 1)
  } catch (err) {
    log(`❌ 修复失败: ${err.message}`)
    process.exit(1)
  }
}

// 如果传入了特定文件路径
if (process.argv[2]) {
  const targetFile = process.argv[2]
  if (fs.existsSync(targetFile)) {
    fixWxmlTags(targetFile)
  }
} else {
  main()
}
