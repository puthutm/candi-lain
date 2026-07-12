import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsForumPosts, lmsForumReplies } from "@/db/schema/discussion";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ success: false, error: "Missing classId" }, { status: 400 });
    }

    const posts = await db
      .select()
      .from(lmsForumPosts)
      .where(eq(lmsForumPosts.classId, classId))
      .orderBy(desc(lmsForumPosts.createdAt));

    // For each post, fetch replies
    const postsWithReplies = await Promise.all(
      posts.map(async (post) => {
        const replies = await db
          .select()
          .from(lmsForumReplies)
          .where(eq(lmsForumReplies.postId, post.id));
        return {
          ...post,
          replies,
        };
      })
    );

    return NextResponse.json({ success: true, posts: postsWithReplies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, classId, postId, authorName, authorRole, authorUserId, title, body: textBody, type } = body;

    if (action === "create_post") {
      if (!classId || !authorName || !textBody) {
        return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
      }
      const [newPost] = await db
        .insert(lmsForumPosts)
        .values({
          classId,
          authorName,
          authorRole: authorRole || "dosen",
          authorUserId,
          title: title || "Diskusi Kuliah",
          body: textBody,
          type: type || "question",
        })
        .returning();

      return NextResponse.json({ success: true, post: newPost });
    }

    if (action === "reply") {
      if (!postId || !authorName || !textBody) {
        return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
      }
      const [newReply] = await db
        .insert(lmsForumReplies)
        .values({
          postId,
          authorName,
          authorRole: authorRole || "mahasiswa",
          authorUserId,
          body: textBody,
        })
        .returning();

      return NextResponse.json({ success: true, reply: newReply });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
