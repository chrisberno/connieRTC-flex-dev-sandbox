import * as Flex from '@twilio/flex-ui';
import type { ITask } from '@twilio/flex-ui';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@twilio-paste/core/button';
import { CheckboxCheckIcon } from '@twilio-paste/icons/esm/CheckboxCheckIcon';
import { PlusIcon } from '@twilio-paste/icons/esm/PlusIcon';

import type { TaskQualificationConfig } from '../../types/ServiceConfiguration';
import { getMatchingTaskConfiguration } from '../../config';
import type AppState from '../../../../types/manager/AppState';
import { reduxNamespace } from '../../../../utils/state';
// Import from the correct location - either flex-hooks or flex-hooks.bak
import type { ExtendedWrapupState } from '../../flex-hooks/states/extendedWrapupSlice';
// Update the import path to the correct location of strings
import { StringTemplates } from '../../flex-hooks/strings';
import { validateUiVersion } from '../../../../utils/configuration';

export interface OwnProps {
  task: ITask;
}

const AutoComplete = ({ task }: OwnProps) => {
  const [taskConfig, setTaskConfig] = useState<TaskQualificationConfig | null>(null);
  const [isExtended, setIsExtended] = useState(false);

  const { extendedReservationSids } = useSelector(
    (state: AppState) => state[reduxNamespace].extendedWrapup as ExtendedWrapupState,
  );

  const buttonSize = validateUiVersion('>=2.8') ? 'default' : 'small';

  useEffect(() => {
    setTaskConfig(getMatchingTaskConfiguration(task));
  }, [task]);

  useEffect(() => {
    if (
      extendedReservationSids?.find((extendedReservationSid: string) => task && extendedReservationSid === task.sid)
    ) {
      setIsExtended(true);
    } else {
      setIsExtended(false);
    }
  }, [extendedReservationSids, task]);

  const extendWrapup = () => {
    Flex.Actions.invokeAction('ExtendWrapUp', { task, extend: !isExtended });
  };

  if (taskConfig?.auto_wrapup && taskConfig?.allow_extended_wrapup) {
    return (
      <Button
        variant="secondary"
        size={buttonSize}
        element="EXTENDED_WRAPUP_BUTTON"
        pressed={isExtended}
        onClick={extendWrapup}
      >
        {isExtended ? <CheckboxCheckIcon decorative /> : <PlusIcon decorative />}
        <Flex.Template source={Flex.templates[StringTemplates.ExtendWrapup]} />
      </Button>
    );
  }

  return null;
};

export default AutoComplete;
