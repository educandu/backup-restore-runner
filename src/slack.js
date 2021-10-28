const { WebClient } = require('@slack/web-api');

module.exports.getClient = ({ token, channel }) => {
  let client;
  const response = {
    postMessage: () => {}
  };

  if (!token || !channel) {
    return response;
  }

  try {
    client = new WebClient(token);
  } catch (error) {
    console.log(error);

    return response;
  }

  response.postMessage = async (message, error) => {
    try {
      const errorText = error ? `Error: ${JSON.stringify({ message: error?.message, stack: error?.stack })}` : '';
      const text = `${message}${errorText}`;
      await client.chat.postMessage({ text, channel });
    } catch (slackError) {
      console.log(`Error posting message '${message}' to channel slack '${channel}': `, slackError);
    }
  };

  return response;
};
