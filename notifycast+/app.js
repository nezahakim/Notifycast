const { Telegraf, Markup } = require('telegraf');
const { BOT_TOKEN, CHANNEL_ID } = require('./config');
const NewsService = require('./services/NewsService');
const Cache = require('./services/CacheService');
const { scheduleJob } = require('node-schedule');

class NewsBot {
  constructor() {
    this.bot = new Telegraf(BOT_TOKEN);
    this.setupMiddleware();
    this.setupCommands();
    this.setupCallbacks();
    this.setupScheduler();
  }

  setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        console.error('Bot Error:', error);
        await ctx.reply('An error occurred. Please try again later.');
      }
    });
  }

  setupCommands() {
    this.bot.command('start', this.handleStart.bind(this));
    this.bot.command('latest', this.handleLatest.bind(this));
    this.bot.command('sources', this.handleSources.bind(this));
  }

  setupCallbacks() {
    this.bot.action(/read_full_news:(.+)/, this.handleFullNews.bind(this));
    this.bot.action(/source:(.+)/, this.handleSources.bind(this));
  }

  async handleStart(ctx) {
    const message = `
Welcome to NotifyCast News Bot! 🌟

I can help you stay updated with the latest news from various trusted sources.

Available commands:
/latest - Get the latest news
/sources - List all news sources

You can also find me on @Notifycast channel!
    `;
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Join Channel', 't.me/Notifycast')]
      ])
    });
  }

  async handleLatest(ctx) {
    try {
      const source = NEWS_SOURCES[0];
      const news = await NewsService.fetchRssNews(source);
      await this.sendNews(ctx, news);
    } catch (error) {
      await ctx.reply('Failed to fetch latest news. Please try again later.');
    }
  }

  async handleSources(ctx) {
    const buttons = NEWS_SOURCES.map(source => 
      [Markup.button.callback(source.name, `source:${source.name}`)]
    );
    
    await ctx.reply('Select a news source:', Markup.inlineKeyboard(buttons));
  }

  async handleFullNews(ctx) {
    const url = ctx.match[1];
    try {
      const cachedArticle = await Cache.get(url);
      const article = cachedArticle || await NewsService.getFullArticle(url);
      
      if (!cachedArticle) {
        await Cache.set(url, article);
      }

      const chunks = article.match(/.{1,4000}/g) || [];
      await ctx.reply('📰 *Full Article*:', { parse_mode: 'Markdown' });
      
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      await ctx.reply(`Unable to fetch full article. Please visit: ${url}`);
    }
  }

  async sendNews(ctx, news) {
    const caption = `
📰 *${news.title}*

${news.summary.substring(0, 300)}...

🔍 Source: [${news.source}](${news.fullArticleUrl})
📅 Published: ${news.publishDate.toLocaleDateString()}
    `;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Read Full Article', `read_full_news:${news.fullArticleUrl}`)]
    ]);

    if (news.mediaUrl && news.mediaType === 'photo') {
      await ctx.replyWithPhoto(news.mediaUrl, {
        caption,
        parse_mode: 'Markdown',
        ...keyboard
      });
    } else {
      await ctx.reply(caption, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
        ...keyboard
      });
    }
  }

  setupScheduler() {
    // Schedule news posts every 4 hours
    scheduleJob('0 */4 * * *', this.postScheduledNews.bind(this));
  }

  async postScheduledNews() {
    for (const source of NEWS_SOURCES) {
      try {
        const news = await NewsService.fetchRssNews(source);
        await this.bot.telegram.sendMessage(CHANNEL_ID, this.formatChannelPost(news), {
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        });
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5s delay between posts
      } catch (error) {
        console.error(`Scheduled post error for ${source.name}:`, error);
      }
    }
  }

  formatChannelPost(news) {
    return `
📰 *${news.title}*

${news.summary.substring(0, 300)}...

🔍 [Read full article](${news.fullArticleUrl})
📱 [@Notifycast](https://t.me/Notifycast)
    `;
  }

  launch() {
    this.bot.launch();
    console.log('News Bot is running...');

    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

module.exports = new NewsBot();