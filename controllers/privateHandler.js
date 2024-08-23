// controllers/privateHandler.js

import TelegramBot from "node-telegram-bot-api";
import logger from "./utils/logger.js";

class PrivateHandler {
  constructor() {
    this.bot = new TelegramBot(process.env.BOT_TOKEN);
    this.setupCommands();
  }

  setupCommands() {
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/help/, this.handleHelp.bind(this));
    this.bot.on("message", this.handleMessage.bind(this));
  }

  async handleStart(msg) {
    const chatId = msg.chat.id;
    const message = `Welcome to NotifyCast Bot! 🎉

Stay informed with the latest news updates by following our channel @Notifycast.

For more information, use /help command.`;

    await this.bot.sendMessage(chatId, message);
    logger.info(`Start command used by user ${msg.from.id}`);
  }

  async handleHelp(msg) {
    const chatId = msg.chat.id;
    const message = `NotifyCast Bot Help 📚

Our bot provides news updates through our official channel @Notifycast.

Available commands:
/start - Start the bot
/help - Show this help message

For the latest news updates, please follow @Notifycast.`;

    await this.bot.sendMessage(chatId, message);
    logger.info(`Help command used by user ${msg.from.id}`);
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const message = `Thank you for your message. For the latest news updates, please follow our official channel @Notifycast.

If you need assistance, use the /help command.`;

    await this.bot.sendMessage(chatId, message);
    logger.info(`Message received from user ${msg.from.id}`);
  }
}

export default PrivateHandler;
