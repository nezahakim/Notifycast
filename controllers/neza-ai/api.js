import axios from 'axios';

class NezaAI {
  constructor() {
    this.apiUrl = process.env.NEZA_AI_API_URL;
    this.apiKey = process.env.NEZA_AI_API_KEY;
  }

  async processMessage(message) {
    try {
      const response = await axios.post(
        this.apiUrl,
        { message },
        { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
      );
      return response.data.reply;
    } catch (error) {
      console.error('Error processing message with NezaAI:', error);
      return 'Sorry, I encountered an error while processing your message.';
    }
  }
}

export default new NezaAI();
