// controllers/channelHandler.js
import TelegramBot from "node-telegram-bot-api";
import newsService from "./core/newsService.js";
import newsFormatter from "./utils/newsFormatter.js";
import logger from "./utils/logger.js";

class ChannelHandler {
  constructor() {
    this.bot = new TelegramBot(process.env.BOT_TOKEN);
    // this.channelUsername = "@notifyshare";
    this.channelUsername = "@Notifycast";
    this.setupScheduledTasks();
  }

  async sendBreakingNews(news) {
    try {
      const formattedNews = newsFormatter.formatBreakingNews(news);
      await this.bot.sendMessage(this.channelUsername, formattedNews, {
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      });
      logger.info(`Breaking news sent to ${this.channelUsername}`);
    } catch (error) {
      logger.error("Error sending breaking news:", error);
    }
  }

  async sendNewsUpdate() {
    try {
      const news = await newsService.getNews();
      const formattedNews = newsFormatter.formatNewsUpdate(news);
      await this.bot.sendMessage(this.channelUsername, formattedNews, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
      logger.info(`News update sent to ${this.channelUsername}`);
    } catch (error) {
      logger.error("Error sending news update:", error);
    }
  }

  // async sendDailyDigest() {
  //   try {
  //     const news = await newsService.getNews();
  //     const formattedDigest = newsFormatter.formatDailyDigest(news);
  //     await this.bot.sendMessage(this.channelUsername, formattedDigest, {
  //       parse_mode: "Markdown",
  //       disable_web_page_preview: true,
  //     });
  //     logger.info(`Daily digest sent to ${this.channelUsername}`);
  //   } catch (error) {
  //     logger.error("Error sending daily digest:", error);
  //   }
  // }

  async sendDailyDigest() {
    try {
      const news = await newsService.getNews();
      const formattedDigest = newsFormatter.formatDailyDigest(news);
      await this.bot.sendMessage(this.channelUsername, formattedDigest, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      });
      logger.info(`Daily digest sent to ${this.channelUsername}`);
    } catch (error) {
      logger.error("Error sending daily digest:", error);
    }
  }

  setupScheduledTasks() {
    // Schedule news updates every 3 hours
    setInterval(() => this.sendNewsUpdate(), 3 * 60 * 60 * 1000);

    // Schedule daily digest at 8:00 AM UTC
    const now = new Date();
    const msUntil8AM =
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0) -
      now;
    setTimeout(() => {
      this.sendDailyDigest();
      setInterval(() => this.sendDailyDigest(), 24 * 60 * 60 * 1000);
    }, msUntil8AM);
  }
}

export default ChannelHandler;
