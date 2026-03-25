import * as fs from 'fs';

/**
 * 审计爬取供应商数据质量
 * 
 * 检查项：
 * 1. 数据完整性（必填字段）
 * 2. 数据格式正确性（URL、邮箱等）
 * 3. 产品数据质量
 * 4. 是否与现有公司重复
 */

interface CrawledSupplier {
  company_name: string;
  url?: string;
  status: string;
  product_count?: number;
  image_count?: number;
  products?: Array<{
    name?: string;
    specs?: string;
    imgs?: number | string;
    text?: string;
    url?: string;
  }>;
  error?: string;
}

interface AuditResult {
  total: number;
  success: number;
  issues: {
    noName: number;
    noUrl: number;
    noProducts: number;
    invalidUrl: number;
    lowQualityProducts: number;
    emptyProductNames: number;
  };
  goodSuppliers: CrawledSupplier[];
  badSuppliers: Array<{ name: string; reason: string }>;
  duplicates: Array<{ name: string; existsIn: string }>;
}

/**
 * 检查 URL 格式
 */
function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 检查产品数据质量
 */
function checkProductQuality(products: any[]): { quality: 'good' | 'medium' | 'poor'; issues: string[] } {
  const issues: string[] = [];
  
  if (!products || products.length === 0) {
    return { quality: 'poor', issues: ['无产品数据'] };
  }

  const emptyNames = products.filter((p) => !p.name || (typeof p.name === 'string' && p.name.trim() === '')).length;
  const noSpecs = products.filter((p) => !p.specs || (typeof p.specs === 'string' && p.specs.trim() === '')).length;
  const noImages = products.filter((p) => !p.imgs || p.imgs === 0).length;

  if (emptyNames > 0) {
    issues.push(`${emptyNames} 个产品无名称`);
  }

  if (noSpecs > products.length * 0.8) {
    issues.push(`${noSpecs}/${products.length} 产品缺少规格参数`);
  }

  if (noImages > products.length * 0.5) {
    issues.push(`${noImages}/${products.length} 产品无图片`);
  }

  // 判断质量
  if (emptyNames > 0 || issues.length > 2) {
    return { quality: 'poor', issues };
  } else if (issues.length > 0) {
    return { quality: 'medium', issues };
  } else {
    return { quality: 'good', issues: [] };
  }
}

async function auditCrawledSuppliers() {
  console.log('🔍 开始审计爬取供应商数据...\n');
  console.log('=' .repeat(60));

  const jsonPath = '/Users/rabbit-y/Documents/消防装备供应商资料/供应商产品数据/crawl_results.json';
  const dataObj = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // 转换为数组
  const suppliers: CrawledSupplier[] = Object.entries(dataObj).map(([name, info]: [string, any]) => ({
    company_name: name,
    ...info,
  }));

  console.log(`\n📊 【1/5】基础统计\n`);
  console.log(`   总供应商数: ${suppliers.length}`);

  const successSuppliers = suppliers.filter((s) => s.status === 'success');
  console.log(`   成功爬取: ${successSuppliers.length} (${((successSuppliers.length / suppliers.length) * 100).toFixed(1)}%)`);

  // 检查数据完整性
  console.log(`\n🔍 【2/5】数据完整性检查\n`);

  const issues = {
    noName: 0,
    noUrl: 0,
    noProducts: 0,
    invalidUrl: 0,
    lowQualityProducts: 0,
    emptyProductNames: 0,
  };

  const goodSuppliers: CrawledSupplier[] = [];
  const badSuppliers: Array<{ name: string; reason: string }> = [];

  for (const supplier of successSuppliers) {
    const problems: string[] = [];

    // 检查公司名称
    if (!supplier.company_name || supplier.company_name.trim() === '') {
      issues.noName++;
      problems.push('无公司名称');
    }

    // 检查 URL
    if (!supplier.url) {
      issues.noUrl++;
      problems.push('无官网 URL');
    } else if (!isValidUrl(supplier.url)) {
      issues.invalidUrl++;
      problems.push('URL 格式错误');
    }

    // 检查产品
    if (!supplier.products || supplier.products.length === 0) {
      issues.noProducts++;
      problems.push('无产品数据');
    } else {
      const productQuality = checkProductQuality(supplier.products);
      
      if (productQuality.quality === 'poor') {
        issues.lowQualityProducts++;
        problems.push(`产品质量差: ${productQuality.issues.join(', ')}`);
      }

      const emptyNames = supplier.products.filter((p) => !p.name || p.name.trim() === '').length;
      if (emptyNames > 0) {
        issues.emptyProductNames += emptyNames;
      }
    }

    // 判断是否为"好数据"
    if (problems.length === 0) {
      goodSuppliers.push(supplier);
    } else {
      badSuppliers.push({
        name: supplier.company_name,
        reason: problems.join('; '),
      });
    }
  }

  console.log(`   ✅ 数据完整: ${goodSuppliers.length} 家`);
  console.log(`   ⚠️  数据不完整: ${badSuppliers.length} 家`);
  console.log(`\n   具体问题:`);
  console.log(`      无公司名称: ${issues.noName}`);
  console.log(`      无官网 URL: ${issues.noUrl}`);
  console.log(`      URL 格式错误: ${issues.invalidUrl}`);
  console.log(`      无产品数据: ${issues.noProducts}`);
  console.log(`      产品质量差: ${issues.lowQualityProducts}`);
  console.log(`      产品名称为空: ${issues.emptyProductNames} 个`);

  // 检查重复
  console.log(`\n🔄 【3/5】检查与现有公司重复\n`);

  const existingCompaniesPath = '/Users/rabbit-y/firegrid/backend/scripts/cleaned-data/companies-cleaned.json';
  const existingCompanies = JSON.parse(fs.readFileSync(existingCompaniesPath, 'utf-8'));
  const existingNames = new Set(existingCompanies.map((c: any) => c.cleanedName.toLowerCase()));

  const duplicates: Array<{ name: string; existsIn: string }> = [];

  for (const supplier of goodSuppliers) {
    const cleanedName = supplier.company_name.trim().toLowerCase();
    if (existingNames.has(cleanedName)) {
      duplicates.push({
        name: supplier.company_name,
        existsIn: 'companies 表',
      });
    }
  }

  console.log(`   重复公司: ${duplicates.length} 家`);
  if (duplicates.length > 0) {
    console.log(`   （这些公司已存在于数据库，可以用爬取数据补充产品信息）`);
  }

  // 产品数据统计
  console.log(`\n📦 【4/5】产品数据统计\n`);

  let totalProducts = 0;
  let totalImages = 0;
  let productsWithSpecs = 0;
  let productsWithImages = 0;

  for (const supplier of goodSuppliers) {
    if (supplier.products) {
      totalProducts += supplier.products.length;
      
      for (const product of supplier.products) {
        if (product.specs && typeof product.specs === 'string' && product.specs.trim() !== '') {
          productsWithSpecs++;
        }
        if (product.imgs && product.imgs !== 0) {
          productsWithImages++;
          if (typeof product.imgs === 'number') {
            totalImages += product.imgs;
          }
        }
      }
    }
  }

  console.log(`   总产品数: ${totalProducts}`);
  console.log(`   总图片数: ${totalImages}`);
  console.log(`   有规格参数: ${productsWithSpecs}/${totalProducts} (${((productsWithSpecs / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`   有图片: ${productsWithImages}/${totalProducts} (${((productsWithImages / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`   平均每家: ${(totalProducts / goodSuppliers.length).toFixed(1)} 个产品`);

  // 生成建议
  console.log(`\n💡 【5/5】导入建议\n`);

  const importable = goodSuppliers.filter((s) => !duplicates.find((d) => d.name === s.company_name));

  console.log(`   ✅ 推荐导入: ${importable.length} 家`);
  console.log(`      - 数据完整`);
  console.log(`      - 不重复`);
  console.log(`      - 有产品数据`);

  console.log(`\n   🔄 可用于补充: ${duplicates.length} 家`);
  console.log(`      - 已存在于 companies 表`);
  console.log(`      - 可补充产品详情`);

  console.log(`\n   ❌ 不推荐导入: ${badSuppliers.length} 家`);
  console.log(`      - 数据不完整或质量差`);

  // 显示问题示例
  if (badSuppliers.length > 0) {
    console.log(`\n   ⚠️  问题示例（前 10 个）:`);
    badSuppliers.slice(0, 10).forEach((bad, i) => {
      console.log(`      ${i + 1}. ${bad.name}`);
      console.log(`         问题: ${bad.reason}`);
    });
  }

  // 保存结果
  console.log(`\n` + '='.repeat(60));

  const result: AuditResult = {
    total: suppliers.length,
    success: successSuppliers.length,
    issues,
    goodSuppliers: importable,
    badSuppliers,
    duplicates,
  };

  const outputPath = '/Users/rabbit-y/firegrid/backend/scripts/crawled-suppliers-audit.json';
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`\n💾 审计报告已保存到: ${outputPath}`);

  // 保存推荐导入的供应商
  const importablePath = '/Users/rabbit-y/firegrid/backend/scripts/crawled-suppliers-importable.json';
  fs.writeFileSync(importablePath, JSON.stringify(importable, null, 2));
  console.log(`💾 推荐导入的供应商已保存到: ${importablePath}`);

  console.log(`\n✅ 审计完成！\n`);
  console.log(`📊 总结:`);
  console.log(`   总供应商: ${suppliers.length}`);
  console.log(`   成功爬取: ${successSuppliers.length}`);
  console.log(`   ✅ 推荐导入: ${importable.length} 家（新公司，数据完整）`);
  console.log(`   🔄 可补充数据: ${duplicates.length} 家（已存在，可补充产品）`);
  console.log(`   ❌ 不推荐导入: ${badSuppliers.length} 家（数据质量差）`);
}

auditCrawledSuppliers().catch(console.error);
