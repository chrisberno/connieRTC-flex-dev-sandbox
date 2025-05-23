import type * as Flex from '@twilio/flex-ui';

import ProgrammableVoiceService from '../../../../utils/serverless/ProgrammableVoice/ProgrammableVoiceService';
import { isInternalCall } from '../../helpers/internalCall';
import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';

export const actionEvent = FlexActionEvent.before;
export const actionName = FlexAction.HoldCall;
export const actionHook = function handleInternalHoldCall(flex: typeof Flex, _manager: Flex.Manager) {
  flex.Actions.addListener(`${actionEvent}${actionName}`, async (payload, abortFunction) => {
    if (!isInternalCall(payload.task)) {
      return;
    }

    const { task } = payload;
    const conference = task.conference ? task.conference.conferenceSid : task.attributes.conferenceSid;

    const participant = task.attributes.conference.participants
      ? task.attributes.conference.participants.worker
      : task.attributes.worker_call_sid;

    await ProgrammableVoiceService.holdParticipant(conference, participant);
    abortFunction();
