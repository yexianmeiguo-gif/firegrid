#!/bin/bash
# FireGrid WXML自动修复脚本
# 自动修复常见的WXML标签错误

const fs = require('fs')
const path = require('path')

const PAGES_DIR = path.join(__dirname, '../firegrid-weixin/pages')

console.log('🔧 FireGrid WXML自动修复工具')
console.log('============================')

let fixedCount = 0

// 递归查找所有wxml文件
function findWxmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir)
  
  items.forEach(item => {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      findWxmlFiles(fullPath, files)
    } else if (item.endsWith('.wxml')) {
      files.push(fullPath)
    }
  })
  
  return files
}

// 修复单个文件
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content
  
  // 修复1: view标签错误地用text闭合
  // 例如: <view class="xxx">内容</text> → <view class="xxx">内容</view>
  content = content.replace(
    /(<view[^\u003e]*>)(<view[^\u003e]*>[^\u003c]*)<\/text>/g,
    '$1$2</view>'
  )
  
  // 修复2: 直接闭合错误
  // 例如: <view>内容</text> → <view>内容</view>
  content = content.replace(
    /(<view>[^\u003c]*)<\/text>/g,
    '$1</view>'
  )
  
  // 修复3: section-title标签用text闭合
  content = content.replace(
    /(<view class="section-title"[^\u003e]*>[^\u003c]*)<\/text>/g,
    '$1</view>'
  )
  
  // 修复4: tab-item标签用text闭合
  content = content.replace(
    /(<view class="tab-item"[^\u003e]*>[^\u003c]*)<\/text>/g,
    '$1</view>'
  )
  
  // 修复5: 其他view变体用text闭合
  content = content.replace(
    /(<view [^\u003e]*>[^\u003c]*)<\/text>/g,
    '$1</view>'
  )
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ 已修复: ${path.relative(PAGES_DIR, filePath)}`)
    fixedCount++
    return true
  }
  
  return false
}

// 主函数
function main() {
  try {
    const files = findWxmlFiles(PAGES_DIR)
    console.log(`📄 找到 ${files.length} 个WXML文件`)
    console.log('')
    
    files.forEach(file => {
      fixFile(file)
    })
    
    console.log('')
    if (fixedCount > 0) {
      console.log(`✅ 成功修复 ${fixedCount} 个文件`)
      console.log('')
      console.log('📝 下一步:')
      console.log('   在微信开发者工具中按 Command+B 重新编译')
    } else {
      console.log('✅ 没有发现需要修复的文件')
    }
    
  } catch (err) {
    console.error('❌ 修复失败:', err.message)
    process.exit(1)
  }
}

main()
