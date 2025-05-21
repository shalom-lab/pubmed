# PubMed  Watcher 🧬

A modern, automated dashboard for browsing, searching, and visualizing PubMed research data. Built with Vue 3, Vite, and Tailwind CSS, and powered by automated PubMed data crawling and GitHub Actions CI/CD.

## ✨ Features

- 🤖 **Automated PubMed Data Collection**: Uses scripts to fetch and deduplicate PubMed articles based on custom queries.
- 🕒 **Daily Data Update**: GitHub Actions workflow runs daily to update and build the latest data and site.
- 🔍 **Interactive Web UI**: Search, filter, and sort research articles by topic, date, title, and authors.
- 📱 **Responsive Design**: Clean, mobile-friendly interface using Tailwind CSS.
- 🚀 **One-click Deploy to GitHub Pages**: Fully automated static site deployment.

## 📁 Project Structure

```
├── data/                # JSON data files (auto-generated)
├── public/              # Static assets
├── scripts/
│   ├── pubmed.cjs       # PubMed crawler script (Node.js, CommonJS)
│   └── prebuild.js      # Data pre-processing script
├── src/
│   ├── components/      # Vue components
│   ├── views/           # Main views
│   ├── router/          # Vue Router config
│   └── ...
├── .github/workflows/   # GitHub Actions workflows
├── package.json
└── README.md
```

## 🚀 Usage

### 1. Local Development

```bash
npm install
npm run pubmed      # Fetch latest PubMed data (scripts/pubmed.cjs)
npm run prebuild    # Preprocess/merge data for frontend
npm run dev         # Start local dev server
```

### 2. Build for Production

```bash
npm run build
```

### 3. Automated CI/CD (GitHub Actions)
- `.github/workflows/pubmed-crawler.yml` runs daily:
  1. 📰 Fetches new PubMed data
  2. 🛠️ Preprocesses data
  3. 🏗️ Builds the site
  4. 🌐 Deploys to GitHub Pages

## 📝 Customizing PubMed Queries
- Edit `scripts/query.json` to define your search topics, date ranges, and output files.
- The crawler will fetch and update data accordingly.

## 🛠️ Tech Stack
- [Vue 3](https://vuejs.org/) ⚡
- [Vite](https://vitejs.dev/) ⚡
- [Tailwind CSS](https://tailwindcss.com/) 🎨
- [GitHub Actions](https://github.com/features/actions) 🤖
- [NCBI E-utilities API](https://www.ncbi.nlm.nih.gov/books/NBK25501/) 📚

## 📄 License
MIT

## 👤 Maintainer
[shalom-lab/pubmed](https://github.com/shalom-lab/pubmed)
