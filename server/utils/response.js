function updateResponse(statusCode, body) {
    return {
        isBase64Encoded: true | false,
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
    }
}

module.exports.updateResponse = updateResponse