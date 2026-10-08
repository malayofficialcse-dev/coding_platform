export function optimizedImageUrl(url, width = 1200) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) return url;
  if (url.includes("/f_auto,") || url.includes("/q_auto,")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}
