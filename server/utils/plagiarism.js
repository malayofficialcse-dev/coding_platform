import stringSimilarity from "string-similarity";

export function checkPlagiarism(code1, code2) {
  return Math.round(stringSimilarity.compareTwoStrings(code1, code2) * 100);
}
