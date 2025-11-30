import { ChatMessage, Content, Part } from '../types';

export const convertMessagesToHistory = (messages: ChatMessage[]): Content[] => {
  return messages
    .filter(msg => !msg.isError) // Filter out error messages
    .map(msg => ({
      role: msg.role,
      parts: msg.parts.map(p => {
        // Create a clean part object compatible with the SDK
        const part: Part = {};
        if (p.text) part.text = p.text;
        if (p.inlineData) part.inlineData = p.inlineData;
        // We preserve 'thought' property here so the service can decide whether to filter it
        if (p.thought) part.thought = p.thought;
        if (p.thoughtSignature) part.thoughtSignature = p.thoughtSignature;
        return part;
      })
    }));
};
