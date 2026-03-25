import * as fs from 'fs';

/**
 * 分析供应商数据结构
 * 生成详细的数据要素报告
 */

interface SupplierData {
  status: string;
  url?: string;
  product_count?: number;
  image_count?: number;
  total_spec_lines?: number;
  products?: Array<{
    name: string;
    specs?: string | number;
    imgs?: number | string[];
    images?: string[];
    text?: string;
    url?: string;
    source_url?: string;
    spec_lines?: number;
    img_saved?: number;
  }>;
}

interface CrawlResults {
  [companyName: string]: SupplierData;
}

async function analyzeSuppliers() {
  console.log('📊 开始分析供应商数据结构...\n');

  const filePath = '/Users/rabbit-y/Documents/消防装备供应商资料/供应商产品数据/crawl_results.json';
  const data: CrawlResults = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const suppliers = Object.entries(data);
  console.log(`✅ 总供应商数: ${suppliers.length}\n`);

  // 按状态分类
  const statusGroups: Record<string, number> = {};
  suppliers.forEach(([_, supplierData]) => {
    statusGroups[supplierData.status] = (statusGroups[supplierData.status] || 0) + 1;
  });

  console.log('📂 一、供应商状态分布\n');
  Object.entries(statusGroups)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percentage = ((count / suppliers.length) * 100).toFixed(1);
      console.log(`   ${status}: ${count} 家 (${percentage}%)`);
    });

  // 分析成功爬取的供应商
  const successSuppliers = suppliers.filter(([_, data]) => data.status === 'success');
  console.log(`\n✅ 成功爬取: ${successSuppliers.length} 家\n`);

  // 数据要素分析
  console.log('📋 二、数据要素分析（基于成功爬取的供应商）\n');

  const dataElements = {
    hasUrl: 0,
    hasProductCount: 0,
    hasImageCount: 0,
    hasProducts: 0,
    totalProducts: 0,
    totalImages: 0,
  };

  const sampleData: any[] = [];

  successSuppliers.forEach(([companyName, supplierData]) => {
    if (supplierData.url) dataElements.hasUrl++;
    if (supplierData.product_count) dataElements.hasProductCount++;
    if (supplierData.image_count) dataElements.hasImageCount++;
    if (supplierData.products && supplierData.products.length > 0) {
      dataElements.hasProducts++;
      dataElements.totalProducts += supplierData.products.length;
    }
    if (supplierData.image_count) {
      dataElements.totalImages += supplierData.image_count;
    }

    // 收集前 5 个样本
    if (sampleData.length < 5 && supplierData.products && supplierData.products.length > 0) {
      sampleData.push({
        company: companyName,
        url: supplierData.url,
        productCount: supplierData.product_count || supplierData.products.length,
        sampleProduct: supplierData.products[0],
      });
    }
  });

  console.log('🔑 核心数据要素:\n');
  console.log(`   1. 公司名称: ${suppliers.length} 家 (100%)`);
  console.log(`   2. 官网 URL: ${dataElements.hasUrl} 家 (${((dataElements.hasUrl / successSuppliers.length) * 100).toFixed(1)}%)`);
  console.log(`   3. 产品数量: ${dataElements.hasProductCount} 家 (${((dataElements.hasProductCount / successSuppliers.length) * 100).toFixed(1)}%)`);
  console.log(`   4. 产品详情: ${dataElements.hasProducts} 家 (${((dataElements.hasProducts / successSuppliers.length) * 100).toFixed(1)}%)`);
  console.log(`   5. 产品图片: ${dataElements.hasImageCount} 家 (${((dataElements.hasImageCount / successSuppliers.length) * 100).toFixed(1)}%)`);

  console.log(`\n📦 产品数据统计:\n`);
  console.log(`   总产品数: ${dataElements.totalProducts}`);
  console.log(`   总图片数: ${dataElements.totalImages}`);
  console.log(`   平均每家: ${(dataElements.totalProducts / dataElements.hasProducts).toFixed(1)} 个产品`);

  // 详细数据结构
  console.log('\n\n📖 三、数据结构详解\n');
  console.log('🔹 一级数据（供应商级别）:\n');
  console.log('   - company_name: 公司名称 (string)');
  console.log('   - status: 爬取状态 (success/homepage_only/unreachable/...)');
  console.log('   - url: 官网 URL (string, 可选)');
  console.log('   - product_count: 产品数量 (number, 可选)');
  console.log('   - image_count: 图片数量 (number, 可选)');
  console.log('   - total_spec_lines: 总规格行数 (number, 可选)');

  console.log('\n🔹 二级数据（产品级别）:\n');
  console.log('   - products[].name: 产品名称 (string)');
  console.log('   - products[].specs: 产品规格 (string | number)');
  console.log('   - products[].imgs: 图片数量或URL列表 (number | string[])');
  console.log('   - products[].images: 图片URL列表 (string[], 可选)');
  console.log('   - products[].text: 产品描述文本 (string, 可选)');
  console.log('   - products[].url: 产品页面URL (string, 可选)');
  console.log('   - products[].source_url: 来源URL (string, 可选)');

  // 样本展示
  console.log('\n\n📝 四、数据样本（前5家成功爬取的供应商）\n');
  sampleData.forEach((sample, index) => {
    console.log(`${index + 1}. ${sample.company}`);
    console.log(`   官网: ${sample.url || '(无)'}`);
    console.log(`   产品数: ${sample.productCount}`);
    console.log(`   示例产品: ${sample.sampleProduct.name}`);
    if (sample.sampleProduct.specs) {
      const specsPreview =
        typeof sample.sampleProduct.specs === 'string'
          ? sample.sampleProduct.specs.substring(0, 50) + '...'
          : `${sample.sampleProduct.specs} 行`;
      console.log(`   规格: ${specsPreview}`);
    }
    console.log('');
  });

  // 可用性评估
  console.log('\n\n🎯 五、数据可用性评估\n');

  const usableSuppliers = successSuppliers.length;
  const usablePercentage = ((usableSuppliers / suppliers.length) * 100).toFixed(1);

  console.log(`✅ 可直接使用: ${usableSuppliers} 家 (${usablePercentage}%)`);
  console.log(`   - 有官网URL`);
  console.log(`   - 有产品信息`);
  console.log(`   - 爬取成功\n`);

  const partialSuppliers = suppliers.filter(
    ([_, data]) => data.status === 'homepage_only' || data.status === 'no_products'
  ).length;
  console.log(`⚠️  部分可用: ${partialSuppliers} 家`);
  console.log(`   - 有官网URL`);
  console.log(`   - 但产品信息不完整\n`);

  const unusableSuppliers = suppliers.filter(
    ([_, data]) => data.status === 'unreachable' || data.status === 'invalid_url' || data.status === 'error'
  ).length;
  console.log(`❌ 不可用: ${unusableSuppliers} 家`);
  console.log(`   - 官网无法访问或URL无效\n`);

  // 导入建议
  console.log('\n\n💡 六、导入建议\n');
  console.log('🔸 第一阶段（推荐立即执行）:');
  console.log(`   导入 ${usableSuppliers} 家"success"状态的供应商`);
  console.log('   包含: 公司名称、官网URL、产品数量');
  console.log(`   预计时间: 10-15 分钟\n`);

  console.log('🔸 第二阶段（后续优化）:');
  console.log(`   导入 ${partialSuppliers} 家"homepage_only/no_products"状态的供应商`);
  console.log('   包含: 公司名称、官网URL');
  console.log('   备注: 产品信息需要后续补充\n');

  console.log('🔸 第三阶段（可选）:');
  console.log(`   处理 ${unusableSuppliers} 家"unreachable/invalid"状态的供应商`);
  console.log('   方案: 人工审核、修正URL、重新爬取\n');

  // 保存分析报告
  const reportPath = '/Users/rabbit-y/firegrid/backend/scripts/supplier-analysis-report.json';
  const report = {
    totalSuppliers: suppliers.length,
    statusDistribution: statusGroups,
    dataElements,
    usability: {
      usable: usableSuppliers,
      partial: partialSuppliers,
      unusable: unusableSuppliers,
    },
    recommendation: {
      phase1: {
        count: usableSuppliers,
        status: ['success'],
        priority: 'high',
      },
      phase2: {
        count: partialSuppliers,
        status: ['homepage_only', 'no_products'],
        priority: 'medium',
      },
      phase3: {
        count: unusableSuppliers,
        status: ['unreachable', 'invalid_url', 'error'],
        priority: 'low',
      },
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n💾 分析报告已保存: ${reportPath}\n`);
}

analyzeSuppliers().catch(console.error);
