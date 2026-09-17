import type { Metadata } from "next";
import PostListingForm from "@/components/PostListingForm";

export const metadata: Metadata = {
  title: "E'lon joylash — Topamiz",
};

export default function PostListingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Yangi <span className="gradient-text">e'lon</span> joylash
        </h1>
        <p className="mt-2 text-sm text-muted">
          Bir necha daqiqada e'lon joylang — AI yordamchi mos e'lonlarni
          avtomatik topishga yordam beradi.
        </p>
      </div>
      <PostListingForm />
    </div>
  );
}
