const https = require('https');
const fs = require('fs');
const path = require('path');

// 确保data目录存在
function ensureDataDirectory() {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  return dataDir;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => reject(e));
  });
}

// 读取现有数据并去重
function readAndDeduplicate(filePath, newArticles) {
  let existingArticles = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    existingArticles = JSON.parse(fileContent);
  }

  // 使用DOI作为唯一标识符进行去重
  const doiMap = new Map();

  // 首先添加现有文章
  existingArticles.forEach(article => {
    if (article.doi) {
      doiMap.set(article.doi, article);
    }
  });

  // 然后添加新文章，如果有相同DOI会覆盖
  newArticles.forEach(article => {
    if (article.doi) {
      doiMap.set(article.doi, article);
    }
  });

  return Array.from(doiMap.values());
}

function buildEsearchUrl(params) {
  const {
    term,
    retmax,
    reldate,
    minDate,
    maxDate
  } = params;

  const dateParams = reldate !== undefined && reldate !== null
    ? `&reldate=${reldate}`
    : (minDate && maxDate
      ? `&mindate=${minDate}&maxdate=${maxDate}`
      : '');
  const retmaxParams = retmax !== undefined && retmax !== null
    ? `&retmax=${retmax}`
    : '&retmax=50';

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?` +
    `db=pubmed&term=${encodeURIComponent(term)}` +
    dateParams +
    retmaxParams +
    `&retmode=json&sort=pubdate&datetype=pdat`;

  return url;
}


async function searchPubMed(query) {
  const { name, filename } = query;
  const esearchUrl = buildEsearchUrl(query);
  console.log(esearchUrl);
  const searchResult = await fetchJSON(esearchUrl);
  const idList = searchResult.esearchresult.idlist;
  if (idList.length === 0) {
    console.log('No articles found for the specified date range.');
    return;
  }

  const ids = idList.join(',');
  const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
  const summaryResult = await fetchJSON(esummaryUrl);

  // 准备要保存的数据
  const articles = idList.map(id => {
    const item = summaryResult.result[id];
    return {
      name: name,
      id: id,
      title: item.title,
      source: item.source,
      pubdate: item.pubdate,
      authors: item.authors.map(a => a.name),
      lastauthor: item.lastauthor,
      sortfirstauthor: item.sortfirstauthor,
      journal: item.fulljournalname,
      issn: item.issn,
      essn: item.essn,
      doi: item.elocationid,
      sortpubdate: item.sortpubdate,
      epubdate: item.epubdate
    };
  });

  // 保存到文件
  const dataDir = ensureDataDirectory();
  const filePath = path.join(dataDir, `${filename}`);

  // 读取现有数据并去重
  const deduplicatedArticles = readAndDeduplicate(filePath, articles);

  // 保存去重后的数据
  fs.writeFileSync(filePath, JSON.stringify(deduplicatedArticles, null, 2));
  console.log(`Results saved to: ${filePath}`);

  // 打印结果
  articles.forEach(article => {
    console.log(`Title: ${article.title}`);
    /*     console.log(`Source: ${article.source}`);
        console.log(`Journal: ${article.journal}`);
        console.log(`DOI: ${article.doi}`);
        console.log(`PubDate: ${article.pubdate}`);
        console.log(`Authors: ${article.authors.join(', ')}`); */
    console.log('---');
  });
}

// 从query.json读取配置并执行查询
async function processQueries() {
  try {
    const queryConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'query.json'), 'utf8'));
    for (const query of queryConfig) {
      console.log(`Processing query: ${query.name}`);
      await searchPubMed(query);
    }
  } catch (error) {
    console.error('Error processing queries:', error);
  }
}

// 执行查询
processQueries().catch(console.error);
