import { startSelectionDetection, onSelectionChange } from "./selection-detector";
import { show, hide, onAction, type FloatingActionType } from "./floating-action";
import { sendMessage } from "../shared/messaging/message-bus";

console.log("[Content Script] Loaded on:", window.location.href);

onSelectionChange((info) => {
  if (info && info.rect) {
    show(info);
  } else {
    hide();
  }
});

onAction((action: FloatingActionType, info) => {
  console.log("[Content Script] Action:", action, "| text:", info.text);

  const basePayload = {
    text: info.text,
    context: "", // Phase 4 sẽ điền context vào đây
    language: "vi" as const,
  };

  if (action === "explain") {
    void sendMessage("REQUEST_EXPLAIN", basePayload);
  } else if (action === "grammar") {
    void sendMessage("REQUEST_GRAMMAR", basePayload);
  } else if (action === "rewrite") {
    void sendMessage("REQUEST_REWRITE", { ...basePayload, mode: "formal" });
  }
});

startSelectionDetection();

export {};