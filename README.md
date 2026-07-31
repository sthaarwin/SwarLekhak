# SwarLekhak (स्वरलेखक)

SwarLekhak is an AI-powered React Native mobile application built to assist Nepalese citizens in drafting standard administrative and governmental documents using solely their voice. 

By leveraging speech-to-text and advanced LLM reasoning (via Gemma / OpenRouter / Ollama local), the app listens to spoken Nepali (or typed Nepali / romanized text) and automatically generates formatted, official documents ready for printing or PDF export.

## Key Features

- **Voice to Document**: Speak naturally in Nepali, and SwarLekhak will parse your message.
- **AI Extraction & Summarization**: The app extracts specific legal entities (such as names, addresses, ward numbers, and incident details) based on the chosen document template.
- **Standard Nepali Templates**:
  - **निवेदन (Application)**: Standard forms for government requests.
  - **उजुरी (Complaint)**: Reporting incidents or disputes.
  - **सिफारिस (Recommendation)**: Ward and local body recommendation letters.
  - **सम्झौता (Agreement)**: Two-party legal agreements.
  - **राजीनामा (Resignation)**: Formal resignation letters.
- **Interactive Previews & History**: Visually preview document templates before generating them and revisit past documents in a sleek, beautifully-designed history center.
- **Interactive Questioning**: If key fields (like a ward number or applicant name) are missing from your speech, the AI intelligently asks clarifying follow-up questions in Nepali.
- **PDF Export**: Generate ready-to-sign PDF copies of the resulting administrative documents.

## Tech Stack

- **Framework**: React Native, Expo (Audio, Speech)
- **Styling**: React Native Paper (Material Design 3 custom themes)
- **Backend & Auth**: Supabase
- **AI Integration**: OpenRouter API / Ollama Native Integration for local inference.

## Getting Started

1. Clone this repository.
2. Navigate to the \`app/\` directory and install dependencies:
   \`\`\`bash
   cd app
   npm install
   # or bun intall
   \`\`\`
3. Create your \`.env\` file in the \`app\` folder with your Supabase and OpenRouter keys (refer to \`.env.example\`).
4. Start the Expo development server:
   \`\`\`bash
   npx expo start
   \`\`\`

## Design Philosophy

The app is designed with accessibility and ease of use in mind, utilizing modern UI principles, glass/soft-colored *Surface* layers, and clear, bold typography suited for readable Nepali formatting.
