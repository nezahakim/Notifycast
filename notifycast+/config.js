require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  CHANNEL_ID: '@Notifycast',
  PORT: process.env.PORT || 8000,
  CACHE_TTL: 86400,
  NEWS_SOURCES: [
    { 
      name: 'BBC',
      url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      type: 'rss',
      selectors: {
        content: 'article, .story-body__inner',
        image: '.js-image-replace, .article-figure-image'
      }
    },
    {
      name: 'Al Jazeera',
      url: 'https://www.aljazeera.com/xml/rss/all.xml',
      type: 'rss',
      selectors: {
        content: '.article__content, .main-article-content',
        image: '.article-featured-image img'
      }
    },
    {
      name: 'CNN',
      url: 'http://rss.cnn.com/rss/edition_world.rss',
      type: 'rss',
      selectors: {
        content: '.article__content, .zn-body__paragraph',
        image: '.media__image'
      }
    },
    {
      name: 'Reuters',
      url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
      type: 'rss',
      selectors: {
        content: '.article-body, .ArticleBody',
        image: '.featured-image img'
      }
    }
  ]
};
