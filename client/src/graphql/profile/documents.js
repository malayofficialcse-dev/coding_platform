import coreFragments from "./fragments/profile-core.gql?raw";
import learningFragments from "./fragments/learning-fields.gql?raw";
import enrollmentAttemptFragments from "./fragments/enrollment-attempt-fields.gql?raw";
import codingSubmissionFragment from "./fragments/coding-submission.gql?raw";
import myProfileOperation from "./queries/my-profile-page.gql?raw";
import userProfileOperation from "./queries/user-profile-page.gql?raw";

export const MY_PROFILE_PAGE_QUERY = [
  coreFragments,
  learningFragments,
  enrollmentAttemptFragments,
  codingSubmissionFragment,
  myProfileOperation,
].join("\n");

export const USER_PROFILE_PAGE_QUERY = [
  coreFragments,
  learningFragments,
  userProfileOperation,
].join("\n");
