const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const { NEWS_SOURCES } = require('../config');

class NewsService {
  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media'],
          ['media:thumbnail', 'thumbnail'],
          ['description', 'description']
        ],
      },
    });
    
    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
  }

  async fetchRssNews(source) {
    try {
      const feed = await this.parser.parseURL(source.url);
      const latestItem = feed.items[0];
      
      const mediaContent = this.extractMediaContent(latestItem);
      const fullContent = await this.getFullArticle(latestItem.link, source.selectors);

      return {
        title: latestItem.title,
        summary: this.cleanText(latestItem.description || latestItem.content),
        fullContent: fullContent,
        mediaUrl: mediaContent.url,
        mediaType: mediaContent.type,
        fullArticleUrl: latestItem.link,
        source: source.name,
        publishDate: new Date(latestItem.pubDate)
      };
    } catch (error) {
      throw new Error(`RSS Fetch Error (${source.name}): ${error.message}`);
    }
  }

  extractMediaContent(item) {
    if (item.media) {
      return {
        url: item.media.$.url,
        type: item.media.$.medium === 'image' ? 'photo' : 'video'
      };
    } else if (item.thumbnail) {
      return {
        url: item.thumbnail.$.url,
        type: 'photo'
      };
    }
    return { url: null, type: null };
  }

  async getFullArticle(url, selectors) {
    try {
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);
      
      let content = $(selectors.content).text();
      content = this.cleanText(content);

      if (!content || content.length < 300) {
        content = $('article, .article-body, main').text();
        content = this.cleanText(content);
      }

      return content || 'Content extraction failed. Please visit the original article.';
    } catch (error) {
      throw new Error(`Article Fetch Error: ${error.message}`);
    }
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}

module.exports = new NewsService();
