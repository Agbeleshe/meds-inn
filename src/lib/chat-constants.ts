/** Edit window: messages can be edited within this many ms after sending. */
export const CHAT_EDIT_WINDOW_MS = 5 * 60 * 1000;

export const CHAT_TERMS_STORAGE_KEY = "medsinn_chat_terms_v1";

export const CHAT_TERMS_CONTENT = {
  title: "Secure messaging terms",
  bullets: [
    "Messages may be reviewed by your care team and hospital administrators for clinical and safety purposes.",
    "Do not share passwords, full payment details, or information unrelated to your pregnancy care.",
    "You may edit your own messages within 5 minutes of sending; edited messages show an “edited” label.",
    "Deleted messages appear as “This message was deleted” to others. Administrators can view deleted and edited content for security and compliance.",
    "Urgent medical emergencies require calling your hospital or emergency services — chat is not for life-threatening situations.",
  ],
  agreeLabel: "I understand and agree to these messaging terms",
};

/** Widely used emojis for patient chat */
export const CHAT_EMOJIS = [
  "😊", "😂", "🥰", "😍", "🙂", "😅", "😢", "😭", "😘", "👍",
  "👏", "🙏", "💪", "❤️", "💕", "✨", "🎉", "🤰", "👶", "🍼",
  "🏥", "💊", "🩺", "📅", "✅", "❓", "‼️", "💤", "🌸", "☀️",
];
