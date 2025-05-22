import { useEffect, useState } from 'react';
import { Box } from '@twilio-paste/core/box';
import { Manager, Notifications, templates } from '@twilio/flex-ui';
import { Heading } from '@twilio-paste/core/heading';

import { StringTemplates } from '../../flex-hooks/strings';
import ParkViewTable from './ParkViewTable';
import type { ParkedInteraction } from '../../utils/ParkInteractionService';
import SyncClient, { getAllSyncMapItems } from '../../../../utils/sdk-clients/sync/SyncClient';
import { UnparkInteractionNotification } from '../../flex-hooks/notifications';
import logger from '../../../../utils/logger';

interface RecentInteraction {
  key: string;
  channel: string;
  address?: string;
  customerName?: string;
  parkingDate: Date;
  webhookSid: string;
}

const ParkView = () => {
  const [recentInteractionsList, setRecentInteractionsList] = useState<RecentInteraction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [deletedMapItem, setDeletedMapItem] = useState('');
  const workerSid = Manager?.getInstance()?.workerClient?.sid || '';

  const getParkedInteractions = useCallback(async () => {
    setIsLoaded(false);
    let getSyncMapItems: unknown[] = [];
    try {
      const map = await SyncClient.map(`ParkedInteractions_${workerSid}`);
      getSyncMapItems = await getAllSyncMapItems(map);
    } catch (error: unknown) {
      logger.error('[park-interaction] Map getItems() failed', error as object);
      Notifications.showNotification(UnparkInteractionNotification.UnparkListError, { message: error });
    }

    if (!getSyncMapItems || !getSyncMapItems.length) {
      setRecentInteractionsList([]);
      setIsLoaded(true);
      return;
    }

    const formattedSyncMapItems = getSyncMapItems
      .filter((mapItem) => {
        // Sometimes the item that was just deleted is still returned
        // So I included this fallback check
        return (
          typeof mapItem === 'object' &&
          mapItem !== null &&
          'key' in mapItem &&
          (mapItem as { key: string }).key !== deletedMapItem
        );
      })
      .map((mapItem) => {
        interface MapItemWithDescriptor {
          key: string;
          data: unknown;
          dateUpdated?: Date;
          descriptor?: {
            date_created?: string;
          };
        }
        const typedMapItem = mapItem as MapItemWithDescriptor;
        const data = typedMapItem.data as ParkedInteraction;
        if (typeof data.taskAttributes === 'string') {
          data.taskAttributes = JSON.parse(data.taskAttributes);
        }
        let parkingDate: Date | undefined;
        // We need to cast because descriptor is private
        if (typedMapItem.descriptor?.date_created) {
          parkingDate = new Date(typedMapItem.descriptor.date_created);
        } else {
          // Bug: right after sync map item created, the date_created attribute is not available in the object
          // So we need to use the date_updated, which is the same initially
          parkingDate = typedMapItem.dateUpdated;
        }

        // Use TaskRouter channel name as the main descriptor (e.g. "Chat"), and if channelType is set too - append that for
        // better identify types of interaction (e.g. "Chat (Messenger)")
        let channelDisplayText = `${data.taskChannelUniqueName[0].toUpperCase()}${data.taskChannelUniqueName.slice(1)}`;
        if (data.conversationType && data.conversationType !== data.taskChannelUniqueName) {
          channelDisplayText += ` (${data.conversationType[0].toUpperCase()}${data.conversationType.slice(1)})`;
        }

        return {
          key: mapItem.key,
          channel: channelDisplayText,
          address: data.taskAttributes.customers?.phone || data.taskAttributes.customers?.email,
          customerName: data.taskAttributes?.from,
          parkingDate,
          webhookSid: data.webhookSid,
        };
      });
    const sortedSyncMapItemsByMostRecent = formattedSyncMapItems.sort(
      (a: any, b: any) => b.parkingDate - a.parkingDate,
    );

    setRecentInteractionsList(sortedSyncMapItemsByMostRecent);
    setDeletedMapItem('');
    setIsLoaded(true);
  }, [workerSid, deletedMapItem]);

  useEffect(() => {
    getParkedInteractions();
  }, [getParkedInteractions]);

  return (
    <Box width="100%">
      <Box paddingTop="space40" paddingLeft="space60">
        <Heading as="h3" variant="heading30">
          {templates[StringTemplates.ParkedInteractions]()}
        </Heading>
      </Box>
      <ParkViewTable
        recentInteractionsList={recentInteractionsList}
        isLoaded={isLoaded}
        setDeletedMapItem={setDeletedMapItem}
        reloadTable={getParkedInteractions}
      />
    </Box>
  );
};

export default ParkView;
