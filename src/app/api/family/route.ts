import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import crypto from "crypto";

// GET /api/family — get or create family workspace, members, and shared resources
export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;

  try {
    // Find workspace owned or where user is a member
    let workspace = await db.familyWorkspace.findFirst({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        resources: true,
      },
    });

    // If none exists, create default workspace for user as Owner
    if (!workspace) {
      workspace = await db.familyWorkspace.create({
        data: {
          name: "My Family Vault & Circle",
          ownerId: userId,
          members: {
            create: {
              userId,
              email: session.email,
              role: "owner",
              status: "active",
            },
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          resources: true,
        },
      });
    }

    // Determine current user's role in this workspace
    const currentMember = workspace.members.find((m) => m.userId === userId || m.email === session.email);
    const userRole = currentMember ? currentMember.role : (workspace.ownerId === userId ? "owner" : "viewer");

    return NextResponse.json({
      workspace,
      userRole,
      isOwner: workspace.ownerId === userId,
    });
  } catch (err: any) {
    console.error("GET /api/family error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/family/invite — invite member by email
export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, role = "viewer", workspaceId } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Check that user is owner or admin of this workspace
    const workspace = await db.familyWorkspace.findFirst({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const currentMember = workspace.members.find((m) => m.userId === session.userId);
    const isOwnerOrAdmin = workspace.ownerId === session.userId || currentMember?.role === "admin";
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: "Only owners and admins can invite members" }, { status: 403 });
    }

    // Check if member already invited
    const existing = workspace.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "A member with this email has already been invited." }, { status: 400 });
    }

    // Generate revocable invitation token
    const inviteToken = "inv_" + crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const newMember = await db.familyMember.create({
      data: {
        workspaceId,
        email: email.toLowerCase(),
        role,
        status: "pending",
        inviteToken,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      member: newMember,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/family/join?token=${inviteToken}`,
    });
  } catch (err: any) {
    console.error("POST /api/family error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/family — revoke member or remove resource
export async function DELETE(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const resourceId = searchParams.get("resourceId");

  try {
    if (memberId) {
      const member = await db.familyMember.findUnique({
        where: { id: memberId },
        include: { workspace: true },
      });

      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      // Check permission: Owner or admin, or member removing themselves
      const isOwner = member.workspace.ownerId === session.userId;
      const isSelf = member.userId === session.userId;
      if (!isOwner && !isSelf) {
        return NextResponse.json({ error: "Permission denied to revoke member" }, { status: 403 });
      }

      // Cannot remove the owner
      if (member.role === "owner" && !isSelf) {
        return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 400 });
      }

      await db.familyMember.delete({ where: { id: memberId } });
      return NextResponse.json({ success: true, message: "Member access revoked" });
    }

    if (resourceId) {
      await db.familySharedResource.deleteMany({
        where: { id: resourceId },
      });
      return NextResponse.json({ success: true, message: "Resource unshared" });
    }

    return NextResponse.json({ error: "memberId or resourceId required" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
