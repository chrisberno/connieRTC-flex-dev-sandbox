const axios = require('axios');

exports.handler = async (context, event, callback) => {
  const twilioClient = context.getTwilioClient();
  const from = event.From || 'unknown';
  const body = event.Body || 'No message body';

  // Fetch senior data from Vercel profiles app API
  let seniorData = {};
  try {
    const response = await axios.get('https://connie-profiles-v01.vercel.app/api/profiles', {
      params: { phone: from.replace('+', '%2B') }, // Encode '+' as '%2B'
    });
    const profile = response.data.profiles && response.data.profiles.length > 0 ? response.data.profiles[0] : {};
    seniorData = {
      name: profile.firstname && profile.lastname ? `${profile.firstname} ${profile.lastname}` : 'Unknown',
      age: profile.age || 'N/A',
      address: profile.address || 'N/A',
    };
  } catch (error) {
    console.error('Error fetching senior data:', error.message);
  }

  const taskAttributes = {
    channel: 'sms',
    name: `SMS from ${from}`,
    from: from,
    body: body,
    seniorData: seniorData, // Add senior data to task attributes
  };

  try {
    const task = await twilioClient.taskrouter.workspaces(context.TWILIO_WORKSPACE_SID)
      .tasks.create({
        attributes: JSON.stringify(taskAttributes),
        workflowSid: context.TWILIO_WORKFLOW_SID,
        taskChannel: 'sms',
      });
    callback(null, { success: true, taskSid: task.sid });
  } catch (error) {
    callback(error);
  }
};