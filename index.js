// index.js
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import express from "express";
import MessageHandler from "./controllers/messageHandler.js";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

// Create a bot instance
const bot = new TelegramBot(BOT_TOKEN);

// Setup webhook
const url = "https://notifycast.vercel.app";
const webhookUrl = `${url}/bot${BOT_TOKEN}`;
bot.setWebHook(webhookUrl);

// Create Express app
const app = express();
app.use(express.json());

// Initialize message handler
const msgHandler = new MessageHandler(bot);

// Handle updates
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Define handlers
bot.on("message", async (msg) => {
  await msgHandler.handleUpdate(msg);
});

// bot.on("new_chat_members", async (msg) => {
//   await msgHandler.handleNewMember(msg);
// });

// bot.on("inline_query", async (query) => {
//   await msgHandler.handleInlineQuery(query);
// });

console.log("Bot is configured for webhook...");

// Export the Express app
export default app;
