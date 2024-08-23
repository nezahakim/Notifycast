import channelHandler from "./channelHandler.js";
import privateHandler from "./privateHandler.js";

class MessageHandler {
  constructor(bot) {
    this.bot = bot;
    this.channelHandler = new channelHandler(bot);
    this.privateHandler = new privateHandler(bot);
  }

  async handleUpdate(msg) {
    if (msg.chat.type === "private") {
      await this.privateHandler.handleMessage(msg);
    } else if (msg.chat.type === "channel") {
      await this.channelHandler.handleChannelPost(msg);
    } else {
      await this.handleGroupMessage(msg);
    }
  }

  async handleGroupMessage(msg) {
    // Handle group messages here
    console.log("Handling group message:", msg.text);
  }

  async handleNewMember(msg) {
    // Handle new member logic here
    console.log("New member joined:", msg.new_chat_member.first_name);
  }

  async handleInlineQuery(query) {
    // Handle inline query logic here
    console.log("Inline query received:", query.query);
  }
}

export default MessageHandler;
