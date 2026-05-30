const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

function cleanId(value) {
  return String(value ?? "").trim();
}

function unique(values) {
  return Array.from(new Set(values.map(cleanId).filter(Boolean)));
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

function isGlobalNotification(data) {
  const targets = [data.toMemberId, data.scope, data.audience, data.targetAudience].map(cleanId);
  return targets.some((item) => ["all", "global", "members", "system", "*"].includes(item));
}

function getTargetMemberIds(data) {
  const listFields = [data.memberIds, data.toMemberIds, data.recipients, data.targetMemberIds]
    .filter(Array.isArray)
    .flat();
  return unique([
    data.toMemberId,
    data.memberId,
    data.targetMemberId,
    data.receiverMemberId,
    data.recipientMemberId,
    ...listFields,
  ]).filter((item) => !["all", "global", "members", "system", "*"].includes(item));
}

async function getTokensForNotification(data) {
  if (isGlobalNotification(data)) {
    const snap = await db.collection("pushTokens").where("active", "==", true).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  }

  const memberIds = getTargetMemberIds(data);
  if (!memberIds.length) return [];

  const rows = [];
  for (const ids of chunk(memberIds, 10)) {
    const snap = await db
      .collection("pushTokens")
      .where("active", "==", true)
      .where("memberId", "in", ids)
      .get();
    snap.docs.forEach((doc) => rows.push({ id: doc.id, ...(doc.data() || {}) }));
  }

  const byToken = new Map();
  rows.forEach((row) => {
    if (row.token) byToken.set(row.token, row);
  });
  return Array.from(byToken.values());
}

async function deactivateInvalidTokens(tokens, responses) {
  const invalidCodes = new Set([
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
    "messaging/invalid-argument",
  ]);

  const writes = [];
  responses.forEach((response, index) => {
    if (response.success) return;
    const code = response.error?.code || "";
    if (!invalidCodes.has(code)) return;
    const row = tokens[index];
    if (!row?.id) return;
    writes.push(
      db.collection("pushTokens").doc(row.id).set(
        {
          active: false,
          disabledAt: admin.firestore.FieldValue.serverTimestamp(),
          disabledReason: code,
        },
        { merge: true }
      )
    );
  });

  await Promise.allSettled(writes);
}

exports.sendPushOnNotificationCreated = onDocumentCreated(
  {
    document: "notifications/{notificationId}",
    region: "europe-west1",
  },
  async (event) => {
    const data = event.data?.data() || {};
    const notificationId = event.params.notificationId;

    if (data.pushDisabled === true || data.silent === true) return;

    const tokens = await getTokensForNotification(data);
    const tokenValues = unique(tokens.map((item) => item.token));
    if (!tokenValues.length) {
      logger.info("No push tokens for notification", { notificationId });
      return;
    }

    const title = String(data.title || "FIFA GROUP").slice(0, 120);
    const body = String(data.body || "لديك إشعار جديد.").slice(0, 240);
    const icon = String(data.icon || data.appIcon || "/icons/icon-192.png");

    for (const tokenChunk of chunk(tokenValues, 500)) {
      const response = await messaging.sendEachForMulticast({
        tokens: tokenChunk,
        notification: { title, body, imageUrl: data.imageUrl || undefined },
        webpush: {
          notification: {
            title,
            body,
            icon,
            badge: "/icons/icon-192.png",
            tag: notificationId,
            dir: "rtl",
          },
          fcmOptions: {
            link: data.clickUrl || "/",
          },
        },
        data: {
          notificationId,
          type: String(data.type || ""),
          title,
          body,
          clickUrl: String(data.clickUrl || "/"),
        },
      });

      const chunkTokenRows = tokenChunk.map((token) => tokens.find((row) => row.token === token)).filter(Boolean);
      await deactivateInvalidTokens(chunkTokenRows, response.responses);

      logger.info("Push notification sent", {
        notificationId,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
    }
  }
);
