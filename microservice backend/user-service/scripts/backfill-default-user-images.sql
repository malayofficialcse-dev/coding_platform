-- Fill only blank image fields so existing user-uploaded images remain intact.
UPDATE users
SET "profileImage" = '/default-avatar.svg'
WHERE NULLIF(TRIM("profileImage"), '') IS NULL;

UPDATE users
SET "bannerImage" = '/default-banner.svg'
WHERE NULLIF(TRIM("bannerImage"), '') IS NULL;
