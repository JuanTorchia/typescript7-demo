import type {
  CamelCasedPropertiesDeep,
  Exact,
  MergeDeep,
  PackageJson,
  Paths,
  ReadonlyDeep,
  SetRequired,
  Simplify,
} from "type-fest";

type BlogPostFromApi = {
  post_id: string;
  author_profile: {
    display_name: string;
    social_links?: {
      github_url?: string;
      website_url?: string;
    };
  };
  metadata: {
    source?: "manual" | "automated";
    tags: string[];
  };
};

type BlogPostViewModel = CamelCasedPropertiesDeep<BlogPostFromApi>;

type PublishDefaults = {
  draft: true;
  metadata: {
    source: "manual";
    tags: [];
  };
};

type PublishPayload = Simplify<
  SetRequired<
    MergeDeep<BlogPostViewModel, PublishDefaults>,
    "postId" | "authorProfile"
  >
>;

type PublicPayload = ReadonlyDeep<PublishPayload>;
type PublicPaths = Paths<PublicPayload>;

type ExpectedPayload = {
  postId: string;
  authorProfile: {
    displayName: string;
    socialLinks?: {
      githubUrl?: string;
      websiteUrl?: string;
    };
  };
  metadata: {
    source: "manual" | "automated";
    tags: string[];
  };
  draft: true;
};

declare const payload: Exact<ExpectedPayload, PublishPayload>;
declare const path: PublicPaths;
declare const packageJson: PackageJson;

export const openSourceTypeFestSmoke = {
  payload,
  path,
  packageName: packageJson.name,
};
