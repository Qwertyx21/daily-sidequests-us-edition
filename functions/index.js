const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

initializeApp();
const db = getFirestore();

exports.countCompletedChallenge = onDocumentWritten(
  'couples/{roomId}/quests/{questId}',
  async (event) => {
    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    if (!after || after.isCompleted !== true || before?.isCompleted === true) return;
    if (after.forPartner !== 'aaron' && after.forPartner !== 'vini') {
      logger.error('Ignoring completed challenge with invalid partner id', {
        roomId: event.params.roomId,
        questId: event.params.questId
      });
      return;
    }

    const questRef = event.data.after.ref;
    const countRef = db.doc(`couples/${event.params.roomId}/aggregates/completions`);
    await db.runTransaction(async (transaction) => {
      const currentQuest = await transaction.get(questRef);
      if (!currentQuest.exists || currentQuest.data().countedCompletion === true) return;
      transaction.set(countRef, {
        [after.forPartner]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      transaction.update(questRef, { countedCompletion: true });
    });
  }
);

exports.notifyAssignedPartner = onDocumentCreated(
  'couples/{roomId}/quests/{questId}',
  async (event) => {
    const challenge = event.data?.data();
    if (!challenge || (challenge.forPartner !== 'aaron' && challenge.forPartner !== 'vini')) return;
    const assignedAt = Date.parse(challenge.assignedAt || '');
    if (!Number.isFinite(assignedAt) || Date.now() - assignedAt > 10 * 60 * 1000) return;
    const tokenQuery = await db.collection(`couples/${event.params.roomId}/pushTokens`)
      .where('partner', '==', challenge.forPartner)
      .get();
    const tokens = tokenQuery.docs
      .map((item) => ({ ref: item.ref, token: item.data().token }))
      .filter((item) => typeof item.token === 'string' && item.token.length > 0);

    for (let offset = 0; offset < tokens.length; offset += 500) {
      const batch = tokens.slice(offset, offset + 500);
      const result = await getMessaging().sendEachForMulticast({
        tokens: batch.map((item) => item.token),
        notification: {
          title: 'A new challenge is waiting',
          body: `Your partner set a challenge for you${challenge.title ? `: ${challenge.title}` : '.'}`
        },
        webpush: { fcmOptions: { link: 'https://couplequests-4faa5.web.app/' } }
      });
      const remove = [];
      result.responses.forEach((response, index) => {
        if (!response.success && (
          response.error?.code === 'messaging/registration-token-not-registered'
          || response.error?.code === 'messaging/invalid-registration-token'
        )) remove.push(batch[index].ref);
      });
      if (remove.length) {
        const deletionBatch = db.batch();
        remove.forEach((tokenRef) => deletionBatch.delete(tokenRef));
        await deletionBatch.commit();
      }
    }
  }
);
