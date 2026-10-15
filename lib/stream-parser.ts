/**
 * Robust stream parser separating thinking/reasoning tokens from main response content.
 * Handles both:
 * 1. Dedicated SSE delta.reasoning_content (OpenAI/9Router standard)
 * 2. In-band <think>...</think> tags in delta.content (DeepSeek/Ollama plaintext)
 * Even when tags are split across chunk boundaries.
 */

export interface DeltaPayload {
  content?: string | null;
  reasoning_content?: string | null;
  reasoning?: string | null;
  thinking?: string | null;
}

export interface StreamUpdate {
  newContent: string;
  newReasoning: string;
  isThinking: boolean;
}

export class StreamParser {
  private inThinkTag = false;
  private thinkTagBuffer = "";
  public accumulatedContent = "";
  public accumulatedReasoning = "";
  public isThinking = false;

  public processDelta(delta?: DeltaPayload | null): StreamUpdate {
    let newContent = "";
    let newReasoning = "";

    // 1. Dedicated reasoning properties (reasoning_content, reasoning, thinking)
    const reasoningDelta =
      delta?.reasoning_content || delta?.reasoning || delta?.thinking || "";
    if (reasoningDelta) {
      newReasoning += reasoningDelta;
      this.isThinking = true;
    }

    // 2. Content delta (which might contain <think>...</think>)
    const contentDelta = delta?.content || "";
    if (contentDelta) {
      let text = this.thinkTagBuffer + contentDelta;
      this.thinkTagBuffer = "";

      while (text.length > 0) {
        if (!this.inThinkTag) {
          const thinkStart = text.indexOf("<think>");
          if (thinkStart === -1) {
            const partialMatch = text.match(/<t?(?:h(?:i(?:n(?:k)?)?)?)?$/i);
            if (partialMatch && partialMatch.index !== undefined) {
              const safeText = text.slice(0, partialMatch.index);
              this.thinkTagBuffer = text.slice(partialMatch.index);
              newContent += safeText;
            } else {
              newContent += text;
            }
            this.isThinking = false;
            text = "";
          } else {
            newContent += text.slice(0, thinkStart);
            text = text.slice(thinkStart + 7);
            this.inThinkTag = true;
            this.isThinking = true;
          }
        } else {
          const thinkEnd = text.indexOf("</think>");
          if (thinkEnd === -1) {
            const partialMatch = text.match(/<\/t?(?:h(?:i(?:n(?:k(?:>)?)?)?)?)?$/i);
            if (partialMatch && partialMatch.index !== undefined) {
              const safeReasoning = text.slice(0, partialMatch.index);
              this.thinkTagBuffer = text.slice(partialMatch.index);
              newReasoning += safeReasoning;
            } else {
              newReasoning += text;
            }
            this.isThinking = true;
            text = "";
          } else {
            newReasoning += text.slice(0, thinkEnd);
            text = text.slice(thinkEnd + 8);
            this.inThinkTag = false;
            this.isThinking = false;
          }
        }
      }
    }

    this.accumulatedContent += newContent;
    this.accumulatedReasoning += newReasoning;

    return {
      newContent,
      newReasoning,
      isThinking: this.isThinking,
    };
  }

  public finish(): { content: string; reasoning: string; isThinking: boolean } {
    if (this.thinkTagBuffer) {
      if (this.inThinkTag) {
        this.accumulatedReasoning += this.thinkTagBuffer;
      } else {
        this.accumulatedContent += this.thinkTagBuffer;
      }
      this.thinkTagBuffer = "";
    }
    this.isThinking = false;
    return {
      content: this.accumulatedContent,
      reasoning: this.accumulatedReasoning,
      isThinking: false,
    };
  }
}
