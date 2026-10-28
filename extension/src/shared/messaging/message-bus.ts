// =============================================================================
// Message bus — helper gửi/nhận message giữa các thành phần Extension
// =============================================================================

import type { AppMessage, BaseMessage, MessageType } from "./types";

/**
 * Tạo requestId mới — dùng crypto.randomUUID() có sẵn trong browser.
 */
export function newRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Gửi message qua chrome.runtime.sendMessage, tự động thêm requestId.
 * Trả về response từ listener.
 */
export async function sendMessage<T = unknown>(
  type: MessageType,
  payload: unknown,
  requestId?: string
): Promise<T> {
  const message: BaseMessage = {
    type,
    requestId: requestId ?? newRequestId(),
    payload,
  };
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

/**
 * Đăng ký listener cho chrome.runtime.onMessage.
 * Handler nhận (payload, requestId, sender) và trả về response.
 */
export function onMessage<T = unknown>(
  type: MessageType,
  handler: (payload: unknown, requestId: string, sender: chrome.runtime.MessageSender) => Promise<T> | T
): void {
  chrome.runtime.onMessage.addListener((message: BaseMessage, sender, sendResponse) => {
    if (message.type !== type) return false;

    Promise.resolve(handler(message.payload, message.requestId, sender))
      .then((result) => sendResponse(result))
      .catch((err) => {
        console.error(`[message-bus] handler error for ${type}:`, err);
        sendResponse({ error: { code: "INTERNAL_ERROR", message: String(err) } });
      });

    // Return true để giữ kênh mở cho async sendResponse
    return true;
  });
}

/**
 * Đăng ký listener cho message gửi tới tab cụ thể (Content Script).
 */
export function onTabMessage<T = unknown>(
  type: MessageType,
  handler: (payload: unknown, requestId: string) => Promise<T> | T
): void {
  chrome.runtime.onMessage.addListener((message: BaseMessage, _sender, sendResponse) => {
    if (message.type !== type) return false;

    Promise.resolve(handler(message.payload, message.requestId))
      .then((result) => sendResponse(result))
      .catch((err) => {
        console.error(`[message-bus] tab handler error for ${type}:`, err);
        sendResponse({ error: { code: "INTERNAL_ERROR", message: String(err) } });
      });

    return true;
  });
}

/**
 * Gửi message tới 1 tab cụ thể (Content Script).
 */
export async function sendTabMessage<T = unknown>(
  tabId: number,
  type: MessageType,
  payload: unknown,
  requestId?: string
): Promise<T> {
  const message: BaseMessage = {
    type,
    requestId: requestId ?? newRequestId(),
    payload,
  };
  return chrome.tabs.sendMessage(tabId, message) as Promise<T>;
}

export type { AppMessage };