import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import type { AppConfig } from "./config.js";
import { transaction, type Database } from "./db.js";

type PendingNotification = { id: string; email: string; type: string; starts_at: Date; delivery_attempts: number };

export async function processNotifications(db: Database, config: AppConfig) {
  const upcoming = await db.query<{ overlap_id: string; user_id: string }>(
    `SELECT o.id overlap_id, participant.user_id
       FROM overlap_events o JOIN connections c ON c.user_low=o.user_low AND c.user_high=o.user_high
       CROSS JOIN LATERAL (VALUES(o.user_low),(o.user_high)) participant(user_id)
       JOIN user_settings s ON s.user_id=participant.user_id
      WHERE o.starts_at > now() AND o.starts_at <= now()+interval '7 days'
        AND o.intent_status <> 'not_interested' AND o.suppressed=false`,
  );
  for (const item of upcoming.rows) {
    await db.query(
      "INSERT INTO notifications(id,user_id,overlap_id,type,deduplication_key) VALUES($1,$2,$3,'overlap_upcoming',$4) ON CONFLICT(deduplication_key) DO NOTHING",
      [randomUUID(), item.user_id, item.overlap_id, `upcoming:${item.overlap_id}:${item.user_id}`],
    );
  }
  if (!config.SMTP_URL) return;
  const transport = nodemailer.createTransport(config.SMTP_URL);
  const pending = await db.query<PendingNotification>(
    `SELECT n.id,u.email,n.type,o.starts_at,n.delivery_attempts
       FROM notifications n JOIN users u ON u.id=n.user_id JOIN overlap_events o ON o.id=n.overlap_id
       JOIN connections c ON c.user_low=o.user_low AND c.user_high=o.user_high
       JOIN user_settings s ON s.user_id=n.user_id
      WHERE n.delivered_at IS NULL AND n.delivery_attempts < 5 AND s.email_notifications=true
        AND o.suppressed=false AND o.ends_at>now()
        AND (n.type='poke_response' OR o.intent_status<>'not_interested')
      ORDER BY n.created_at LIMIT 50`,
  );
  for (const item of pending.rows) {
    await transaction(db, async client => {
      const eligible = await client.query(`SELECT n.id FROM notifications n
        JOIN overlap_events o ON o.id=n.overlap_id
        JOIN connections c ON c.user_low=o.user_low AND c.user_high=o.user_high
        JOIN user_settings s ON s.user_id=n.user_id
        WHERE n.id=$1 AND n.delivered_at IS NULL AND n.delivery_attempts<5
          AND s.email_notifications=true AND o.suppressed=false AND o.ends_at>now()
          AND (n.type='poke_response' OR o.intent_status<>'not_interested')
        FOR UPDATE OF n SKIP LOCKED`,[item.id]);
      if (!eligible.rowCount) return;
      try {
        await transport.sendMail({ from: config.EMAIL_FROM, to: item.email, messageId: `<portmate-${item.id}@notifications.portmate.local>`, subject: "PortMate notification", text: notificationText(item) });
        await client.query("UPDATE notifications SET delivered_at=now(),delivery_attempts=delivery_attempts+1 WHERE id=$1", [item.id]);
      } catch {
        await client.query("UPDATE notifications SET delivery_attempts=delivery_attempts+1 WHERE id=$1", [item.id]);
      }
    });
  }
}

function notificationText(item: PendingNotification) {
  if (item.type === "overlap_upcoming") return `You have an upcoming PortMate overlap around ${new Date(item.starts_at).toISOString()}.`;
  if (item.type === "poke_received") return "A PortMate connection would like to meet during an upcoming overlap.";
  return "A PortMate connection responded to your meeting request.";
}
