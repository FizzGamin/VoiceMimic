import OpenAI from 'openai';
import config from '../config.js';

class LLMService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
        });

        this.conversationHistory = new Map();
        this.maxHistoryLength = 10; // Keep last 10 messages per user
    }

    /**
     * Get or initialize conversation history for a user
     */
    getConversationHistory(userId) {
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, [
                {
                    role: 'system',
                    content: config.openai.systemPrompt,
                },
            ]);
        }
        return this.conversationHistory.get(userId);
    }

    /**
     * Add a message to the conversation history
     */
    addToHistory(userId, role, content) {
        const history = this.getConversationHistory(userId);

        history.push({ role, content });

        // Keep only the system message and the last N messages
        if (history.length > this.maxHistoryLength + 1) {
            const systemMessage = history[0];
            const recentMessages = history.slice(-(this.maxHistoryLength));
            this.conversationHistory.set(userId, [systemMessage, ...recentMessages]);
        }
    }

    /**
     * Clear conversation history for a user
     */
    clearHistory(userId) {
        this.conversationHistory.delete(userId);
    }

    /**
     * Generate a response from the AI
     */
    async generateResponse(userId, userMessage) {
        try {
            console.log(`🤖 Generating AI response for user ${userId}`);

            // Add user message to history
            this.addToHistory(userId, 'user', userMessage);

            // Get conversation history
            const messages = this.getConversationHistory(userId);

            // Call OpenAI API
            const completion = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 150, // Keep responses concise for voice
                presence_penalty: 0.6,
                frequency_penalty: 0.3,
            });

            const aiResponse = completion.choices[0].message.content.trim();

            // Add AI response to history
            this.addToHistory(userId, 'assistant', aiResponse);

            console.log(`💬 AI Response: "${aiResponse}"`);

            return aiResponse;
        } catch (error) {
            console.error('Error generating AI response:', error);

            // Return a fallback response
            if (error.code === 'insufficient_quota') {
                return "I'm having trouble connecting to my AI service right now. Please check your API quota.";
            }

            return "I'm sorry, I didn't catch that. Could you please repeat?";
        }
    }

    /**
     * Get conversation statistics
     */
    getStats(userId) {
        const history = this.getConversationHistory(userId);
        const userMessages = history.filter(m => m.role === 'user').length;
        const assistantMessages = history.filter(m => m.role === 'assistant').length;

        return {
            totalMessages: history.length - 1, // Exclude system message
            userMessages,
            assistantMessages,
        };
    }
}

export default LLMService;
