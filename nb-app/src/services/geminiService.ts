import type { Content, Part as SDKPart } from "@google/genai";
import { AppSettings, Part } from '../types';

// Helper to construct user content
const constructUserContent = (prompt: string, images: { base64Data: string; mimeType: string }[]): Content => {
  const userParts: SDKPart[] = [];
  
  images.forEach((img) => {
    userParts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64Data,
      },
    });
  });

  if (prompt.trim()) {
    userParts.push({ text: prompt });
  }

  return {
    role: "user",
    parts: userParts,
  };
};

// Helper to format Gemini API errors
const formatGeminiError = (error: any): Error => {
  let message = "发生了未知错误，请稍后重试。";
  const errorMsg = error?.message || error?.toString() || "";

  if (errorMsg.includes("401") || errorMsg.includes("API key not valid")) {
    message = "API Key 无效或过期，请检查您的设置。";
  } else if (errorMsg.includes("403")) {
    message = "访问被拒绝。请检查您的网络连接（可能需要切换节点）或 API Key 权限。";
  } else if (errorMsg.includes("Thinking_config.include_thoughts") || errorMsg.includes("thinking is enabled")) {
    message = "当前模型不支持思考过程。请在设置中关闭“显示思考过程”，或切换到支持思考的模型。";
  } else if (errorMsg.includes("400")) {
    message = "请求参数无效 (400 Bad Request)。请检查您的设置或提示词。";
  } else if (errorMsg.includes("429")) {
    message = "请求过于频繁，请稍后再试（429 Too Many Requests）。";
  } else if (errorMsg.includes("503")) {
    message = "Gemini 服务暂时不可用，请稍后重试（503 Service Unavailable）。";
  } else if (errorMsg.includes("TypeError") || errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
    message = "网络请求失败。可能是网络连接问题，或者请求内容过多（如图片太大、历史记录过长）。";
  } else if (errorMsg.includes("SAFETY")) {
    message = "生成的内容因安全策略被拦截。请尝试修改您的提示词。";
  } else if (errorMsg.includes("404")) {
    message = "请求的模型不存在或路径错误 (404 Not Found)。";
  } else if (errorMsg.includes("500")) {
    message = "Gemini 服务器内部错误，请稍后重试 (500 Internal Server Error)。";
  } else {
      // 保留原始错误信息以便调试，但在前面加上中文提示
      message = `请求出错: ${errorMsg}`;
  }

  const newError = new Error(message);
  (newError as any).originalError = error;
  return newError;
};

// Helper to process SDK parts into app Parts
const processSdkParts = (sdkParts: SDKPart[]): Part[] => {
  const appParts: Part[] = [];

  for (const part of sdkParts) {
    const signature = (part as any).thoughtSignature;
    const isThought = !!(part as any).thought;

    // Handle Text (Thought or Regular)
    if (part.text !== undefined) {
      const lastPart = appParts[appParts.length - 1];

      // Check if we should append to the last part or start a new one.
      // Append if: Last part exists AND is text AND matches thought type.
      if (
        lastPart && 
        lastPart.text !== undefined && 
        !!lastPart.thought === isThought
      ) {
        lastPart.text += part.text;
        if (signature) {
            lastPart.thoughtSignature = signature;
        }
      } else {
        // New text block
        const newPart: Part = { 
          text: part.text, 
          thought: isThought 
        };
        if (signature) {
            newPart.thoughtSignature = signature;
        }
        appParts.push(newPart);
      }
    } 
    // Handle Images
    else if (part.inlineData) {
      const newPart: Part = { 
        inlineData: {
            mimeType: part.inlineData.mimeType || 'image/png',
            data: part.inlineData.data || ''
        }, 
        thought: isThought 
      };
      if (signature) {
          newPart.thoughtSignature = signature;
      }
      appParts.push(newPart);
    }
  }
  return appParts;
};

export const streamGeminiResponse = async function* (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings,
  signal?: AbortSignal
) {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI(
    { apiKey, httpOptions: { baseUrl: settings.customEndpoint || 'https://api.kuai.host' } }
  );

  // Filter out thought parts from history to avoid sending thought chains back to the model
  const cleanHistory = history.map(item => {
    if (item.role === 'model') {
      return {
        ...item,
        parts: item.parts.filter(p => !p.thought)
      };
    }
    return item;
  }).filter(item => item.parts.length > 0);

  const currentUserContent = constructUserContent(prompt, images);
  const contentsPayload = [...cleanHistory, currentUserContent];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: settings.modelName || "gemini-3-pro-image-preview",
      contents: contentsPayload,
      config: {
        imageConfig: {
          imageSize: settings.resolution,
          ...(settings.aspectRatio !== 'Auto' ? { aspectRatio: settings.aspectRatio } : {}),
        },
        tools: settings.useGrounding ? [{ googleSearch: {} }] : [],
        responseModalities: ["TEXT", "IMAGE"],
        ...(settings.enableThinking ? {
            thinkingConfig: {
                includeThoughts: true,
            }
        } : {}),
      },
    });

    let currentParts: Part[] = [];

    for await (const chunk of responseStream) {
      if (signal?.aborted) {
        break;
      }
      const candidates = chunk.candidates;
      if (!candidates || candidates.length === 0) continue;
      
      const newParts = candidates[0].content?.parts || [];

      // Use the helper logic but incrementally
      // We can't reuse processSdkParts directly because we need to accumulate state (currentParts)
      // So we keep the loop logic here
      for (const part of newParts) {
        const signature = (part as any).thoughtSignature;
        const isThought = !!(part as any).thought;

        // Handle Text (Thought or Regular)
        if (part.text !== undefined) {
          const lastPart = currentParts[currentParts.length - 1];

          if (
            lastPart && 
            lastPart.text !== undefined && 
            !!lastPart.thought === isThought
          ) {
            lastPart.text += part.text;
            if (signature) {
                lastPart.thoughtSignature = signature;
            }
          } else {
            const newPart: Part = { 
              text: part.text, 
              thought: isThought 
            };
            if (signature) {
                newPart.thoughtSignature = signature;
            }
            currentParts.push(newPart);
          }
        } 
        else if (part.inlineData) {
          const newPart: Part = { 
            inlineData: {
                mimeType: part.inlineData.mimeType || 'image/png',
                data: part.inlineData.data || ''
            }, 
            thought: isThought 
          };
          if (signature) {
              newPart.thoughtSignature = signature;
          }
          currentParts.push(newPart);
        }
      }

      yield {
        userContent: currentUserContent,
        modelParts: currentParts // Yield the accumulated parts
      };
    }
  } catch (error) {
    console.error("Gemini API Stream Error:", error);
    throw formatGeminiError(error);
  }
};

export const generateContent = async (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings,
  signal?: AbortSignal
) => {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI(
    { apiKey, httpOptions: { baseUrl: settings.customEndpoint || 'https://api.kuai.host' } }
  );

  // Filter out thought parts from history
  const cleanHistory = history.map(item => {
    if (item.role === 'model') {
      return {
        ...item,
        parts: item.parts.filter(p => !p.thought)
      };
    }
    return item;
  }).filter(item => item.parts.length > 0);

  const currentUserContent = constructUserContent(prompt, images);
  const contentsPayload = [...cleanHistory, currentUserContent];

  try {
    // If signal is aborted before we start, throw immediately
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const response = await ai.models.generateContent({
      model: settings.modelName || "gemini-3-pro-image-preview",
      contents: contentsPayload,
      config: {
        imageConfig: {
          imageSize: settings.resolution,
          ...(settings.aspectRatio !== 'Auto' ? { aspectRatio: settings.aspectRatio } : {}),
        },
        tools: settings.useGrounding ? [{ googleSearch: {} }] : [],
        responseModalities: ["TEXT", "IMAGE"],
        ...(settings.enableThinking ? {
            thinkingConfig: {
                includeThoughts: true,
            }
        } : {}),
      },
    });

    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error("No content generated.");
    }

    const modelParts = processSdkParts(candidate.content.parts);

    return {
      userContent: currentUserContent,
      modelParts: modelParts
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw formatGeminiError(error);
  }
};
