# Go‑Deep — Combined (previous + new features)

Short summary (हिन्दी):
- Sign up requires name, email ending with @clash.gyan, password और DOB (age >= 18 required to add contributions).
- Search performs exact Wikipedia lookup first, fallback to search. "Information by Gyan Technology" banner displayed.
- Contributions: signed‑in 18+ users can add info; author can delete; reports (>=3) auto-delete.
- AI Chat: separate page; uses client-side worker summarizer + retrieval to generate answers.
- Profile icon: if no uploaded photo, shows first letter SVG avatar.
- All data stored in localStorage (seeded from data/*.xml). No backend.

How to run:
1. Place all files in a folder (structure above).
2. Open VS Code, install Live Server.
3. Right-click index.html → Open with Live Server.
4. Create account (email ending @clash.gyan), sign in, use search, add contributions (if >=18), open AI Chat.

Limitations:
- Client-side only. For production, real LLM / server / DB required.
- Password hashing done with PBKDF2 in browser—educational; production needs server auth.

यदि आप चाहें:
- मैं contributions को moderation panel से manage करने की सुविधा जोड़ दूँ।
- या AI को वास्तविक LLM से जोड़ने का server-side integraion दिखा दूँ।
- या UI polish और icons/animations बढ़ा दूँ।

बता दीजिए कौन-सा अगला improvement चाहेंगे — मैं उसी के हिसाब से अपडेट कर दूँगा।