// controllers/core/newsService.js

import axios from "axios";
import * as cheerio from "cheerio";
import Parser from "rss-parser";
import NodeCache from "node-cache";
import scrapingImages from './scrapingImages.js';

const parser = new Parser();
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

class NewsService {
  constructor() {
    this.sources = [
      {
        name: "Al Jazeera",
        url: "https://www.aljazeera.com/where/palestine/",
        type: "scrape",
        selector: ".gc__content",
        category: "palestine",
      },
      {
        name: "BBC World",
        url: "http://feeds.bbci.co.uk/news/world/rss.xml",
        type: "rss",
        category: "world",
      },
      {
        name: "Reuters World",
        url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
        type: "rss",
        category: "world",
      },
      {
        name: "UN News",
        url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml",
        type: "rss",
        category: "middleEast",
      },
    ];
  }

  async getNews() {
    const cachedNews = cache.get("allNews");
    if (cachedNews) {
      console.log("Returning cached news");
      return cachedNews;
    }

    let allNews = [];
    for (const source of this.sources) {
      try {
        console.log(`Fetching news from ${source.name}...`);
        let news = [];
        if (source.type === "scrape") {
          news = await this.scrapeNews(source);
        } else if (source.type === "rss") {
          news = await this.getRssNews(source);
        }
        console.log(`Fetched ${news.length} items from ${source.name}`);
        allNews = allNews.concat(
          news.map((item) => ({ ...item, category: source.category }))
        );
      } catch (error) {
        console.error(
          `Error fetching news from ${source.name}:`,
          error.message
        );
      }
    }

    console.log(`Total news items fetched: ${allNews.length}`);
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    const categorizedNews = this.categorizeNews(allNews);
    cache.set("allNews", categorizedNews);
    return categorizedNews;
  }

  categorizeNews(news) {
    const categories = {
      palestine: [],
      conflicts: [],
      world: [],
      general: [],
    };

    const conflictKeywords = [
      "conflict",
      "war",
      "crisis",
      "tension",
      "dispute",
    ];

    news.forEach((item) => {
      const lowerTitle = item.title.toLowerCase();
      const lowerSummary = item.summary.toLowerCase();

      if (
        item.category === "palestine" ||
        lowerTitle.includes("palestine") ||
        lowerTitle.includes("gaza")
      ) {
        categories.palestine.push(item);
      } else if (
        conflictKeywords.some(
          (keyword) =>
            lowerTitle.includes(keyword) || lowerSummary.includes(keyword)
        )
      ) {
        categories.conflicts.push(item);
      } else if (item.category === "world" || item.category === "middleEast") {
        categories.world.push(item);
      } else {
        categories.general.push(item);
      }
    });

    return categories;
  }

  async scrapeNews(source) {
    try {
      const response = await axios.get(source.url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      let news = [];
      $(source.selector).each((i, element) => {
        if (i < 5) {
          const title = $(element).find("h3").text().trim();
          const summary = $(element).find("p").text().trim();
          const link = $(element).find("a").attr("href");
          const date = new Date();
          if (title && summary) {
            news.push({
              title,
              summary,
              link: link.startsWith("http")
                ? link
                : `${new URL(source.url).origin}${link}`,
              source: source.name,
              date,
            });
          }
        }
      });

      // Add image scraping
      for (let item of news) {
        const imageUrl = await scrapingImages.scrapeImageFromArticle(item.link);
        if (imageUrl) {
          item.imageUrl = imageUrl;
        }
      }

      return news;
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error.message);
      return [];
    }
  }

  async getRssNews(source) {
    try {
      const feed = await parser.parseURL(source.url);
      const news = feed.items.slice(0, 5).map((item) => ({
        title: item.title,
        summary: item.contentSnippet || item.content || "",
        link: item.link,
        source: source.name,
        date: new Date(item.pubDate),
      }));

      // Add image scraping for RSS items
      for (let item of news) {
        const imageUrl = await scrapingImages.scrapeImageFromArticle(item.link);
        if (imageUrl) {
          item.imageUrl = imageUrl;
        }
      }

      return news;
    } catch (error) {
      console.error(`Error fetching RSS from ${source.name}:`, error.message);
      return [];
    }
  }

  async getNewsUpdate() {
    try {
      console.log("Starting news fetch...");
      const news = await this.getNews();
      console.log("News fetched, formatting update...");
      console.log("News update formatted.");
      return news;
    } catch (error) {
      console.error("Error getting news update:", error);
      return null;
    }
  }
}

export default new NewsService();
