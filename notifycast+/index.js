require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const NodeCache = require('node-cache');
const Parser = require('rss-parser');
const express = require("express")

// Initialize node-cache
const cache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

// Initialize RSS parser
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
    ],
  },
});

// Telegram Bot Token
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = new express()

bot.on("message", async (msg) => {
  if(msg.chat.type === 'private'){
    await bot.sendMessage(msg.chat.id, "Please Click on any Specified Article In @Notifycast+ I will do my best to give you full news about it. \nHave fun!\n\nFrom @Notifycode Inc.", {parse_mode:"Markdown"})
  }else{
    return;
  }
});


// Telegram Channel ID
const channelId = '@Notifycast';

// News sources with their respective URLs and types
const newsSources = [
  { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', type: 'rss' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', type: 'rss' },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition_world.rss', type: 'rss' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', type: 'rss' }
];

let currentSourceIndex = 0;

// Function to fetch news
async function fetchNews(source) {
  try {
    if (source.type === 'rss') {
      return await fetchRssNews(source);
    } else {
      return await scrapeNews(source);
    }
  } catch (error) {
    console.error(`Error fetching news from ${source.name}:`, error);
    throw error;
  }
}

// Function to fetch RSS news
async function fetchRssNews(source) {
  try {
    const feed = await parser.parseURL(source.url);
    const latestItem = feed.items[0];
    
    let mediaUrl = null;
    let mediaType = null;

    if (latestItem.media) {
      mediaUrl = latestItem.media.$ ? latestItem.media.$.url : null;
      mediaType = latestItem.media.$ ? (latestItem.media.$.medium === 'image' ? 'photo' : 'video') : null;
    } else if (latestItem.thumbnail) {
      mediaUrl = latestItem.thumbnail.$ ? latestItem.thumbnail.$.url : null;
      mediaType = 'photo';
    }

    const fullContent = await getFullArticle(latestItem.link);

    return {
      title: latestItem.title,
      summary: latestItem.contentSnippet || latestItem.content || "",
      fullContent: fullContent,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      fullArticleUrl: latestItem.link,
      source: source.name
    };
  } catch (error) {
    console.error(`Error fetching RSS from ${source.name}:`, error);
    throw error;
  }
}

// Function to scrape news (kept for non-RSS sources)
async function scrapeNews(source) {
  try {
    const response = await axios.get(source.url);
    const $ = cheerio.load(response.data);
    let article;
    let mediaUrl;
    let mediaType;
    let fullArticleUrl;
    let title;
    let summary;

    switch (source.name) {
      case 'BBC':
        article = $('.gs-c-promo-body').first();
        mediaUrl = article.find('img').attr('src') || article.find('video source').attr('src');
        mediaType = article.find('img').length ? 'photo' : (article.find('video').length ? 'video' : null);
        fullArticleUrl = article.find('a').attr('href');
        title = article.find('.gs-c-promo-heading__title').text().trim();
        summary = article.find('.gs-c-promo-summary').text().trim();
        break;
      // ... (other cases remain the same)
    }

    if (!title || !summary || !fullArticleUrl) {
      throw new Error(`Failed to extract all necessary data from ${source.name}`);
    }

    if (fullArticleUrl && !fullArticleUrl.startsWith('http')) {
      fullArticleUrl = new URL(fullArticleUrl, source.url).toString();
    }

    const fullContent = await getFullArticle(fullArticleUrl);

    return {
      title,
      summary,
      fullContent,
      mediaUrl,
      mediaType,
      fullArticleUrl,
      source: source.name
    };
  } catch (error) {
    console.error(`Error scraping news from ${source.name}:`, error);
    throw error;
  }
}

// Function to post news to Telegram channel
async function postNewsToChannel(newsData) {
  try {
    // const caption = `*${newsData.title}*\n\n${newsData.summary.substring(0, 400)}...\n\nSource: [${newsData.source}](${newsData.fullArticleUrl})`;
    const caption = `📰 *${newsData.title}*\n\n• ${newsData.fullContent.split('.')[0]}.\n\n[Notifycast+](http://t.me/Notifycast)  |  [${newsData.source}](${newsData.fullArticleUrl})`;
    
    if (newsData.mediaType === 'photo' && newsData.mediaUrl) {
      await bot.sendPhoto(channelId, newsData.mediaUrl, {
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Read Full News', callback_data: `read_full_news:${newsData.fullArticleUrl}` }
          ]]
        }
      });
    } else if (newsData.mediaType === 'video' && newsData.mediaUrl) {
      await bot.sendVideo(channelId, newsData.mediaUrl, {
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Read Full News', callback_data: `read_full_news:${newsData.fullArticleUrl}` }
          ]]
        }
      });
    } else {
      // If no media, send as a text message
      await bot.sendMessage(channelId, `${caption}\n\nFull article: [${newsData.source}](${newsData.fullArticleUrl})`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Read Full News', callback_data: `read_full_news:${newsData.fullArticleUrl}` }
          ]]
        }
      });
    }
    
    console.log(`Posted news from ${newsData.source}`);
  } catch (error) {
    console.error('Error posting news to channel:', error);
    throw error;
  }
}

async function getFullArticle(url) {
    try {
      console.log(`Fetching full article from: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 seconds timeout
      });
      const $ = cheerio.load(response.data);
      
      // Try different selectors to find the main content
      let articleText = $('article').text().trim();
      if (articleText.length < 300) {
        articleText = $('.article-body').text().trim();
      }
      if (articleText.length < 300) {
        articleText = $('main').text().trim();
      }
      if (articleText.length < 300) {
        articleText = $('body').text().trim();
      }
      
      console.log(`Article text length: ${articleText.length}`);
      return articleText.length > 300 ? articleText : 'Unable to extract a meaningful article text.';
    } catch (error) {
      console.error('Error fetching full article:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
  }
  
bot.on('callback_query', async (callbackQuery) => {
    const [action, url] = callbackQuery.data.split('ws:');
    if (action === 'read_full_ne') {
      try {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Fetching full article...' });
        
        // Check cache first
        let fullArticle = cache.get(url);
        
        if (!fullArticle) {
          console.log('Article not in cache, fetching from source...');
          // If not in cache, fetch and cache it
          fullArticle = await getFullArticle(url);
          cache.set(url, fullArticle);
        } else {
          console.log('Article found in cache');
        }
        
        if (fullArticle === 'Unable to extract a meaningful article text.') {
          await bot.sendMessage(callbackQuery.from.id, 'Sorry, we couldn\'t extract the full article text. Please visit the original link to read the full story.');
          return;
        }
        
        // Split the article into chunks of 4000 characters (Telegram message limit)
        const chunks = fullArticle.match(/.{1,4000}/g);
        await bot.sendMessage(callbackQuery.from.id, `**Here's Full News**:`, { parse_mode: 'Markdown' })

        for (const chunk of chunks) {
          await bot.sendMessage(callbackQuery.from.id, chunk, { parse_mode: 'Markdown' });
        }

      } catch (error) {
        // console.error('Error handling callback query:', error);
        await bot.sendMessage(callbackQuery.from.id, `Follow This Link: ${url} `);
      }
    }
  });
    

// Schedule news posting
cron.schedule('0 6,10,14,18 * * *', async () => {
  const currentSource = newsSources[currentSourceIndex];
  try {
    const newsData = await fetchNews(currentSource);
    await postNewsToChannel(newsData);
  } catch (error) {
    console.error(`Error in scheduled job for ${currentSource.name}:`, error);
  } finally {
    currentSourceIndex = (currentSourceIndex + 1) % newsSources.length;
  }
});

//Testing...
// (async () => {
//     const currentSource = newsSources[currentSourceIndex];
//   try {
//     const newsData = await fetchNews(currentSource);
//     await postNewsToChannel(newsData);
//   } catch (error) {
//     console.error(`Error in scheduled job for ${currentSource.name}:`, error);
//   } finally {
//     currentSourceIndex = (currentSourceIndex + 1) % newsSources.length;
//   }
// })();

// Error handling for the bot
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});



app.listen(process.env.PORT || 8000, ()=>{
  console.log('Telegram Casting Bot is running...')
})

// Graceful shutdown
process.on('SIGINT', () => {
  bot.stopPolling();
  console.log('Bot has been stopped');
  process.exit(0);
});
