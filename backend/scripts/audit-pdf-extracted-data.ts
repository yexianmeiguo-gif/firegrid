import * as fs from 'fs';
import * as path from 'path';

/**
 * 审计从 PDF 手册提取的供应商产品数据
 * 
 * 数据来源：展会产品手册 PDF → 扫描 → 本地大模型解析
 * 
 * 评估维度：
 * 1. 数据完整性（文件结构、字段完整）
 * 2. 产品质量（名称、图片、规格）
 * 3. 可用性（能否导入数据库）
 * 4. 推荐处理方案
 */

interface ProductData {
  name: string;
  source_url?: string;
  images?: Array<{ filename: string; size: number }>;
  specs?: string;
  spec_lines?: number;
}

interface SupplierFolder {
  name: string;
  path: string;
  hasProductsJson: boolean;
  hasImages: boolean;
  imageCount: number;
  productCount: number;
  totalSize: number;
  products?: ProductData[];
  quality: 'good' | 'medium' | 'poor' | 'empty';
  issues: string[];
}

/**
 * 扫描单个供应商文件夹
 */
function scanSupplierFolder(folderPath: string): SupplierFolder {
  const name = path.basename(folderPath);
  const result: SupplierFolder = {
    name,
    path: folderPath,
    hasProductsJson: false,
    hasImages: false,
    imageCount: 0,
    productCount: 0,
    totalSize: 0,
    quality: 'empty',
    issues: [],
  };

  try {
    const files = fs.readdirSync(folderPath);

    // 检查 products.json
    const productsJsonPath = path.join(folderPath, 'products.json');
    if (fs.existsSync(productsJsonPath)) {
      result.hasProductsJson = true;
      const stat = fs.statSync(productsJsonPath);
      result.totalSize += stat.size;

      try {
        const productsJson = JSON.parse(fs.readFileSync(productsJsonPath, 'utf-8'));
        result.products = Array.isArray(productsJson) ? productsJson : [];
        result.productCount = result.products.length;
      } catch {
        result.issues.push('products.json 格式错误');
      }
    } else {
      result.issues.push('缺少 products.json');
    }

    // 检查 images 文件夹
    const imagesPath = path.join(folderPath, 'images');
    if (fs.existsSync(imagesPath) && fs.statSync(imagesPath).isDirectory()) {
      result.hasImages = true;
      const imageFiles = fs.readdirSync(imagesPath);
      result.imageCount = imageFiles.filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).length;

      // 计算图片总大小
      for (const img of imageFiles) {
        const imgPath = path.join(imagesPath, img);
        if (fs.statSync(imgPath).isFile()) {
          result.totalSize += fs.statSync(imgPath).size;
        }
      }
    } else if (result.productCount > 0) {
      result.issues.push('缺少 images 文件夹');
    }

    // 评估质量
    if (result.productCount === 0) {
      result.quality = 'empty';
      result.issues.push('无产品数据');
    } else if (result.hasProductsJson && result.hasImages) {
      // 检查产品质量
      const emptyNames = result.products!.filter((p) => !p.name || p.name.trim() === '').length;
      const noImages = result.products!.filter((p) => !p.images || p.images.length === 0).length;
      const noSpecs = result.products!.filter((p) => !p.specs || p.specs.trim() === '').length;

      if (emptyNames > 0) {
        result.issues.push(`${emptyNames} 个产品无名称`);
        result.quality = 'poor';
      } else if (noImages > result.productCount * 0.5) {
        result.issues.push(`${noImages}/${result.productCount} 产品缺少图片`);
        result.quality = 'medium';
      } else if (noSpecs > result.productCount * 0.8) {
        result.issues.push(`${noSpecs}/${result.productCount} 产品缺少规格`);
        result.quality = 'medium';
      } else {
        result.quality = 'good';
      }
    } else {
      result.quality = 'poor';
    }
  } catch (error: any) {
    result.issues.push(`扫描失败: ${error.message}`);
    result.quality = 'poor';
  }

  return result;
}

/**
 * 审计所有供应商数据
 */
async function auditPDFExtractedData() {
  console.log('🔍 开始审计 PDF 提取的供应商产品数据...\n');
  console.log('=' .repeat(60));

  const baseDir = '/Users/rabbit-y/Documents/消防装备供应商资料/供应商产品数据';

  const entries = fs.readdirSync(baseDir);
  const folders = entries.filter((entry) => {
    const fullPath = path.join(baseDir, entry);
    return fs.statSync(fullPath).isDirectory();
  });

  console.log(`\n📂 发现 ${folders.length} 个供应商文件夹\n`);

  const results: SupplierFolder[] = [];
  let scanned = 0;

  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    const result = scanSupplierFolder(folderPath);
    results.push(result);
    scanned++;

    if (scanned % 100 === 0) {
      console.log(`   已扫描 ${scanned}/${folders.length}...`);
    }
  }

  console.log(`\n✅ 扫描完成！\n`);

  // 统计数据
  console.log('=' .repeat(60));
  console.log('\n📊 【1/4】数据完整性统计\n');

  const withJson = results.filter((r) => r.hasProductsJson).length;
  const withImages = results.filter((r) => r.hasImages).length;
  const withProducts = results.filter((r) => r.productCount > 0).length;
  const empty = results.filter((r) => r.quality === 'empty').length;

  console.log(`   有 products.json: ${withJson}/${results.length} (${((withJson / results.length) * 100).toFixed(1)}%)`);
  console.log(`   有 images 文件夹: ${withImages}/${results.length} (${((withImages / results.length) * 100).toFixed(1)}%)`);
  console.log(`   有产品数据: ${withProducts}/${results.length} (${((withProducts / results.length) * 100).toFixed(1)}%)`);
  console.log(`   空文件夹: ${empty}/${results.length} (${((empty / results.length) * 100).toFixed(1)}%)`);

  // 质量分布
  console.log('\n📊 【2/4】数据质量分布\n');

  const good = results.filter((r) => r.quality === 'good').length;
  const medium = results.filter((r) => r.quality === 'medium').length;
  const poor = results.filter((r) => r.quality === 'poor').length;

  console.log(`   ✅ 优质数据: ${good} 家 (${((good / results.length) * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  中等质量: ${medium} 家 (${((medium / results.length) * 100).toFixed(1)}%)`);
  console.log(`   ❌ 低质量: ${poor} 家 (${((poor / results.length) * 100).toFixed(1)}%)`);
  console.log(`   🗑️  空数据: ${empty} 家 (${((empty / results.length) * 100).toFixed(1)}%)`);

  // 产品与图片统计
  console.log('\n📊 【3/4】产品与图片统计\n');

  const totalProducts = results.reduce((sum, r) => sum + r.productCount, 0);
  const totalImages = results.reduce((sum, r) => sum + r.imageCount, 0);
  const totalSize = results.reduce((sum, r) => sum + r.totalSize, 0);

  console.log(`   总产品数: ${totalProducts}`);
  console.log(`   总图片数: ${totalImages}`);
  console.log(`   总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   平均每家产品数: ${(totalProducts / withProducts).toFixed(1)}`);
  console.log(`   平均每家图片数: ${(totalImages / withImages).toFixed(1)}`);

  // 问题汇总
  console.log('\n📊 【4/4】常见问题汇总\n');

  const issueCount: Record<string, number> = {};
  results.forEach((r) => {
    r.issues.forEach((issue) => {
      issueCount[issue] = (issueCount[issue] || 0) + 1;
    });
  });

  const sortedIssues = Object.entries(issueCount).sort((a, b) => b[1] - a[1]);
  sortedIssues.slice(0, 10).forEach(([issue, count]) => {
    console.log(`   ${issue}: ${count} 家`);
  });

  // 生成建议
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 【建议】数据处理方案\n');

  const goodSuppliers = results.filter((r) => r.quality === 'good');
  const mediumSuppliers = results.filter((r) => r.quality === 'medium');

  console.log(`   ✅ 推荐导入: ${good} 家（优质数据）`);
  console.log(`      - 有完整的产品名称、图片、规格`);
  console.log(`      - 可直接导入数据库`);

  console.log(`\n   🔧 需要清洗: ${medium} 家（中等质量）`);
  console.log(`      - 部分产品缺少图片或规格`);
  console.log(`      - 需要人工审核或补充`);

  console.log(`\n   ❌ 不推荐导入: ${poor + empty} 家（低质量/空数据）`);
  console.log(`      - 数据严重不完整`);
  console.log(`      - 无产品数据或文件损坏`);

  console.log(`\n📋 下一步行动:`);
  console.log(`   1. 导出优质数据清单（${good} 家）`);
  console.log(`   2. 导出中等质量数据清单（${medium} 家，待人工审核）`);
  console.log(`   3. 生成数据样本预览（前 10 家）`);
  console.log(`   4. 制定导入脚本（批量导入到 companies + equipment 表）`);

  // 保存结果
  const outputDir = '/Users/rabbit-y/firegrid/backend/scripts/pdf-audit-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存优质供应商清单
  fs.writeFileSync(
    path.join(outputDir, 'good-suppliers.json'),
    JSON.stringify(goodSuppliers, null, 2)
  );

  // 保存中等质量供应商清单
  fs.writeFileSync(
    path.join(outputDir, 'medium-suppliers.json'),
    JSON.stringify(mediumSuppliers, null, 2)
  );

  // 保存完整报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFolders: results.length,
      withJson,
      withImages,
      withProducts,
      empty,
      totalProducts,
      totalImages,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    },
    quality: {
      good,
      medium,
      poor,
      empty,
    },
    issues: sortedIssues,
  };

  fs.writeFileSync(
    path.join(outputDir, 'audit-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n💾 审计结果已保存到: ${outputDir}/`);
  console.log(`   - good-suppliers.json (${good} 家优质供应商)`);
  console.log(`   - medium-suppliers.json (${medium} 家中等质量供应商)`);
  console.log(`   - audit-report.json (完整审计报告)`);

  console.log(`\n✅ 审计完成！\n`);
}

auditPDFExtractedData().catch(console.error);
