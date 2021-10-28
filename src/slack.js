const superagent = require('superagent');

module.exports.getClient = slackWebhookUrl => {
  const response = {
    notify: () => { }
  };

  if (!slackWebhookUrl) {
    return response;
  }

  return {
    notify: async (message, error) => {
      const successtText = `:white_check_mark: ${message}`;
      const errorText
        = '<!channel> \n'
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
