/**
 * Strapi v5 Populate 测试脚本
 *
 * 用于测试不同的 populate 语法，找出正确的方案
 */

const STRAPI_URL = 'http://localhost:1337';
const PAGE_SLUG = 'home';

// 方案 1：完整的嵌套 populate（推荐）
const POPULATE_V1 = [
  'populate[sections][on][page.hero-banner][populate][slides][populate][image]=true',
  'populate[sections][on][page.category-grid][populate][categories]=true',
  'populate[sections][on][page.product-carousel]=true',
  'populate[sections][on][page.service-badges][populate][badges]=true',
  'populate[seo][populate][ogImage]=true',
  'populate[featuredImage]=true',
].join('&');

// 方案 2：使用通配符
const POPULATE_V2 = [
  'populate[sections][on][page.hero-banner][populate][slides][populate]=*',
  'populate[sections][on][page.category-grid][populate]=*',
  'populate[sections][on][page.product-carousel]=true',
  'populate[sections][on][page.service-badges][populate]=*',
  'populate[seo][populate]=*',
  'populate[featuredImage]=true',
].join('&');

// 方案 3：简化版（仅 populate 第一层）
const POPULATE_V3 = [
  'populate[sections][on][page.hero-banner][populate]=*',
  'populate[sections][on][page.category-grid][populate]=*',
  'populate[sections][on][page.product-carousel]=true',
  'populate[sections][on][page.service-badges][populate]=*',
  'populate[seo]=true',
  'populate[featuredImage]=true',
].join('&');

async function testPopulate(version, populateQuery) {
  const url = `${STRAPI_URL}/api/pages?filters[slug][$eq]=${PAGE_SLUG}&${populateQuery}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`测试方案 ${version}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error(
        `❌ 错误 (${response.status}):`,
        JSON.stringify(data, null, 2)
      );
      return false;
    }

    console.log(`✅ 成功！状态码: ${response.status}`);

    // 检查数据结构
    if (data.data && data.data.length > 0) {
      const page = data.data[0];
      console.log(`\n页面标题: ${page.title}`);
      console.log(`\n数据结构检查:`);
      console.log(`- featuredImage: ${page.featuredImage ? '✅' : '❌'}`);
      console.log(`- seo: ${page.seo ? '✅' : '❌'}`);
      console.log(`- seo.ogImage: ${page.seo?.ogImage ? '✅' : '❌'}`);
      console.log(
        `- sections: ${
          page.sections ? `✅ (${page.sections.length} 个)` : '❌'
        }`
      );

      if (page.sections) {
        page.sections.forEach((section, i) => {
          console.log(`\n  Section ${i + 1}: ${section.__component}`);

          if (section.__component === 'page.hero-banner') {
            console.log(
              `    - slides: ${
                section.slides ? `✅ (${section.slides.length} 个)` : '❌'
              }`
            );
            if (section.slides && section.slides[0]) {
              console.log(
                `    - slides[0].image: ${
                  section.slides[0].image ? '✅' : '❌'
                }`
              );
            }
          }

          if (section.__component === 'page.category-grid') {
            console.log(
              `    - categories: ${
                section.categories
                  ? `✅ (${section.categories.length} 个)`
                  : '❌'
              }`
            );
          }

          if (section.__component === 'page.service-badges') {
            console.log(
              `    - badges: ${
                section.badges ? `✅ (${section.badges.length} 个)` : '❌'
              }`
            );
          }
        });
      }

      console.log(`\n完整响应数据:`);
      console.log(JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`⚠️  返回空数据`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`❌ 请求失败:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Strapi v5 Populate 语法测试');
  console.log(`Strapi URL: ${STRAPI_URL}`);
  console.log(`Page Slug: ${PAGE_SLUG}`);

  const results = [];

  // 测试方案 1
  results.push({
    version: 1,
    success: await testPopulate(1, POPULATE_V1),
  });

  // 测试方案 2
  results.push({
    version: 2,
    success: await testPopulate(2, POPULATE_V2),
  });

  // 测试方案 3
  results.push({
    version: 3,
    success: await testPopulate(3, POPULATE_V3),
  });

  // 总结
  console.log(`\n${'='.repeat(80)}`);
  console.log('测试总结');
  console.log(`${'='.repeat(80)}`);
  results.forEach(r => {
    console.log(`方案 ${r.version}: ${r.success ? '✅ 成功' : '❌ 失败'}`);
  });

  const successfulVersion = results.find(r => r.success);
  if (successfulVersion) {
    console.log(`\n推荐使用: 方案 ${successfulVersion.version}`);
  } else {
    console.log(
      `\n⚠️  所有方案都失败了，建议安装 strapi-plugin-populate-deep 插件`
    );
  }
}

main().catch(console.error);
