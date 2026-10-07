import stringSimilarity from "string-similarity";

export const checkPlagiarism = (code1, code2) => {
  if (!code1 || !code2) return 0;
  // Normalize whitespace to prevent trivial evasion
  const normalize = (str) => str.replace(/\s+/g, " ").trim();
  const similarity = stringSimilarity.compareTwoStrings(normalize(code1), normalize(code2));
  return Math.round(similarity * 100);
};

export default checkPlagiarism;
