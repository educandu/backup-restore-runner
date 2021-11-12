const superagent = require('superagent');

module.exports.getClient = (slackWebhookUrl, messagesPrefix = '') => {
  const response = {
    notify: () => { }
  };

  if (!slackWebhookUrl) {
    return response;
  }

  const prefix = messagesPrefix ? `_${messagesPrefix}_ \n` : '';

  return {
    notify: async (message, error) => {
      const successtText = `${prefix}:white_check_mark: ${message}`;

      const errorText
        = '<!channel> \n'
        + `${prefix}`
        + `:x: ${message} \n`
        + `\`\`\`${JSON.stringify({ message: error?.message, stack: error?.stack })}\`\`\``;

      try {
        await superagent
          .post(slackWebhookUrl)
          .type('json')
          .send({ text: error ? errorText : successtText });
      } catch (slackError) {
        console.log(slackError);
      }
    }
  };
};
