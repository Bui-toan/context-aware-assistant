export const theme = {
  primary: "#2563eb", // Màu xanh dương giống ảnh
  primaryHover: "#1d4ed8",
  background: "#f8fafc", // Nền xám rất nhạt
  surface: "#ffffff", // Nền của các thẻ Card
  textMain: "#1e293b",
  textMuted: "#64748b",
  border: "#e2e8f0",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  radiusSm: "6px",
  radiusMd: "12px",
  radiusFull: "9999px",
};

export const commonStyles = {
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusMd,
    padding: "16px",
    marginBottom: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: `1px solid ${theme.border}`,
  },
  buttonPrimary: {
    backgroundColor: theme.primary,
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: theme.radiusFull,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    transition: "background 0.2s",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    color: theme.textMain,
    border: `1px solid ${theme.border}`,
    padding: "8px 16px",
    borderRadius: theme.radiusFull,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "14px",
    transition: "background 0.2s",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: theme.radiusMd,
    border: `1px solid ${theme.border}`,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  }
};