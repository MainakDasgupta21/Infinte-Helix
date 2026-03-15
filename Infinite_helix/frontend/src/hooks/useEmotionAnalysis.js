// useEmotionAnalysis — Custom hook for real-time emotion detection
//
// Usage:
//   const { emotion, sentiment, aiResponse, analyze } = useEmotionAnalysis();
//   analyze(text); // triggers both emotion + sentiment analysis
//
// Returns:
//   - emotion: { label, confidence } from distilroberta model
//   - sentiment: { label, confidence } from roberta-sentiment model
//   - aiResponse: generated supportive message
//   - loading: boolean
//   - analyze(text): trigger analysis

// TODO: Implement debounced analysis calls
// TODO: Combine emotion + sentiment into single hook
