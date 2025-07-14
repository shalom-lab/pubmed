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
  if (!searchResult.esearchresult || !searchResult.esearchresult.idlist) {
    console.error(`No esearchresult or idlist for query: ${query.name}`);
    return;
  }
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
    //console.log(`Title: ${article.title}`);
    /*     console.log(`Source: ${article.source}`);
        console.log(`Journal: ${article.journal}`);
        console.log(`DOI: ${article.doi}`);
        console.log(`PubDate: ${article.pubdate}`);
        console.log(`Authors: ${article.authors.join(', ')}`); */
    //console.log('---');
  });
}

// 读取所有JSON文件并提取期刊信息
async function collectJournalInfo() {
  const dataDir = ensureDataDirectory();
  const journalMap = new Map(); // 使用Map来存储唯一的期刊信息

  // 读取现有的journals.json（如果存在）
  const journalsPath = path.join(dataDir, 'journals.json');
  if (fs.existsSync(journalsPath)) {
    const existingJournals = JSON.parse(fs.readFileSync(journalsPath, 'utf8'));
    existingJournals.forEach(journal => {
      const key = journal.source || journal.journal;
      if (key) {
        journalMap.set(key, journal);
      }
    });
  }

  // 读取data目录下的所有JSON文件
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'journals.json');
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const articles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 从每篇文章中提取期刊信息
    articles.forEach(article => {
      const key = article.source || article.journal;
      if (key) {
        // 如果这个期刊还没有被记录，或者有新的信息，就更新
        if (!journalMap.has(key) || 
            (article.issn && !journalMap.get(key).issn) || 
            (article.essn && !journalMap.get(key).essn)) {
          journalMap.set(key, {
            source: article.source,
            journal: article.journal,
            issn: article.issn || journalMap.get(key)?.issn,
            essn: article.essn || journalMap.get(key)?.essn
          });
        }
      }
    });
  }

  // 将Map转换为数组并保存
  const journals = Array.from(journalMap.values());
  fs.writeFileSync(journalsPath, JSON.stringify(journals, null, 2));
  console.log(`Updated journals.json with ${journals.length} unique journals`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 修改 processQueries 函数，在最后添加对 collectJournalInfo 的调用
async function processQueries() {
  try {
    const queryConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'query.json'), 'utf8'));
    for (const query of queryConfig) {
      try {
        console.log(`Processing query: ${query.name}`);
        await searchPubMed(query);
        await sleep(1000);
      } catch (err) {
        console.error(`Error processing query "${query.name}":`, err);
      }
    }
    // 在所有查询完成后，收集期刊信息
    await collectJournalInfo();
  } catch (error) {
    console.error('Error processing queries:', error);
  }
}

// 执行查询
processQueries().catch(console.error);
